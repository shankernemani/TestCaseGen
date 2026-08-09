import { redirect } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { CalendarClock, Settings, HeartHandshake } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { capstoneMix, stageForGrade, stageProgress } from "@/lib/stages";
import {
  currentStreak,
  lastSevenActive,
  longestStreak,
  toDayString,
} from "@/lib/streak";
import { isCheckInDue } from "@/lib/checkin";
import { lastSevenDays, sevenDayBars } from "@/lib/practice";
import ArohanamTracker from "@/components/ArohanamTracker";
import CapstoneMeter from "@/components/CapstoneMeter";
import GoalList from "@/components/GoalList";
import BottomNav from "@/components/BottomNav";
import MemorySweeper from "@/components/MemorySweeper";
import { PracticeTile, StreakTile } from "@/components/StatTiles";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  // Deadlines stay visible through their whole due DAY (Asia/Kolkata), not
  // just until the stored timestamp passes.
  const today = toDayString(new Date());
  const todayStartIST = new Date(`${today}T00:00:00+05:30`);

  const [profile, allGoals, deadlines, activityDays, practiceLogs] =
    await Promise.all([
      prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
      prisma.goal.findMany({
        // nulls:last — otherwise SQLite floats undated goals above imminent ones
        orderBy: [
          { dueDate: { sort: "asc", nulls: "last" } },
          { createdAt: "asc" },
        ],
      }),
      prisma.deadline.findMany({
        where: { date: { gte: todayStartIST, lte: addDays(new Date(), 45) } },
        orderBy: { date: "asc" },
      }),
      prisma.activityDay.findMany(),
      prisma.practiceLog.findMany({ orderBy: { day: "desc" }, take: 100 }),
    ]);

  const stage = stageForGrade(profile?.grade ?? 8);
  const progress = stageProgress(allGoals, stage);
  const mix = capstoneMix(allGoals);
  const days = activityDays.map((d) => d.day);
  const streak = currentStreak(days, today);
  const best = longestStreak(days);

  const week = lastSevenDays(practiceLogs, today);
  const weekMinutes = week.reduce((sum, l) => sum + l.minutes, 0);
  const weekDays = new Set(week.map((l) => l.day)).size;
  const bars = sevenDayBars(practiceLogs, today);

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
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <header className="flex items-start justify-between">
        <div>
          <p className="eyebrow">{format(new Date(), "EEEE, d MMMM")}</p>
          <h1 className="mt-1 font-display text-2xl font-bold md:text-[28px]">
            {greeting}, Sarvagna
          </h1>
        </div>
        <Link
          href="/settings"
          aria-label="Profile & settings"
          className="rounded-full border border-silk-300 p-2 text-ink-soft transition-colors hover:bg-silk-100 md:hidden"
        >
          <Settings size={18} />
        </Link>
      </header>
      <MemorySweeper />

      <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Primary column: the journey and the work */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ArohanamTracker
            currentStage={stage}
            done={progress.done}
            total={progress.total}
          />

          {checkInDue && (
            <Link
              href="/mentors/priya"
              className="card flex items-center gap-3 border-peacock-200 bg-peacock-50 transition-shadow hover:shadow-pop"
            >
              <HeartHandshake size={20} className="shrink-0 text-peacock-600" />
              <p className="text-sm leading-snug text-peacock-700">
                <strong>Monthly check-in time.</strong> Priya's ready to look
                at how the month went and pick your next three actions. →
              </p>
            </Link>
          )}

          {suggested.length > 0 && (
            <section>
              <h2 className="eyebrow mb-2 px-1">Your mentors suggested</h2>
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
              <h2 className="eyebrow">This week</h2>
              <Link
                href="/roadmap"
                className="text-xs font-medium text-peacock-600 hover:text-peacock-700"
              >
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
        </div>

        {/* Secondary column: numbers, dates, balance */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <PracticeTile
              weekMinutes={weekMinutes}
              weekDays={weekDays}
              bars={bars}
            />
            <StreakTile
              streak={streak}
              best={best}
              activeDays={lastSevenActive(days, today)}
            />
          </div>

          <section className="card">
            <div className="flex items-baseline justify-between">
              <h2 className="eyebrow flex items-center gap-1.5">
                <CalendarClock size={13} className="text-marigold" /> Coming up
              </h2>
              <Link
                href="/deadlines"
                className="text-xs font-medium text-peacock-600 hover:text-peacock-700"
              >
                Manage →
              </Link>
            </div>
            {deadlines.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {deadlines.map((d) => (
                  <li key={d.id} className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-marigold-50">
                      <span className="text-[9px] font-bold uppercase leading-none text-marigold-700">
                        {format(d.date, "MMM")}
                      </span>
                      <span className="text-sm font-bold leading-tight text-marigold-700 tabular-nums">
                        {format(d.date, "d")}
                      </span>
                    </span>
                    <p className="min-w-0 pt-0.5 text-[13px] leading-snug text-ink">
                      {d.title}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-faint">
                Nothing in the next 45 days.
              </p>
            )}
          </section>

          <CapstoneMeter mix={mix} />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
