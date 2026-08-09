import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMentorId } from "@/lib/mentors";
import { mentorReplyStream } from "@/lib/anthropic";
import {
  buildMentorSystemPrompt,
  closeIdleSession,
  markActivityToday,
  trackReplyPersistence,
} from "@/lib/context";

const Body = z.object({
  mentorId: z.string(),
  message: z.string().min(1).max(8000),
});

// How much recent conversation rides along with each request. Older context
// lives in the rolling mentor memory (§2.3).
const HISTORY_LIMIT = 30;

// If a single un-summarized session grows past this, force-close it before
// replying — otherwise messages beyond HISTORY_LIMIT are in neither the
// window nor the mentor's memory.
const FORCE_CLOSE_THRESHOLD = 60;

// Streams the mentor's reply as plain text chunks. Non-OK responses are JSON
// ({ error }); the client branches on res.ok.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isMentorId(parsed.data.mentorId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mentorId, message } = parsed.data;

  // If she's returning after >30 idle minutes — or the current session has
  // outgrown the history window — fold it into mentor memory first. The
  // force-close path is deliberately synchronous: the message that crosses
  // the threshold pays one Haiku round-trip so no context is ever lost
  // (running it detached would race the reply we're about to stream).
  try {
    const pendingCount = await prisma.chatMessage.count({
      where: { mentorId, summarized: false },
    });
    await closeIdleSession(mentorId, pendingCount > FORCE_CLOSE_THRESHOLD);
  } catch {
    // Memory maintenance must never block the chat itself.
  }

  const system = await buildMentorSystemPrompt(mentorId);

  const history = await prisma.chatMessage.findMany({
    where: { mentorId, summarized: false },
    orderBy: { createdAt: "desc" },
    take: HISTORY_LIMIT,
  });
  history.reverse();
  // The window may cut mid-exchange; the API requires the first turn to be
  // from the user, so drop any leading assistant messages.
  while (history.length > 0 && history[0].role === "assistant") {
    history.shift();
  }

  const turns = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Open the stream and await the FIRST event before responding, so that
  // auth/connection failures surface as a clean JSON error instead of a
  // broken stream.
  let stream: ReturnType<typeof mentorReplyStream>;
  let iterator: AsyncIterator<unknown>;
  let first: IteratorResult<unknown>;
  try {
    stream = mentorReplyStream(system, turns);
    iterator = stream[Symbol.asyncIterator]();
    first = await iterator.next();
  } catch (err) {
    const detail =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? err.message
        : "The mentor couldn't reply right now. Please try again in a moment.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  // Persist the user turn up front so history is correct even if the reply
  // stream fails partway.
  await prisma.chatMessage.create({
    data: { mentorId, role: "user", content: message },
  });

  // The model stream is consumed and PERSISTED independently of the client
  // connection: if she locks her phone mid-reply, the assistant message still
  // lands in history instead of being lost.
  let clientGone = false;
  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      const forward = (event: unknown) => {
        if (clientGone) return;
        const e = event as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (
          e.type === "content_block_delta" &&
          e.delta?.type === "text_delta" &&
          typeof e.delta.text === "string"
        ) {
          try {
            controller.enqueue(encoder.encode(e.delta.text));
          } catch {
            clientGone = true; // client disconnected; keep consuming to persist
          }
        }
      };
      const persistTask = (async () => {
        try {
          if (!first.done) forward(first.value);
          for (;;) {
            const result = await iterator.next();
            if (result.done) break;
            forward(result.value);
          }
          const final = await stream.finalMessage();
          let reply = final.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
            .trim();
          // Make a hard cutoff visible instead of persisting it as complete.
          if (final.stop_reason === "max_tokens") reply += " …";
          if (reply) {
            await prisma.chatMessage.create({
              data: { mentorId, role: "assistant", content: reply },
            });
            await markActivityToday();
          }
          if (!clientGone) {
            try {
              controller.close();
            } catch {
              // already closed/cancelled
            }
          }
        } catch (err) {
          if (!clientGone) {
            try {
              controller.error(err);
            } catch {
              // already closed/cancelled
            }
          }
        }
      })();
      // A session close must wait for this reply to land before summarizing.
      trackReplyPersistence(mentorId, persistTask);
    },
    cancel() {
      clientGone = true;
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
