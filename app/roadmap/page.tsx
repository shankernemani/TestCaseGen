import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { STAGES, stageForGrade } from "@/lib/stages";
import GoalList from "@/components/GoalList";
import BottomNav from "@/components/BottomNav";
import AddGoalForm from "@/components/AddGoalForm";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  const [profile, goals] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.goal.findMany({
      where: { status: { in: ["open", "done", "suggested"] } },
      orderBy: [{ status: "desc" }, { dueDate: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const currentStage = stageForGrade(profile?.grade ?? 8);

  const stagesWithGoals = STAGES.map((s) => ({
    stage: s,
    goals: goals.filter((g) => g.stage === s.n),
  })).filter(({ stage, goals: gs }) => gs.length > 0 || stage.n === currentStage);

  return (
    <main className="flex flex-col gap-5 px-4 pb-24 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Roadmap</h1>
        <p className="text-sm text-ink-soft">
          One thread, a few deep goals per stage. Depth beats padding.
        </p>
      </div>

      <AddGoalForm defaultStage={currentStage} />

      {stagesWithGoals.map(({ stage, goals: gs }) => (
        <section key={stage.n}>
          <h2 className="mb-2 px-1 font-display text-base font-bold text-peacock-700">
            {stage.swara} · {stage.label}{" "}
            <span className="text-xs font-normal text-ink-faint">
              {stage.years}
            </span>
          </h2>
          <GoalList
            goals={gs.map((g) => ({
              id: g.id,
              title: g.title,
              status: g.status,
              source: g.source,
              dueLabel: g.dueDate ? format(g.dueDate, "d MMM yyyy") : null,
            }))}
          />
        </section>
      ))}
      <BottomNav />
    </main>
  );
}
