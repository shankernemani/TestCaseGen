import { differenceInCalendarDays } from "date-fns";
import { db } from "./db";

export type DeadlineView = {
  id: string;
  name: string;
  typicalWindow: string;
  eligibility: string;
  url: string;
  category: string;
  relevantFromGrade: number;
  nextDate: Date | null;
  daysAway: number | null;
  eligible: boolean;
};

/**
 * §3.4: deadlines computed against her current grade.
 * "Upcoming" = has a nextDate within `windowDays`.
 */
export async function getDeadlines(windowDays = 3650): Promise<DeadlineView[]> {
  const [profile, deadlines] = await Promise.all([
    db.profile.findUnique({ where: { id: "student" } }),
    db.deadline.findMany({ orderBy: [{ nextDate: "asc" }, { name: "asc" }] }),
  ]);
  const grade = profile?.grade ?? 8;
  const now = new Date();

  return deadlines
    .map((d) => {
      const daysAway = d.nextDate ? differenceInCalendarDays(d.nextDate, now) : null;
      return {
        ...d,
        daysAway,
        eligible: grade >= d.relevantFromGrade,
      };
    })
    .filter((d) => d.daysAway === null || (d.daysAway >= 0 && d.daysAway <= windowDays));
}

/** Dashboard alerts: eligible + dated within 45 days (§3.1). */
export async function upcomingAlerts(): Promise<DeadlineView[]> {
  const all = await getDeadlines();
  return all.filter((d) => d.eligible && d.daysAway !== null && d.daysAway <= 45);
}
