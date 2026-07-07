import { describe, expect, it } from "vitest";
import {
  buildMentorSystemPrompt,
  extractTaskMarker,
  MENTOR_IDS,
  PRESSURE_INSTRUCTION,
  type LiveContext,
} from "./prompts";

const CTX: LiveContext = {
  grade: 8,
  age: 13,
  interests: "Carnatic vocal music, reading",
  strengths: "Olympiad golds",
  notes: "Exploring subjects.",
  openGoals: ["Enter QCEC Junior", "Record 2 pieces"],
  recentWins: ["Finished a varnam"],
  memorySummary: "Discussed the podcast idea.",
  date: "Tuesday, 7 July 2026",
};

describe("buildMentorSystemPrompt", () => {
  it("fills every placeholder for every mentor", () => {
    for (const id of MENTOR_IDS) {
      const prompt = buildMentorSystemPrompt(id, CTX);
      expect(prompt).not.toMatch(/\{\w+\}/); // no unfilled slots
      expect(prompt).toContain("Grade 8");
      expect(prompt).toContain("Tuesday, 7 July 2026");
      expect(prompt).toContain("Enter QCEC Junior");
    }
  });

  it("names the mentor and role", () => {
    const prompt = buildMentorSystemPrompt("priya", CTX);
    expect(prompt).toContain("You are Priya, the Strategy Coach");
    expect(prompt).toContain("FUNDING MAP");
  });

  it("includes persona knowledge blocks", () => {
    expect(buildMentorSystemPrompt("arjun", CTX)).toContain("Panini Linguistics Olympiad");
    expect(buildMentorSystemPrompt("meera", CTX)).toContain("arangetram");
    expect(buildMentorSystemPrompt("dev", CTX)).toContain("THE PROTOCOL");
    expect(buildMentorSystemPrompt("anaya", CTX)).toContain("THE PIE CHECK");
  });

  it("applies pressure instruction only when flagged", () => {
    expect(buildMentorSystemPrompt("priya", CTX)).not.toContain("UNDER 120 words");
    expect(
      buildMentorSystemPrompt("priya", { ...CTX, pressureNext: true })
    ).toContain(PRESSURE_INSTRUCTION.trim());
  });

  it("handles empty context gracefully", () => {
    const prompt = buildMentorSystemPrompt("anaya", {
      ...CTX,
      openGoals: [],
      recentWins: [],
      memorySummary: "",
    });
    expect(prompt).toContain("(none open right now)");
    expect(prompt).toContain("(none logged yet)");
    expect(prompt).toContain("first conversation");
  });
});

describe("extractTaskMarker", () => {
  it("extracts a trailing task marker", () => {
    const { clean, task } = extractTaskMarker(
      "Great work this week!\n\n[[task: Draft QCEC outline by Friday]]"
    );
    expect(task).toBe("Draft QCEC outline by Friday");
    expect(clean).toBe("Great work this week!");
  });

  it("returns null when there is no marker", () => {
    const { clean, task } = extractTaskMarker("Just a normal reply.");
    expect(task).toBeNull();
    expect(clean).toBe("Just a normal reply.");
  });

  it("ignores markers not at the end", () => {
    const reply = "[[task: early]] but then more text";
    expect(extractTaskMarker(reply).task).toBeNull();
  });
});
