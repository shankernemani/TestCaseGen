import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { backgroundCompletion } from "@/lib/anthropic";
import {
  SESSION_SUMMARY_PROMPT,
  MEMORY_MERGE_PROMPT,
  MENTORS,
  MENTOR_IDS,
  type MentorId,
} from "@/lib/prompts";
import { stageForGrade } from "@/lib/stages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CloseSchema = z.object({
  mentorId: z.enum(MENTOR_IDS as [MentorId, ...MentorId[]]),
});

// Which roadmap category a mentor's commitments default to.
const MENTOR_CATEGORY: Record<MentorId, string> = {
  priya: "Strategy",
  meera: "Music",
  arjun: "Competition",
  dev: "Writing",
  anaya: "Explore",
};

export async function POST(req: NextRequest) {
  if (getSessionRole() !== "student") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  const parsed = CloseSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { mentorId } = parsed.data;

  // Messages since the last session log — unflagged only (§7: sensitive
  // messages never enter mentor memory).
  const lastLog = await db.sessionLog.findFirst({
    where: { mentorId },
    orderBy: { createdAt: "desc" },
  });
  const messages = await db.message.findMany({
    where: {
      mentorId,
      flagged: false,
      ...(lastLog ? { createdAt: { gt: lastLog.createdAt } } : {}),
    },
    orderBy: { createdAt: "asc" },
  });

  if (messages.length < 2) {
    return NextResponse.json({ ok: true, skipped: "nothing new to summarize" });
  }

  const mentor = MENTORS[mentorId];
  const transcript = messages
    .map((m) => `${m.role === "user" ? "Sarvagna" : mentor.name}: ${m.content}`)
    .join("\n");

  try {
    // 1. Haiku: ≤120-word summary + commitments.
    const raw = await backgroundCompletion(
      SESSION_SUMMARY_PROMPT.replace("{mentorName}", mentor.name),
      [{ role: "user", content: transcript.slice(0, 30_000) }]
    );

    const summaryMatch = raw.match(/SUMMARY:\s*([\s\S]*?)(?:\nCOMMITMENTS:|$)/);
    const commitmentsMatch = raw.match(/COMMITMENTS:\s*(\[[\s\S]*?\])/);
    const summary = (summaryMatch?.[1] ?? raw).trim();

    let commitments: string[] = [];
    if (commitmentsMatch) {
      try {
        const arr = JSON.parse(commitmentsMatch[1]);
        if (Array.isArray(arr)) {
          commitments = arr.filter((c) => typeof c === "string" && c.trim()).slice(0, 5);
        }
      } catch {
        // no commitments if parse fails
      }
    }

    await db.sessionLog.create({ data: { mentorId, summary } });

    // 2. Commitments → suggested roadmap tasks (require her tap to accept).
    const profile = await db.profile.findUnique({ where: { id: "student" } });
    const stage = stageForGrade(profile?.grade ?? 8);
    for (const title of commitments) {
      await db.task.create({
        data: {
          stage,
          category: MENTOR_CATEGORY[mentorId],
          title: title.slice(0, 120),
          status: "suggested",
          source: "mentor",
          notes: `Suggested by ${mentor.name}`,
        },
      });
    }

    // 3. Merge into the rolling ≤400-word memory.
    const existing = await db.mentor.findUnique({ where: { id: mentorId } });
    const merged = await backgroundCompletion(MEMORY_MERGE_PROMPT, [
      {
        role: "user",
        content: `OLD MEMORY:\n${existing?.memorySummary || "(empty)"}\n\nNEW SESSION SUMMARY:\n${summary}`,
      },
    ]);
    await db.mentor.update({
      where: { id: mentorId },
      data: { memorySummary: merged.trim() },
    });

    return NextResponse.json({ ok: true, summary, suggestedTasks: commitments.length });
  } catch (err) {
    console.error("[session/close]", err);
    return NextResponse.json(
      { error: "Could not summarize this session right now." },
      { status: 502 }
    );
  }
}
