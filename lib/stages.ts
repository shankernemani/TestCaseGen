// The Arohanam tracker: Grade 8 → University as the seven ascending swaras.
// Stage numbers (1–7) are stored on goals; the dashboard highlights the
// current stage and computes progress from goals done within it.

export interface Stage {
  n: number;
  swara: string;
  label: string;
  years: string;
}

export const STAGES: Stage[] = [
  { n: 1, swara: "Sa", label: "Grade 8", years: "2026–27" },
  { n: 2, swara: "Ri", label: "Grade 9", years: "2027–28" },
  { n: 3, swara: "Ga", label: "Grade 10", years: "2028–29" },
  { n: 4, swara: "Ma", label: "Grade 11", years: "2029–30" },
  { n: 5, swara: "Pa", label: "Grade 12", years: "2030–31" },
  { n: 6, swara: "Dha", label: "Applications", years: "Fall 2030" },
  { n: 7, swara: "Ni", label: "University", years: "2031 →" },
];

/** Current stage from the student's grade (8→1 … 12→5). */
export function stageForGrade(grade: number): number {
  return Math.min(Math.max(grade - 7, 1), 7);
}

export function stageProgress(
  goals: { stage: number; status: string }[],
  stage: number,
): { done: number; total: number; pct: number } {
  const inStage = goals.filter(
    (g) => g.stage === stage && (g.status === "open" || g.status === "done"),
  );
  const done = inStage.filter((g) => g.status === "done").length;
  const total = inStage.length;
  return { done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export type CapstoneType = "institutional" | "innovative" | "independent";

/** Capstone-mix meter: which of the three capstone types have at least one
 * open or done goal. The profile should eventually show a mix of all three. */
export function capstoneMix(
  goals: { capstoneType: string | null; status: string }[],
): Record<CapstoneType, number> {
  const mix: Record<CapstoneType, number> = {
    institutional: 0,
    innovative: 0,
    independent: 0,
  };
  for (const g of goals) {
    if (g.status !== "open" && g.status !== "done") continue;
    if (g.capstoneType && g.capstoneType in mix) {
      mix[g.capstoneType as CapstoneType]++;
    }
  }
  return mix;
}
