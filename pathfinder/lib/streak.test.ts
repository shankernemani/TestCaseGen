import { describe, expect, it } from "vitest";
import { computeStreak, weeklyMinutes } from "./streak";

const day = (offset: number, base = new Date("2026-07-07T12:00:00")) => {
  const d = new Date(base);
  d.setDate(d.getDate() - offset);
  return d;
};

const TODAY = new Date("2026-07-07T20:00:00");

describe("computeStreak", () => {
  it("returns 0 with no logs", () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  it("counts a single log today", () => {
    expect(computeStreak([day(0)], TODAY)).toBe(1);
  });

  it("counts consecutive days ending today", () => {
    expect(computeStreak([day(0), day(1), day(2)], TODAY)).toBe(3);
  });

  it("keeps the flame alive if today isn't logged yet but yesterday was", () => {
    expect(computeStreak([day(1), day(2)], TODAY)).toBe(2);
  });

  it("breaks the streak after a missed day", () => {
    expect(computeStreak([day(2), day(3)], TODAY)).toBe(0);
  });

  it("stops counting at a gap", () => {
    expect(computeStreak([day(0), day(1), day(3), day(4)], TODAY)).toBe(2);
  });

  it("dedupes multiple logs on the same day", () => {
    expect(computeStreak([day(0), day(0), day(1)], TODAY)).toBe(2);
  });
});

describe("weeklyMinutes", () => {
  it("returns 7 buckets oldest-first", () => {
    const week = weeklyMinutes([], TODAY);
    expect(week).toHaveLength(7);
    expect(week.every((w) => w.minutes === 0)).toBe(true);
  });

  it("sums minutes per day", () => {
    const logs = [
      { date: day(0, TODAY), minutes: 20 },
      { date: day(0, TODAY), minutes: 10 },
      { date: day(6, TODAY), minutes: 45 },
    ];
    const week = weeklyMinutes(logs, TODAY);
    expect(week[6].minutes).toBe(30); // today is the last bucket
    expect(week[0].minutes).toBe(45); // six days ago is the first
  });
});
