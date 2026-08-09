import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isMentorId } from "@/lib/mentors";
import { mentorReply } from "@/lib/anthropic";
import {
  buildMentorSystemPrompt,
  closeIdleSession,
  markActivityToday,
} from "@/lib/context";

const Body = z.object({
  mentorId: z.string(),
  message: z.string().min(1).max(8000),
});

// How much recent conversation rides along with each request. Older context
// lives in the rolling mentor memory (§2.3).
const HISTORY_LIMIT = 30;

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

  // If she's returning after >30 idle minutes, fold the previous session into
  // mentor memory before this one starts.
  try {
    await closeIdleSession(mentorId);
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

  const turns = [
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  let reply: string;
  try {
    reply = await mentorReply(system, turns);
  } catch (err) {
    const detail =
      err instanceof Error && err.message.includes("ANTHROPIC_API_KEY")
        ? err.message
        : "The mentor couldn't reply right now. Please try again in a moment.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  await prisma.$transaction([
    prisma.chatMessage.create({
      data: { mentorId, role: "user", content: message },
    }),
    prisma.chatMessage.create({
      data: { mentorId, role: "assistant", content: reply },
    }),
  ]);
  await markActivityToday();

  return NextResponse.json({ reply });
}
