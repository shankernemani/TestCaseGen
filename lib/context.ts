// Assembles the LIVE_CONTEXT portion of every mentor prompt (§2.1) from the
// database, and handles the §2.3 session-close memory pass.

import { format } from "date-fns";
import { prisma } from "./db";
import type { MentorId } from "./mentors";
import { MENTORS } from "./mentors";
import type { PromptContext } from "./prompts";
import { buildSessionSummaryPrompt, buildSystemPrompt } from "./prompts";
import { summarizeSession } from "./anthropic";
import { stageForGrade } from "./stages";
import { toDayString } from "./streak";
import { practiceSummary } from "./practice";
import { checkInContextLine } from "./checkin";
import { MENTOR_IDS } from "./mentors";

export async function loadPromptContext(
  mentorId: MentorId,
): Promise<PromptContext> {
  const [profile, goals, wins, memory] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.goal.findMany({
      where: { status: "open" },
      orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    prisma.journalEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.mentorMemory.findUnique({ where: { mentorId } }),
  ]);

  const grade = profile?.grade ?? 8;
  const birthYear = profile?.birthYear ?? 2012;
  const age = new Date().getFullYear() - birthYear;

  // Mentor-specific live context (§2.2 focuses): Meera coaches practice
  // consistency, Priya runs the monthly check-in cadence.
  const extras: string[] = [];
  if (mentorId === "meera") {
    const logs = await prisma.practiceLog.findMany({
      orderBy: { day: "desc" },
      take: 60,
    });
    const summary = practiceSummary(logs, toDayString(new Date()));
    if (summary) extras.push(`HER PRACTICE LOG: ${summary}`);
    else
      extras.push(
        "HER PRACTICE LOG: empty so far — gently encourage her to log her first practice session in the Practice tab.",
      );
  }
  if (mentorId === "priya") {
    extras.push(checkInContextLine(profile?.lastCheckInAt ?? null, new Date()));
  }

  return {
    extras,
    grade,
    age,
    interests: profile?.interests ?? "Interests still being explored",
    strengths: profile?.strengths ?? "",
    notes: profile?.notes ?? "",
    thread: profile?.thread ?? "(not yet defined)",
    openGoals: goals.map((g) =>
      g.dueDate ? `${g.title} (due ${format(g.dueDate, "d MMM yyyy")})` : g.title,
    ),
    recentWins: wins.map((w) => w.content),
    memorySummary: memory?.summary ?? "",
    date: format(new Date(), "d MMMM yyyy"),
  };
}

export async function buildMentorSystemPrompt(
  mentorId: MentorId,
): Promise<string> {
  const ctx = await loadPromptContext(mentorId);
  return buildSystemPrompt(mentorId, ctx);
}

/** Marks today (Asia/Kolkata) as an active day for streaks. */
export async function markActivityToday(): Promise<void> {
  const day = toDayString(new Date());
  await prisma.activityDay.upsert({
    where: { day },
    create: { day },
    update: {},
  });
}

export const SESSION_IDLE_MINUTES = 30;

/**
 * §2.3: close any "session" of un-summarized messages whose last message is
 * older than the idle window (or immediately when force=true). Runs Haiku to
 * summarize, merges the rolling memory, and appends commitments as roadmap
 * tasks with status "suggested".
 */
export async function closeIdleSession(
  mentorId: MentorId,
  force = false,
): Promise<boolean> {
  const pending = await prisma.chatMessage.findMany({
    where: { mentorId, summarized: false },
    orderBy: { createdAt: "asc" },
  });
  if (pending.length === 0) return false;

  const last = pending[pending.length - 1];
  const idleMs = Date.now() - last.createdAt.getTime();
  if (!force && idleMs < SESSION_IDLE_MINUTES * 60 * 1000) return false;

  const memory = await prisma.mentorMemory.findUnique({ where: { mentorId } });
  const prompt = buildSessionSummaryPrompt(
    MENTORS[mentorId].name,
    pending.map((m) => ({ role: m.role, content: m.content })),
    memory?.summary ?? "",
  );

  const summary = await summarizeSession(prompt);
  if (!summary) return false;

  const profile = await prisma.studentProfile.findUnique({
    where: { id: "sarvagna" },
  });
  const stage = stageForGrade(profile?.grade ?? 8);

  await prisma.$transaction([
    prisma.mentorMemory.upsert({
      where: { mentorId },
      create: { mentorId, summary: summary.memory_summary },
      update: { summary: summary.memory_summary },
    }),
    prisma.chatMessage.updateMany({
      where: { id: { in: pending.map((m) => m.id) } },
      data: { summarized: true },
    }),
    ...summary.commitments.map((title) =>
      prisma.goal.create({
        data: { title, status: "suggested", source: mentorId, stage },
      }),
    ),
    // A closed Priya session counts as her (at least partial) monthly
    // check-in, anchored to when the conversation actually happened.
    ...(mentorId === "priya"
      ? [
          prisma.studentProfile.update({
            where: { id: "sarvagna" },
            data: { lastCheckInAt: last.createdAt },
          }),
        ]
      : []),
  ]);
  return true;
}

/**
 * Closes idle sessions for every mentor. Called fire-and-forget when the
 * dashboard or parent view loads, so memory, session summaries, and suggested
 * goals stay fresh even if she never reopens a particular mentor.
 */
export async function sweepIdleSessions(): Promise<number> {
  let closed = 0;
  for (const id of MENTOR_IDS) {
    try {
      if (await closeIdleSession(id)) closed++;
    } catch {
      // One mentor failing must not block the others.
    }
  }
  return closed;
}
