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
      // nulls:last — SQLite otherwise sorts NULL dueDate first, letting
      // undated goals crowd an imminent deadline out of the top 6.
      orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
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
  // The spec places her inside the Queen's Commonwealth Junior (<14) window
  // in Aug 2026 with birth year ~2012, i.e. a late-year birthday — so assume
  // the birthday hasn't happened yet until October.
  const now = new Date();
  const age = now.getFullYear() - birthYear - (now.getMonth() < 9 ? 1 : 0);

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

// Streaming replies persist from a detached task after the client disconnects
// (see /api/chat). A close must not summarize while such a persist is still
// in flight, or the reply lands orphaned outside its own session's summary.
const inFlightReplies = new Map<string, Promise<void>>();

export function trackReplyPersistence(
  mentorId: string,
  task: Promise<unknown>,
): void {
  const entry: Promise<void> = task
    .then(
      () => undefined,
      () => undefined,
    )
    .finally(() => {
      if (inFlightReplies.get(mentorId) === entry) {
        inFlightReplies.delete(mentorId);
      }
    });
  inFlightReplies.set(mentorId, entry);
}

// One close per mentor at a time within this process: the sweep, the chat
// route, and the explicit-close endpoint can all fire concurrently (React
// strict mode even double-fires the sweep), and each close spends seconds in
// a Haiku call before writing. A force close arriving while a non-force close
// runs must NOT be coalesced into it (the non-force one may no-op on a fresh
// session), so it queues behind instead.
const inFlightCloses = new Map<
  MentorId,
  { force: boolean; promise: Promise<boolean> }
>();

/**
 * §2.3: close any "session" of un-summarized messages whose last message is
 * older than the idle window (or immediately when force=true). Runs Haiku to
 * summarize, merges the rolling memory, and appends commitments as roadmap
 * tasks with status "suggested".
 */
export function closeIdleSession(
  mentorId: MentorId,
  force = false,
): Promise<boolean> {
  const existing = inFlightCloses.get(mentorId);
  if (existing && (existing.force || !force)) return existing.promise;
  const prior = existing?.promise.catch(() => false) ?? Promise.resolve(false);
  const promise = prior
    .then(() => doCloseIdleSession(mentorId, force))
    .finally(() => {
      const current = inFlightCloses.get(mentorId);
      if (current && current.promise === promise) {
        inFlightCloses.delete(mentorId);
      }
    });
  inFlightCloses.set(mentorId, { force, promise });
  return promise;
}

async function doCloseIdleSession(
  mentorId: MentorId,
  force: boolean,
): Promise<boolean> {
  // Let any in-flight reply land first so the transcript we summarize is
  // complete (and the reply isn't stranded outside the summarized set).
  const replyInFlight = inFlightReplies.get(mentorId);
  if (replyInFlight) await replyInFlight;

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

  // Guarded write: marking the messages summarized doubles as the race lock.
  // If ANY of our set was already summarized by a concurrent closer, our
  // transcript overlaps theirs — abort (rolling back the partial mark) and
  // let a later sweep handle whatever remains. No duplicate suggested goals,
  // no double memory merge.
  const STALE = new Error("STALE_PENDING_SET");
  try {
    return await prisma.$transaction(async (tx) => {
      const { count } = await tx.chatMessage.updateMany({
        where: { id: { in: pending.map((m) => m.id) }, summarized: false },
        data: { summarized: true },
      });
      if (count !== pending.length) throw STALE;

      await tx.mentorMemory.upsert({
        where: { mentorId },
        create: {
          mentorId,
          summary: summary.memory_summary,
          lastSessionSummary: summary.session_summary,
        },
        update: {
          summary: summary.memory_summary,
          lastSessionSummary: summary.session_summary,
        },
      });
      for (const title of summary.commitments) {
        await tx.goal.create({
          data: { title, status: "suggested", source: mentorId, stage },
        });
      }
      // A closed Priya session counts as her (at least partial) monthly
      // check-in, anchored to when the conversation actually happened.
      if (mentorId === "priya") {
        await tx.studentProfile.update({
          where: { id: "sarvagna" },
          data: { lastCheckInAt: last.createdAt },
        });
      }
      return true;
    });
  } catch (err) {
    if (err === STALE) return false;
    throw err;
  }
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
