import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Flame, ShieldCheck, Download, CalendarClock } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { MENTOR_IDS, MENTORS } from "@/lib/mentors";
import { MENTOR_TEXT } from "@/components/mentorColors";
import { capstoneMix, stageForGrade, stageProgress } from "@/lib/stages";
import { currentStreak, longestStreak, toDayString } from "@/lib/streak";
import ArohanamTracker from "@/components/ArohanamTracker";
import CapstoneMeter from "@/components/CapstoneMeter";
import GoalList from "@/components/GoalList";
import LogoutButton from "@/components/LogoutButton";
import MemorySweeper from "@/components/MemorySweeper";

export const dynamic = "force-dynamic";

export default async function ParentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "PARENT") redirect("/");

  const [profile, goals, activityDays, memories] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.goal.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.activityDay.findMany(),
    prisma.mentorMemory.findMany(),
  ]);

  const stage = stageForGrade(profile?.grade ?? 8);
  const progress = stageProgress(goals, stage);
  const mix = capstoneMix(goals);
  const days = activityDays.map((d) => d.day);
  const streak = currentStreak(days, toDayString(new Date()));
  const best = longestStreak(days);
  const openGoals = goals.filter((g) => g.status === "open");
  const doneGoals = goals.filter((g) => g.status === "done").slice(-5).reverse();

  return (
    <main className="flex flex-col gap-4 px-4 pb-10 pt-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Parent view</h1>
          <p className="text-sm text-ink-soft">
            Sarvagna · Grade {profile?.grade ?? 8} · thread:{" "}
            <em>{profile?.thread}</em>
          </p>
        </div>
        <LogoutButton />
      </header>
      <MemorySweeper />

      <div className="card flex items-start gap-3 border-peacock-200 bg-peacock-50">
        <ShieldCheck size={20} className="mt-0.5 shrink-0 text-peacock-600" />
        <p className="text-xs leading-relaxed text-peacock-700">
          You can see goals, streaks, and mentor session summaries here —{" "}
          <strong>never her raw chat transcripts</strong>. Visibility without
          surveillance is a deliberate design choice.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="card flex-1 text-center">
          <p className="flex items-center justify-center gap-1 font-display text-2xl font-bold text-marigold-600">
            <Flame size={20} /> {streak}
          </p>
          <p className="text-xs text-ink-faint">current streak</p>
        </div>
        <div className="card flex-1 text-center">
          <p className="font-display text-2xl font-bold text-peacock-600">{best}</p>
          <p className="text-xs text-ink-faint">longest streak</p>
        </div>
        <div className="card flex-1 text-center">
          <p className="font-display text-2xl font-bold text-plum-600">
            {goals.filter((g) => g.status === "done").length}
          </p>
          <p className="text-xs text-ink-faint">goals done</p>
        </div>
      </div>

      <ArohanamTracker currentStage={stage} done={progress.done} total={progress.total} />
      <CapstoneMeter mix={mix} />

      <div className="flex gap-3">
        <Link
          href="/deadlines"
          className="card flex flex-1 items-center gap-2 text-sm font-semibold text-marigold-700"
        >
          <CalendarClock size={18} /> Manage deadlines
        </Link>
        <a
          href="/api/export"
          download
          className="card flex flex-1 items-center gap-2 text-sm font-semibold text-peacock-700"
        >
          <Download size={18} /> Backup data
        </a>
      </div>

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          Open goals ({openGoals.length})
        </h2>
        <GoalList
          readOnly
          goals={openGoals.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            source: g.source,
            dueLabel: g.dueDate ? format(g.dueDate, "d MMM yyyy") : null,
          }))}
        />
      </section>

      {doneGoals.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
            Recently completed
          </h2>
          <GoalList
            readOnly
            goals={doneGoals.map((g) => ({
              id: g.id,
              title: g.title,
              status: g.status,
              source: g.source,
            }))}
          />
        </section>
      )}

      <section>
        <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
          Mentor session summaries
        </h2>
        <div className="flex flex-col gap-2">
          {MENTOR_IDS.map((id) => {
            const memory = memories.find((m) => m.mentorId === id);
            const mentor = MENTORS[id];
            return (
              <div key={id} className="card py-3">
                <p className={`text-sm font-semibold ${MENTOR_TEXT[mentor.color]}`}>
                  {mentor.name} · {mentor.role}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {memory?.summary ?? "No sessions yet."}
                </p>
                {memory && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Updated {format(memory.updatedAt, "d MMM yyyy")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
