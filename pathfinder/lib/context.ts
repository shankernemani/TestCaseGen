import { format, differenceInYears } from "date-fns";
import { db } from "./db";
import type { LiveContext } from "./prompts";

/**
 * §2.1 LIVE_CONTEXT: profile + top 6 open goals + last 3 journal wins +
 * mentor rolling memory + today's date.
 */
export async function buildLiveContext(mentorId: string): Promise<LiveContext> {
  const [profile, mentor, openTasks, recentJournal] = await Promise.all([
    db.profile.findUnique({ where: { id: "student" } }),
    db.mentor.findUnique({ where: { id: mentorId } }),
    db.task.findMany({
      where: { status: { in: ["todo", "doing"] } },
      orderBy: [{ due: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
    db.journalEntry.findMany({ orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  if (!profile) throw new Error("Student profile missing — run prisma db seed.");

  // Born ~2012 per spec; fall back to grade-based estimate if no DOB.
  const age = profile.dob
    ? differenceInYears(new Date(), profile.dob)
    : profile.grade + 5;

  return {
    grade: profile.grade,
    age,
    interests: profile.interests,
    strengths: profile.strengths,
    notes: profile.notes,
    openGoals: openTasks.map((t) => t.title),
    recentWins: recentJournal.map((j) => j.text),
    memorySummary: mentor?.memorySummary ?? "",
    date: format(new Date(), "EEEE, d MMMM yyyy"),
    pressureNext: mentor?.pressureNext ?? false,
  };
}

/** Extra domain context for Meera (§3.6): last 14 days of practice. */
export async function practiceContext(): Promise<string> {
  const since = new Date();
  since.setDate(since.getDate() - 14);
  const logs = await db.practiceLog.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "asc" },
  });
  if (logs.length === 0) return "PRACTICE LOG (last 14 days): nothing logged.";
  const lines = logs.map(
    (l) => `${format(l.date, "d MMM")}: ${l.minutes} min${l.note ? ` (${l.note})` : ""}`
  );
  return `PRACTICE LOG (last 14 days): ${lines.join("; ")}`;
}
