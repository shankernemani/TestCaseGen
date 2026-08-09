// Pure helpers for the Carnatic practice log.

export interface PracticeEntry {
  day: string; // "YYYY-MM-DD"
  minutes: number;
  what: string;
}

function shiftDay(day: string, delta: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Entries within the 7 days ending at `today` (inclusive). */
export function lastSevenDays(
  entries: PracticeEntry[],
  today: string,
): PracticeEntry[] {
  const start = shiftDay(today, -6);
  return entries.filter((e) => e.day >= start && e.day <= today);
}

/** Minutes practiced per day for the 7 days ending at `today` (oldest first).
 * Feeds the dashboard's practice stat-tile sparkline. */
export function sevenDayBars(
  entries: PracticeEntry[],
  today: string,
): number[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(shiftDay(today, -i));
  return days.map((day) =>
    entries
      .filter((e) => e.day === day)
      .reduce((sum, e) => sum + e.minutes, 0),
  );
}

/**
 * One-line summary for Meera's prompt context, e.g.
 * "Practiced 4 of the last 7 days, 135 minutes total. Most recent: 30 min — varnam (2026-08-08)."
 * Returns "" when there are no entries at all (section omitted from prompt).
 */
export function practiceSummary(
  entries: PracticeEntry[],
  today: string,
): string {
  if (entries.length === 0) return "";
  const week = lastSevenDays(entries, today);
  if (week.length === 0) {
    const latest = [...entries].sort((a, b) => (a.day < b.day ? 1 : -1))[0];
    return `No practice logged in the last 7 days. Last entry: ${latest.minutes} min — ${latest.what} (${latest.day}).`;
  }
  const days = new Set(week.map((e) => e.day)).size;
  const total = week.reduce((sum, e) => sum + e.minutes, 0);
  const latest = [...week].sort((a, b) => (a.day < b.day ? 1 : -1))[0];
  return `Practiced ${days} of the last 7 days, ${total} minutes total. Most recent: ${latest.minutes} min — ${latest.what} (${latest.day}).`;
}
