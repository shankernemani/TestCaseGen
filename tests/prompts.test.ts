import { describe, expect, it } from "vitest";
import {
  buildSessionSummaryPrompt,
  buildSystemPrompt,
  PERSONAS,
} from "@/lib/prompts";
import { MENTOR_IDS } from "@/lib/mentors";
import type { PromptContext } from "@/lib/prompts";

const ctx: PromptContext = {
  grade: 8,
  age: 13,
  interests: "Carnatic vocal music",
  strengths: "English and Social Studies Olympiad golds",
  notes: "Exploring interests",
  thread: "Carnatic music × linguistics",
  openGoals: ["Practice log", "Essay draft"],
  recentWins: ["Sang a full varnam without stopping"],
  memorySummary: "Last time we planned her week.",
  date: "9 August 2026",
};

describe("buildSystemPrompt", () => {
  it("composes BASE_RULES + PERSONA for every mentor", () => {
    for (const id of MENTOR_IDS) {
      const prompt = buildSystemPrompt(id, ctx);
      expect(prompt).toContain("Pathfinder");
      expect(prompt).toContain("Grade 8");
      expect(prompt).toContain("Carnatic music × linguistics");
      expect(prompt).toContain("NON-NEGOTIABLE RULES");
      expect(prompt).toContain("Coach, don't do");
      expect(prompt).toContain(PERSONAS[id].slice(0, 60));
      expect(prompt).toContain("9 August 2026");
    }
  });

  it("injects goals, wins, and memory", () => {
    const prompt = buildSystemPrompt("priya", ctx);
    expect(prompt).toContain("1. Practice log");
    expect(prompt).toContain("Sang a full varnam");
    expect(prompt).toContain("Last time we planned her week.");
  });

  it("uses placeholders when context is empty", () => {
    const prompt = buildSystemPrompt("anaya", {
      ...ctx,
      openGoals: [],
      recentWins: [],
      memorySummary: "",
    });
    expect(prompt).toContain("just getting started");
    expect(prompt).toContain("no journal entries yet");
    expect(prompt).toContain("first conversation");
  });

  it("keeps signature rituals in the right personas", () => {
    expect(buildSystemPrompt("arjun", ctx)).toContain("SWIM-LANE AUDIT");
    expect(buildSystemPrompt("anaya", ctx)).toContain("PIE CHECK");
    expect(buildSystemPrompt("dev", ctx)).toContain("AUTHENTICITY DOCTRINE");
    expect(buildSystemPrompt("meera", ctx)).toContain("CAPSTONE TAXONOMY");
    expect(buildSystemPrompt("priya", ctx)).toContain("WELL-LOPSIDED");
  });
});

describe("buildSessionSummaryPrompt", () => {
  it("includes transcript with speaker names and previous memory", () => {
    const prompt = buildSessionSummaryPrompt(
      "Priya",
      [
        { role: "user", content: "Hi!" },
        { role: "assistant", content: "Hello Sarvagna" },
      ],
      "Old memory",
    );
    expect(prompt).toContain("Sarvagna: Hi!");
    expect(prompt).toContain("Priya: Hello Sarvagna");
    expect(prompt).toContain("Old memory");
    expect(prompt).toContain("commitments");
  });
});
