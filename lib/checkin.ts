// Priya's monthly check-in cadence (her persona runs "short monthly
// check-ins"; the dashboard nudges when one is due).

export const CHECK_IN_INTERVAL_DAYS = 30;

export function daysSince(from: Date, now: Date): number {
  return Math.floor((now.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

/** Due when there has never been a check-in, or the last one is ≥30 days old. */
export function isCheckInDue(lastCheckInAt: Date | null, now: Date): boolean {
  if (!lastCheckInAt) return true;
  return daysSince(lastCheckInAt, now) >= CHECK_IN_INTERVAL_DAYS;
}

/** Context line injected into Priya's prompt. */
export function checkInContextLine(
  lastCheckInAt: Date | null,
  now: Date,
): string {
  if (!lastCheckInAt) {
    return "MONTHLY CHECK-IN STATUS: you have never run a monthly check-in with her — offer to run the first one.";
  }
  const days = daysSince(lastCheckInAt, now);
  if (days >= CHECK_IN_INTERVAL_DAYS) {
    return `MONTHLY CHECK-IN STATUS: the last check-in was ${days} days ago — a new monthly check-in is due; offer to run it.`;
  }
  return `MONTHLY CHECK-IN STATUS: last check-in was ${days} days ago; the next is due in about ${CHECK_IN_INTERVAL_DAYS - days} days.`;
}
