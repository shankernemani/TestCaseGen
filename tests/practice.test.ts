import { describe, expect, it } from "vitest";
import { lastSevenDays, practiceSummary } from "@/lib/practice";

const TODAY = "2026-08-09";

describe("lastSevenDays", () => {
  it("keeps entries within the 7-day window inclusive", () => {
    const entries = [
      { day: "2026-08-03", minutes: 20, what: "alankaras" }, // in (today-6)
      { day: "2026-08-02", minutes: 20, what: "old" }, // out
      { day: "2026-08-09", minutes: 30, what: "varnam" }, // in
    ];
    expect(lastSevenDays(entries, TODAY).map((e) => e.what)).toEqual([
      "alankaras",
      "varnam",
    ]);
  });
});

describe("practiceSummary", () => {
  it("is empty with no entries at all", () => {
    expect(practiceSummary([], TODAY)).toBe("");
  });

  it("summarizes days, minutes, and the most recent entry", () => {
    const s = practiceSummary(
      [
        { day: "2026-08-08", minutes: 30, what: "varnam" },
        { day: "2026-08-08", minutes: 15, what: "kriti" },
        { day: "2026-08-05", minutes: 45, what: "alankaras" },
      ],
      TODAY,
    );
    expect(s).toContain("2 of the last 7 days");
    expect(s).toContain("90 minutes total");
    expect(s).toContain("2026-08-08");
  });

  it("mentions the gap when nothing recent", () => {
    const s = practiceSummary(
      [{ day: "2026-07-01", minutes: 30, what: "varnam" }],
      TODAY,
    );
    expect(s).toContain("No practice logged in the last 7 days");
    expect(s).toContain("2026-07-01");
  });
});
