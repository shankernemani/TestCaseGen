import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { buildLiveContext, practiceContext } from "@/lib/context";
import { mentorStream, logUsage, MODELS } from "@/lib/anthropic";
import {
  buildMentorSystemPrompt,
  extractTaskMarker,
  MENTOR_IDS,
  COACHING_DECLINE_TEMPLATE,
  KIND_REDIRECT_TEMPLATE,
  type MentorId,
} from "@/lib/prompts";
import { isGhostwriteRequest, isSensitiveTopic, exceedsWordLimit } from "@/lib/safety";
import { isOverDailyLimit, REST_MESSAGE } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ChatSchema = z.object({
  mentorId: z.enum(MENTOR_IDS as [MentorId, ...MentorId[]]),
  message: z.string().min(1).max(20_000), // paste-friendly for long drafts
});

function sseEncode(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

/** Stream a canned template (no API call) as SSE, so the client code path is uniform. */
function templateStream(text: string, extra: Record<string, unknown> = {}) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(sseEncode({ type: "text", text }));
      controller.enqueue(sseEncode({ type: "done", ...extra }));
      controller.close();
    },
  });
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

export async function POST(req: NextRequest) {
  if (getSessionRole() !== "student") {
    return Response.json({ error: "Please log in." }, { status: 401 });
  }

  const parsed = ChatSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mentorId, message } = parsed.data;

  // §3.2 rate limit — gentle, and no API cost.
  if (await isOverDailyLimit()) {
    return new Response(templateStream(REST_MESSAGE, { rateLimited: true }), {
      headers: SSE_HEADERS,
    });
  }

  // §7 sensitive topics: kind redirect, flagged so it never enters memory,
  // and the client quietly shows the "Talk to Amma/Appa?" card.
  if (isSensitiveTopic(message)) {
    await db.message.create({
      data: { mentorId, role: "user", content: message, flagged: true },
    });
    await db.message.create({
      data: { mentorId, role: "assistant", content: KIND_REDIRECT_TEMPLATE, flagged: true },
    });
    return new Response(templateStream(KIND_REDIRECT_TEMPLATE, { sensitive: true }), {
      headers: SSE_HEADERS,
    });
  }

  // §7 ghostwriting short-circuit — belt-and-braces beyond the prompt rule.
  if (isGhostwriteRequest(message)) {
    await db.message.create({ data: { mentorId, role: "user", content: message } });
    await db.message.create({
      data: { mentorId, role: "assistant", content: COACHING_DECLINE_TEMPLATE },
    });
    return new Response(templateStream(COACHING_DECLINE_TEMPLATE), {
      headers: SSE_HEADERS,
    });
  }

  // Persist her message, then build the prompt (§2.1) + last 20 messages.
  await db.message.create({ data: { mentorId, role: "user", content: message } });

  const ctx = await buildLiveContext(mentorId);
  let system = buildMentorSystemPrompt(mentorId, ctx);
  if (mentorId === "meera") {
    system += `\n${await practiceContext()}`;
  }

  const history = await db.message.findMany({
    where: { mentorId, flagged: false },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const messages = history
    .reverse()
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Pressure applied this turn → reset the flag (§7).
  if (ctx.pressureNext) {
    await db.mentor.update({ where: { id: mentorId }, data: { pressureNext: false } });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        const anthropicStream = mentorStream(system, messages);

        anthropicStream.on("text", (text) => {
          full += text;
          controller.enqueue(sseEncode({ type: "text", text }));
        });

        const final = await anthropicStream.finalMessage();
        await logUsage(MODELS.chat, final.usage.input_tokens, final.usage.output_tokens);

        // Persist reply and surface the suggested-task chip (§3.2).
        const { task } = extractTaskMarker(full);
        await db.message.create({ data: { mentorId, role: "assistant", content: full } });

        // §7 output check: over 250 words → pressure next turn, and log it.
        if (exceedsWordLimit(full)) {
          console.warn(`[safety] ${mentorId} reply exceeded 250 words — pressure next turn`);
          await db.mentor.update({ where: { id: mentorId }, data: { pressureNext: true } });
        }

        controller.enqueue(sseEncode({ type: "done", task }));
      } catch (err) {
        const msg =
          err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
            ? "The mentors aren't connected yet — ask Appa to add the API key."
            : "Hmm, I couldn't reply just now. Try once more in a moment?";
        console.error("[chat] stream error:", err);
        controller.enqueue(sseEncode({ type: "error", message: msg }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
