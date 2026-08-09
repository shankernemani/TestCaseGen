import { redirect } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { Flame, CalendarClock, Settings, HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { capstoneMix, stageForGrade, stageProgress } from "@/lib/stages";
import { currentStreak, toDayString } from "@/lib/streak";
import { isCheckInDue } from "@/lib/checkin";
import ArohanamTracker from "@/components/ArohanamTracker";
import CapstoneMeter from "@/components/CapstoneMeter";
import GoalList from "@/components/GoalList";
import BottomNav from "@/components/BottomNav";
import MemorySweeper from "@/components/MemorySweeper";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  const [profile, allGoals, deadlines, activityDays] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.goal.findMany({ orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.deadline.findMany({
      where: { date: { gte: new Date(), lte: addDays(new Date(), 45) } },
      orderBy: { date: "asc" },
    }),
    prisma.activityDay.findMany(),
  ]);

  const stage = stageForGrade(profile?.grade ?? 8);
  const progress = stageProgress(allGoals, stage);
  const mix = capstoneMix(allGoals);
  const streak = currentStreak(
    activityDays.map((d) => d.day),
    toDayString(new Date()),
  );

  const suggested = allGoals.filter((g) => g.status === "suggested");
  const topOpen = allGoals.filter((g) => g.status === "open").slice(0, 3);
  const checkInDue = isCheckInDue(profile?.lastCheckInAt ?? null, new Date());

  const hour = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hour12: false,
  });
  const h = parseInt(hour, 10);
  const greeting =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";

  return (
    <main className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {greeting}, Sarvagna
          </h1>
          <p className="text-sm text-ink-soft">{format(new Date(), "EEEE, d MMMM")}</p>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full bg-marigold-50 px-3 py-1.5 text-sm font-semibold text-marigold-700">
              <Flame size={16} /> {streak}
            </div>
          )}
          <Link
            href="/settings"
            aria-label="Profile & settings"
            className="rounded-full border border-silk-300 p-2 text-ink-soft"
          >
            <Settings size={18} />
          </Link>
        </div>
      </header>
      <MemorySweeper />

      <ArohanamTracker
        currentStage={stage}
        done={progress.done}
        total={progress.total}
      />

      {checkInDue && (
        <Link
          href="/mentors/priya"
          className="card flex items-center gap-3 border-peacock-200 bg-peacock-50"
        >
          <HeartHandshake size={20} className="shrink-0 text-peacock-600" />
          <p className="text-sm leading-snug text-peacock-700">
            <strong>Monthly check-in time.</strong> Priya's ready to look at
            how the month went and pick your next three actions. →
          </p>
        </Link>
      )}

      <section className="card border-marigold-200 bg-marigold-50">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-marigold-700">
            <CalendarClock size={16} /> Coming up
          </h2>
          <Link href="/deadlines" className="text-xs font-medium text-marigold-700">
            Manage →
          </Link>
        </div>
        {deadlines.length > 0 ? (
          <ul className="space-y-1.5">
            {deadlines.map((d) => (
              <li key={d.id} className="text-sm leading-snug">
                <span className="font-semibold">{format(d.date, "d MMM")}</span>{" "}
                — {d.title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-marigold-700/70">
            Nothing in the next 45 days.
          </p>
        )}
      </section>

      {suggested.length > 0 && (
        <section>
          <h2 className="mb-2 px-1 text-sm font-bold text-ink-soft">
            Your mentors suggested
          </h2>
          <GoalList
            goals={suggested.map((g) => ({
              id: g.id,
              title: g.title,
              status: g.status,
              source: g.source,
            }))}
          />
        </section>
      )}

      <section>
        <div className="mb-2 flex items-baseline justify-between px-1">
          <h2 className="text-sm font-bold text-ink-soft">This week</h2>
          <Link href="/roadmap" className="text-xs font-medium text-peacock-600">
            Full roadmap →
          </Link>
        </div>
        <GoalList
          goals={topOpen.map((g) => ({
            id: g.id,
            title: g.title,
            status: g.status,
            source: g.source,
            dueLabel: g.dueDate ? format(g.dueDate, "d MMM") : null,
          }))}
        />
      </section>

      <CapstoneMeter mix={mix} />

      <BottomNav />
    </main>
  );
}
