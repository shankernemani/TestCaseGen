import { redirect } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";
import { Flame, CalendarClock } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { capstoneMix, stageForGrade, stageProgress } from "@/lib/stages";
import { currentStreak, toDayString } from "@/lib/streak";
import ArohanamTracker from "@/components/ArohanamTracker";
import CapstoneMeter from "@/components/CapstoneMeter";
import GoalList from "@/components/GoalList";
import BottomNav from "@/components/BottomNav";

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
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-marigold-50 px-3 py-1.5 text-sm font-semibold text-marigold-700">
            <Flame size={16} /> {streak}
          </div>
        )}
      </header>

      <ArohanamTracker
        currentStage={stage}
        done={progress.done}
        total={progress.total}
      />

      {deadlines.length > 0 && (
        <section className="card border-marigold-200 bg-marigold-50">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-marigold-700">
            <CalendarClock size={16} /> Coming up
          </h2>
          <ul className="space-y-1.5">
            {deadlines.map((d) => (
              <li key={d.id} className="text-sm leading-snug">
                <span className="font-semibold">{format(d.date, "d MMM")}</span>{" "}
                — {d.title}
              </li>
            ))}
          </ul>
        </section>
      )}

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
