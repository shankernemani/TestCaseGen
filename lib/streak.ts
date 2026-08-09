// Streak logic over ActivityDay rows ("YYYY-MM-DD" strings, Asia/Kolkata days).
// A streak counts consecutive days ending today or yesterday (so an evening
// check-in doesn't show a broken streak before she's had the day to act).

export function toDayString(date: Date, timeZone = "Asia/Kolkata"): string {
  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/**
 * Current streak length given the set of active days and "today".
 * Consecutive run ending at today, or at yesterday if today has no activity yet.
 */
export function currentStreak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  let anchor = today;
  if (!set.has(anchor)) {
    anchor = shiftDay(today, -1);
    if (!set.has(anchor)) return 0;
  }
  let streak = 0;
  let cursor = anchor;
  while (set.has(cursor)) {
    streak++;
    cursor = shiftDay(cursor, -1);
  }
  return streak;
}

/** Longest streak ever, for the parent view. */
export function longestStreak(days: Iterable<string>): number {
  const sorted = [...new Set(days)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const day of sorted) {
    run = prev !== null && shiftDay(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}
