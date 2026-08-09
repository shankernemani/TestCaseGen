import { describe, expect, it } from "vitest";
import { currentStreak, longestStreak, toDayString } from "@/lib/streak";

describe("currentStreak", () => {
  it("is 0 with no activity", () => {
    expect(currentStreak([], "2026-08-09")).toBe(0);
  });

  it("counts a run ending today", () => {
    expect(
      currentStreak(["2026-08-07", "2026-08-08", "2026-08-09"], "2026-08-09"),
    ).toBe(3);
  });

  it("still counts a run ending yesterday (evening grace)", () => {
    expect(currentStreak(["2026-08-07", "2026-08-08"], "2026-08-09")).toBe(2);
  });

  it("is 0 when the last activity was two days ago", () => {
    expect(currentStreak(["2026-08-06", "2026-08-07"], "2026-08-09")).toBe(0);
  });

  it("ignores older broken runs", () => {
    expect(
      currentStreak(
        ["2026-08-01", "2026-08-02", "2026-08-08", "2026-08-09"],
        "2026-08-09",
      ),
    ).toBe(2);
  });

  it("crosses month boundaries", () => {
    expect(
      currentStreak(["2026-07-30", "2026-07-31", "2026-08-01"], "2026-08-01"),
    ).toBe(3);
  });
});

describe("longestStreak", () => {
  it("finds the longest historical run", () => {
    expect(
      longestStreak([
        "2026-08-01",
        "2026-08-02",
        "2026-08-03",
        "2026-08-07",
        "2026-08-08",
      ]),
    ).toBe(3);
  });

  it("handles duplicates", () => {
    expect(longestStreak(["2026-08-01", "2026-08-01", "2026-08-02"])).toBe(2);
  });

  it("is 0 for empty input", () => {
    expect(longestStreak([])).toBe(0);
  });
});

describe("toDayString", () => {
  it("formats in Asia/Kolkata (UTC+5:30)", () => {
    // 20:00 UTC = 01:30 next day in Kolkata
    expect(toDayString(new Date("2026-08-09T20:00:00Z"))).toBe("2026-08-10");
    expect(toDayString(new Date("2026-08-09T10:00:00Z"))).toBe("2026-08-09");
  });
});
