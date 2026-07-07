import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { CalendarClock, Download, Flame, ScrollText, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { getDeadlines } from "@/lib/deadlines";
import { computeStreak } from "@/lib/streak";
import { STAGES, stageForGrade } from "@/lib/stages";
import { MENTORS, type MentorId } from "@/lib/prompts";
import Arohanam from "@/components/Arohanam";
import ParentBrief from "@/components/ParentBrief";
import DeadlineEditor from "@/components/DeadlineEditor";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const role = getSessionRole();
  if (!role) redirect("/login");
  if (role !== "parent") redirect("/today");

  const [profile, tasks, practice, sessions, deadlines] = await Promise.all([
    db.profile.findUnique({ where: { id: "student" } }),
    db.task.findMany(),
    db.practiceLog.findMany({ orderBy: { date: "desc" }, take: 60 }),
    db.sessionLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    getDeadlines(),
  ]);

  const grade = profile?.grade ?? 8;
  const activeStage = stageForGrade(grade);
  const stageTasks = tasks.filter((t) => t.stage === activeStage && t.status !== "suggested");
  const progress =
    stageTasks.length === 0
      ? 0
      : stageTasks.filter((t) => t.status === "done").length / stageTasks.length;
  const streak = computeStreak(practice.map((p) => p.date));
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-3xl font-semibold">Parent view</h1>
          <p className="mt-1 text-sm text-ink/60">
            {profile?.name}&apos;s progress — Grade {grade},{" "}
            {STAGES.find((s) => s.id === activeStage)?.theme.toLowerCase()} year.
          </p>
        </header>

        {/* §0.5: visibility without surveillance — stated explicitly. */}
        <div className="card flex items-start gap-3 border-peacock/40 bg-peacock-light">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-peacock-dark" aria-hidden />
          <p className="text-sm text-ink/75">
            You see goals, streaks, and short session summaries —{" "}
            <strong>never her chat transcripts</strong>. Trust is what keeps her using this
            honestly.
          </p>
        </div>

        <section className="card">
          <Arohanam activeStage={activeStage} progress={progress} />
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="card">
            <div className="flex items-center gap-2">
              <Flame
                size={20}
                className={streak > 0 ? "text-marigold" : "text-ink/30"}
                fill={streak > 0 ? "#E8A020" : "none"}
                aria-hidden
              />
              <span className="font-display text-2xl font-semibold">{streak}</span>
            </div>
            <p className="mt-1 text-xs text-ink/60">day practice streak</p>
          </div>
          <div className="card">
            <span className="font-display text-2xl font-semibold">{doneCount}</span>
            <p className="mt-1 text-xs text-ink/60">roadmap tasks completed</p>
          </div>
        </section>

        <ParentBrief />

        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <ScrollText size={18} className="text-slate" aria-hidden /> Recent session summaries
          </h2>
          {sessions.length === 0 ? (
            <p className="mt-1 text-sm text-ink/60">No mentor sessions summarized yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {sessions.map((s) => (
                <li key={s.id} className="border-l-2 border-mist pl-3 text-sm">
                  <p className="text-xs font-medium text-ink/50">
                    {MENTORS[s.mentorId as MentorId]?.name ?? s.mentorId} ·{" "}
                    {format(s.createdAt, "d MMM yyyy")}
                  </p>
                  <p className="mt-0.5 text-ink/75">{s.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <CalendarClock size={18} className="text-peacock" aria-hidden /> Deadline radar
          </h2>
          <p className="mt-1 text-xs text-ink/55">
            Windows shift each year — tap the pencil to set the next real date.
          </p>
          <DeadlineEditor
            deadlines={deadlines.map((d) => ({
              id: d.id,
              name: d.name,
              typicalWindow: d.typicalWindow,
              eligibility: d.eligibility,
              url: d.url,
              nextDate: d.nextDate?.toISOString() ?? null,
              relevantFromGrade: d.relevantFromGrade,
            }))}
          />
        </section>

        <a href="/api/portfolio/export?format=md" className="btn-quiet w-full" download>
          <Download size={17} className="mr-1.5" aria-hidden /> Export portfolio (Markdown)
        </a>

        <Link href="/parent/honest-notes" className="card block transition-colors hover:border-peacock">
          <p className="font-display font-semibold">Honest Notes</p>
          <p className="text-sm text-ink/60">
            The family&apos;s research: funding map, bright lines, and when to bring in a human.
          </p>
        </Link>

        <LogoutButton />
      </div>
    </div>
  );
}
