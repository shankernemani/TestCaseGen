import { describe, expect, it } from "vitest";
import { capstoneMix, stageForGrade, stageProgress, STAGES } from "@/lib/stages";

describe("STAGES", () => {
  it("has the seven ascending swaras", () => {
    expect(STAGES.map((s) => s.swara)).toEqual([
      "Sa",
      "Ri",
      "Ga",
      "Ma",
      "Pa",
      "Dha",
      "Ni",
    ]);
  });
});

describe("stageForGrade", () => {
  it("maps Grade 8 to stage 1 (Sa)", () => {
    expect(stageForGrade(8)).toBe(1);
  });
  it("maps Grade 12 to stage 5 (Pa)", () => {
    expect(stageForGrade(12)).toBe(5);
  });
  it("clamps out-of-range grades", () => {
    expect(stageForGrade(5)).toBe(1);
    expect(stageForGrade(20)).toBe(7);
  });
});

describe("stageProgress", () => {
  const goals = [
    { stage: 1, status: "done" },
    { stage: 1, status: "open" },
    { stage: 1, status: "dropped" },
    { stage: 1, status: "suggested" },
    { stage: 2, status: "open" },
  ];
  it("counts only open+done goals in the stage", () => {
    expect(stageProgress(goals, 1)).toEqual({ done: 1, total: 2, pct: 50 });
  });
  it("returns 0 pct for an empty stage", () => {
    expect(stageProgress(goals, 3)).toEqual({ done: 0, total: 0, pct: 0 });
  });
});

describe("capstoneMix", () => {
  it("counts active goals per capstone type", () => {
    const mix = capstoneMix([
      { capstoneType: "institutional", status: "open" },
      { capstoneType: "institutional", status: "done" },
      { capstoneType: "innovative", status: "dropped" },
      { capstoneType: "independent", status: "open" },
      { capstoneType: null, status: "open" },
    ]);
    expect(mix).toEqual({ institutional: 2, innovative: 0, independent: 1 });
  });
});
