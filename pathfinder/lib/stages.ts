/**
 * The seven stages of the journey — the Arohanam (§3.1, §8).
 * Sa → Ni, ascending like a scale.
 */

export type StageId = "g8" | "g9" | "g10" | "g11" | "g12" | "dec" | "uni";

export const STAGES: { id: StageId; swara: string; label: string; theme: string }[] = [
  { id: "g8", swara: "Sa", label: "Grade 8", theme: "Discovery" },
  { id: "g9", swara: "Ri", label: "Grade 9", theme: "Foundation" },
  { id: "g10", swara: "Ga", label: "Grade 10", theme: "Depth" },
  { id: "g11", swara: "Ma", label: "Grade 11", theme: "Leadership" },
  { id: "g12", swara: "Pa", label: "Grade 12", theme: "Applications" },
  { id: "dec", swara: "Dha", label: "Decisions", theme: "Choosing well" },
  { id: "uni", swara: "Ni", label: "University", theme: "Arrival" },
];

/** Map her current grade to the active stage. */
export function stageForGrade(grade: number): StageId {
  if (grade <= 8) return "g8";
  if (grade === 9) return "g9";
  if (grade === 10) return "g10";
  if (grade === 11) return "g11";
  if (grade === 12) return "g12";
  return "dec";
}

export function stageIndex(id: StageId): number {
  return STAGES.findIndex((s) => s.id === id);
}

export const CATEGORIES = [
  "Music",
  "Competition",
  "Writing",
  "Explore",
  "Strategy",
  "Academics",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Music: "madder",
  Competition: "marigold",
  Writing: "slate",
  Explore: "plum",
  Strategy: "peacock",
  Academics: "ink",
};
