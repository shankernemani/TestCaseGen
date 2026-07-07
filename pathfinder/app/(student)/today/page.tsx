import Link from "next/link";
import { differenceInCalendarDays, subDays } from "date-fns";
import { Flame, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { stageForGrade } from "@/lib/stages";
import { computeStreak } from "@/lib/streak";
import { upcomingAlerts } from "@/lib/deadlines";
import { MENTORS, MENTOR_IDS } from "@/lib/prompts";
import Arohanam from "@/components/Arohanam";
import GoalList from "@/components/GoalList";
import MentorAvatar from "@/components/MentorAvatar";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function TodayPage() {
  const profile = await db.profile.findUnique({ where: { id: "student" } });
  const grade = profile?.grade ?? 8;
  const activeStage = stageForGrade(grade);

  const [stageTasks, topGoals, practice, lastArtifact, alerts, lastPriya, todayJournal] =
    await Promise.all([
      db.task.findMany({ where: { stage: activeStage, status: { not: "suggested" } } }),
      db.task.findMany({
        where: { status: { in: ["todo", "doing"] } },
        orderBy: [{ due: "asc" }, { createdAt: "asc" }],
        take: 3,
      }),
      db.practiceLog.findMany({ orderBy: { date: "desc" }, take: 60 }),
      db.portfolioEntry.findFirst({ orderBy: { date: "desc" } }),
      upcomingAlerts(),
      db.sessionLog.findFirst({ where: { mentorId: "priya" }, orderBy: { createdAt: "desc" } }),
      db.journalEntry.findFirst({ where: { createdAt: { gte: subDays(new Date(), 2) } } }),
    ]);

  const progress =
    stageTasks.length === 0
      ? 0
      : stageTasks.filter((t) => t.status === "done").length / stageTasks.length;
  const streak = computeStreak(practice.map((p) => p.date));
  const daysSinceArtifact = lastArtifact
    ? differenceInCalendarDays(new Date(), lastArtifact.date)
    : null;

  // §3.9 weekly rhythm — in-app nudges only.
  const dow = new Date().getDay();
  const priyaDue =
    dow === 1 &&
    (!lastPriya || differenceInCalendarDays(new Date(), lastPriya.createdAt) > 25);
  const journalNudge = dow === 5 && !todayJournal;

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold">
          {greeting()}, {profile?.name ?? "Sarvagna"}
        </h1>
      </header>

      <section className="card">
        <Arohanam activeStage={activeStage} progress={progress} />
      </section>

      {priyaDue && (
        <Link
          href="/mentors/priya"
          className="card block border-peacock bg-peacock-light transition-colors hover:border-peacock-dark"
        >
          <p className="font-display font-semibold text-peacock-dark">
            Priya&apos;s check-in is ready
          </p>
          <p className="text-sm text-ink/70">
            A month has gone by — 10 minutes to look back and plan ahead.
          </p>
        </Link>
      )}

      {journalNudge && (
        <Link
          href="/journal"
          className="card block border-plum/40 bg-plum-light transition-colors hover:border-plum"
        >
          <p className="font-display font-semibold text-plum">Friday journal moment</p>
          <p className="text-sm text-ink/70">
            Two lines: something you finished, or something that sparked you this week.
          </p>
        </Link>
      )}

      {alerts.length > 0 && (
        <section className="card border-marigold/60">
          <h2 className="font-display text-lg font-semibold">Deadline radar</h2>
          <ul className="mt-2 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-2 text-sm">
                <div>
                  <span className="font-medium">{a.name}</span>
                  <span className="text-ink/60"> — {a.daysAway} days away</span>
                </div>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Official site for ${a.name}`}
                  className="tap-target flex items-center text-peacock"
                >
                  <ExternalLink size={16} aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="font-display text-lg font-semibold">This week</h2>
        <div className="mt-3">
          <GoalList goals={topGoals} />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Link href="/practice" className="card block transition-colors hover:border-peacock">
          <div className="flex items-center gap-2">
            <Flame
              size={22}
              className={streak > 0 ? "text-marigold" : "text-ink/30"}
              fill={streak > 0 ? "#E8A020" : "none"}
              aria-hidden
            />
            <span className="font-display text-2xl font-semibold">{streak}</span>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            day practice streak{streak === 0 ? " — log today to light it" : ""}
          </p>
        </Link>
        <Link href="/portfolio" className="card block transition-colors hover:border-peacock">
          <span className="font-display text-2xl font-semibold">
            {daysSinceArtifact === null ? "—" : daysSinceArtifact}
          </span>
          <p className="mt-1 text-xs text-ink/60">
            {daysSinceArtifact === null
              ? "no shipped artifact yet — this year's goal"
              : "days since last shipped artifact"}
          </p>
        </Link>
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold">Talk to a mentor</h2>
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {MENTOR_IDS.map((id) => {
            const m = MENTORS[id];
            return (
              <Link
                key={id}
                href={`/mentors/${id}`}
                className="flex min-w-[72px] flex-col items-center gap-1"
              >
                <MentorAvatar mentorId={id} name={m.name} size="lg" />
                <span className="text-xs font-medium">{m.name}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
