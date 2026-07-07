import { db } from "@/lib/db";
import { stageForGrade } from "@/lib/stages";
import RoadmapClient from "@/components/RoadmapClient";

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const [tasks, profile] = await Promise.all([
    db.task.findMany({ orderBy: [{ due: "asc" }, { createdAt: "asc" }] }),
    db.profile.findUnique({ where: { id: "student" } }),
  ]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">Roadmap</h1>
        <p className="mt-1 text-sm text-ink/60">Grade 8 to university, one stage at a time.</p>
      </header>
      <RoadmapClient
        tasks={tasks.map((t) => ({
          ...t,
          due: t.due?.toISOString() ?? null,
          createdAt: undefined,
        }))}
        activeStage={stageForGrade(profile?.grade ?? 8)}
      />
    </div>
  );
}
