import { differenceInCalendarDays, startOfDay } from "date-fns";

/**
 * §3.6 practice streak logic.
 * A streak counts consecutive days with a log, ending today or yesterday
 * (today not yet logged shouldn't kill the flame before bedtime).
 */
export function computeStreak(dates: Date[], today: Date = new Date()): number {
  if (dates.length === 0) return 0;

  const days = Array.from(
    new Set(dates.map((d) => startOfDay(d).getTime()))
  ).sort((a, b) => b - a); // newest first

  const todayStart = startOfDay(today).getTime();
  const gap = differenceInCalendarDays(todayStart, days[0]);
  if (gap > 1) return 0; // last log was before yesterday — streak broken

  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = differenceInCalendarDays(days[i - 1], days[i]);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

/** Minutes per day for the weekly chart (last 7 days, oldest first). */
export function weeklyMinutes(
  logs: { date: Date; minutes: number }[],
  today: Date = new Date()
): { day: string; minutes: number }[] {
  const out: { day: string; minutes: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfDay(today));
    d.setDate(d.getDate() - i);
    const total = logs
      .filter((l) => startOfDay(l.date).getTime() === d.getTime())
      .reduce((sum, l) => sum + l.minutes, 0);
    out.push({
      day: d.toLocaleDateString("en", { weekday: "narrow" }),
      minutes: total,
    });
  }
  return out;
}
