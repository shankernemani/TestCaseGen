import { describe, expect, it } from "vitest";
import { checkInContextLine, isCheckInDue } from "@/lib/checkin";

const NOW = new Date("2026-08-09T10:00:00Z");

describe("isCheckInDue", () => {
  it("is due when there has never been a check-in", () => {
    expect(isCheckInDue(null, NOW)).toBe(true);
  });
  it("is due at 30+ days", () => {
    expect(isCheckInDue(new Date("2026-07-09T10:00:00Z"), NOW)).toBe(true);
    expect(isCheckInDue(new Date("2026-06-01T10:00:00Z"), NOW)).toBe(true);
  });
  it("is not due within 30 days", () => {
    expect(isCheckInDue(new Date("2026-07-25T10:00:00Z"), NOW)).toBe(false);
  });
});

describe("checkInContextLine", () => {
  it("prompts a first check-in when none has happened", () => {
    expect(checkInContextLine(null, NOW)).toContain("never");
  });
  it("says due when overdue", () => {
    expect(checkInContextLine(new Date("2026-07-01T10:00:00Z"), NOW)).toContain(
      "due",
    );
  });
  it("gives days-until when recent", () => {
    const line = checkInContextLine(new Date("2026-08-01T10:00:00Z"), NOW);
    expect(line).toContain("8 days ago");
    expect(line).toContain("about 22 days");
  });
});
