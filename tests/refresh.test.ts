import { describe, expect, it } from "vitest";
import { isDuplicateDeadline, parseRefreshPlan } from "@/lib/refresh";

describe("parseRefreshPlan", () => {
  it("parses a clean plan", () => {
    const plan = parseRefreshPlan(
      JSON.stringify({
        updates: [{ id: "abc", date: "2027-04-30", notes: "closed for 2026" }],
        additions: [
          {
            title: "New contest",
            date: "2026-12-01",
            url: "https://example.org",
            mentorId: "arjun",
          },
        ],
      }),
    );
    expect(plan?.updates).toHaveLength(1);
    expect(plan?.additions).toHaveLength(1);
  });

  it("tolerates markdown fences and surrounding prose", () => {
    const plan = parseRefreshPlan(
      'Here is the plan:\n```json\n{"updates": [], "additions": []}\n```\nDone.',
    );
    expect(plan).toEqual({ verified: [], updates: [], additions: [] });
  });

  it("drops items with malformed dates without rejecting the plan", () => {
    const plan = parseRefreshPlan(
      JSON.stringify({
        updates: [],
        additions: [
          { title: "Bad", date: "next June" },
          { title: "Good", date: "2027-01-15" },
        ],
      }),
    );
    expect(plan?.additions.map((a) => a.title)).toEqual(["Good"]);
  });

  it("treats empty or malformed urls as no-url instead of failing", () => {
    const plan = parseRefreshPlan(
      JSON.stringify({
        updates: [{ id: "abc", url: "", notes: "note" }],
        additions: [{ title: "X", date: "2027-01-15", url: "not a url" }],
      }),
    );
    expect(plan?.updates[0]).toEqual({ id: "abc", notes: "note" });
    expect(plan?.additions[0].url).toBeUndefined();
  });

  it("returns null for non-JSON output", () => {
    expect(parseRefreshPlan("I could not find anything.")).toBeNull();
  });
});

describe("isDuplicateDeadline", () => {
  const existing = [
    {
      title: "Panini Linguistics Olympiad — registration opens",
      url: "https://plo-in.org",
    },
  ];

  it("matches by URL", () => {
    expect(
      isDuplicateDeadline(
        { title: "PLO signup", url: "https://plo-in.org" },
        existing,
      ),
    ).toBe(true);
  });

  it("matches by leading title words", () => {
    expect(
      isDuplicateDeadline(
        { title: "Panini Linguistics Olympiad registration deadline" },
        existing,
      ),
    ).toBe(true);
  });

  it("passes genuinely new competitions", () => {
    expect(
      isDuplicateDeadline(
        { title: "International Economics Olympiad national round" },
        existing,
      ),
    ).toBe(false);
  });
});
