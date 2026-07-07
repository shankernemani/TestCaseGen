"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInCalendarDays, format } from "date-fns";
import { Check, ChevronDown, Plus, Sparkles, X } from "lucide-react";
import { STAGES, CATEGORIES, type StageId } from "@/lib/stages";

type Task = {
  id: string;
  stage: string;
  category: string;
  title: string;
  status: string;
  due: string | null;
  artifactLink: string | null;
  notes: string | null;
  source: string;
};

// Literal classes for Tailwind's scanner (§8 category colours).
const CATEGORY_BADGE: Record<string, string> = {
  Music: "bg-madder-light text-madder",
  Competition: "bg-marigold-light text-ink",
  Writing: "bg-slate-light text-slate",
  Explore: "bg-plum-light text-plum",
  Strategy: "bg-peacock-light text-peacock-dark",
  Academics: "bg-mist text-ink",
};

export default function RoadmapClient({
  tasks: initialTasks,
  activeStage,
}: {
  tasks: Task[];
  activeStage: StageId;
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [view, setView] = useState<"stages" | "next30">("stages");
  const [openStage, setOpenStage] = useState<string>(activeStage);
  const [artifactFor, setArtifactFor] = useState<Task | null>(null);
  const [artifactLink, setArtifactLink] = useState("");
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState<string>("Strategy");

  async function patch(id: string, data: object) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...data } : t)));
    await fetch(`/api/roadmap/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  function cycleStatus(t: Task) {
    if (t.status === "todo") return patch(t.id, { status: "doing" });
    if (t.status === "doing") {
      // Completing a task can carry an artifact (§3.3).
      setArtifactFor(t);
      return patch(t.id, { status: "done" });
    }
    return patch(t.id, { status: "todo" });
  }

  async function addTask() {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle("");
    setAdding(false);
    const res = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: openStage, category: newCategory, title }),
    });
    if (res.ok) {
      const { task } = await res.json();
      setTasks((prev) => [...prev, task]);
      router.refresh();
    }
  }

  const suggested = tasks.filter((t) => t.status === "suggested");

  const next30 = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "done" && t.status !== "suggested" && t.due)
        .filter((t) => {
          const d = differenceInCalendarDays(new Date(t.due!), new Date());
          return d >= 0 && d <= 30;
        })
        .sort((a, b) => new Date(a.due!).getTime() - new Date(b.due!).getTime()),
    [tasks]
  );

  return (
    <div className="space-y-4">
      {/* suggested tasks — mentor/parent proposals awaiting her tap (§2.3, §3.8) */}
      {suggested.length > 0 && (
        <section className="card border-marigold/60">
          <h2 className="flex items-center gap-1.5 font-display text-lg font-semibold">
            <Sparkles size={17} className="text-marigold" aria-hidden /> Suggested for you
          </h2>
          <ul className="mt-2 space-y-2">
            {suggested.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm leading-snug">{t.title}</p>
                  {t.notes && <p className="text-xs text-ink/50">{t.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => patch(t.id, { status: "todo" })}
                    className="tap-target flex items-center justify-center rounded-full bg-peacock px-3 text-sm font-medium text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    aria-label={`Dismiss: ${t.title}`}
                    onClick={async () => {
                      setTasks((prev) => prev.filter((x) => x.id !== t.id));
                      await fetch(`/api/roadmap/${t.id}`, { method: "DELETE" });
                    }}
                    className="tap-target flex items-center justify-center text-ink/40"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* view switch */}
      <div className="flex gap-2" role="tablist" aria-label="Roadmap views">
        {(["stages", "next30"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`tap-target rounded-full px-4 py-1.5 text-sm font-medium ${
              view === v ? "bg-peacock text-white" : "border border-mist bg-white text-ink/70"
            }`}
          >
            {v === "stages" ? "By stage" : "Next 30 days"}
          </button>
        ))}
      </div>

      {view === "next30" ? (
        <section className="card">
          {next30.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nothing dated in the next 30 days. Add due dates to tasks you want on this list.
            </p>
          ) : (
            <ul className="space-y-2">
              {next30.map((t) => (
                <li key={t.id} className="flex items-center gap-3">
                  <TaskCheck task={t} onCycle={() => cycleStatus(t)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{t.title}</p>
                    <p className="text-xs text-marigold">{format(new Date(t.due!), "d MMM")}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <div className="space-y-2">
          {STAGES.map((stage) => {
            const stageTasks = tasks.filter(
              (t) => t.stage === stage.id && t.status !== "suggested"
            );
            const done = stageTasks.filter((t) => t.status === "done").length;
            const open = openStage === stage.id;
            return (
              <section key={stage.id} className="card !p-0">
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenStage(open ? "" : stage.id)}
                  className="tap-target flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-semibold ${
                        stage.id === activeStage
                          ? "bg-marigold text-ink"
                          : "bg-peacock-light text-peacock-dark"
                      }`}
                    >
                      {stage.swara}
                    </span>
                    <div>
                      <span className="font-display font-semibold">{stage.label}</span>
                      <span className="ml-2 text-xs text-ink/50">{stage.theme}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink/50">
                    {done}/{stageTasks.length}
                    <ChevronDown
                      size={17}
                      className={`transition-transform ${open ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </div>
                </button>
                {open && (
                  <div className="border-t border-mist px-4 py-3">
                    <ul className="space-y-2.5">
                      {stageTasks.map((t) => (
                        <li key={t.id} className="flex items-start gap-3">
                          <TaskCheck task={t} onCycle={() => cycleStatus(t)} />
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm leading-snug ${
                                t.status === "done" ? "text-ink/40 line-through" : ""
                              }`}
                            >
                              {t.title}
                            </p>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[t.category] ?? "bg-mist"}`}
                              >
                                {t.category}
                              </span>
                              {t.due && (
                                <span className="text-[10px] text-ink/50">
                                  due {format(new Date(t.due), "d MMM yyyy")}
                                </span>
                              )}
                              {t.artifactLink && (
                                <a
                                  href={t.artifactLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-medium text-peacock underline"
                                >
                                  artifact
                                </a>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {adding && openStage === stage.id ? (
                      <div className="mt-3 space-y-2">
                        <input
                          autoFocus
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && addTask()}
                          placeholder="What needs doing?"
                          aria-label="New task title"
                          className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-1">
                          {CATEGORIES.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewCategory(c)}
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                newCategory === c
                                  ? "bg-peacock text-white"
                                  : "border border-mist bg-white text-ink/60"
                              }`}
                            >
                              {c}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={addTask} className="btn-primary flex-1 !min-h-[38px] text-sm">
                            Add to roadmap
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdding(false)}
                            className="btn-quiet !min-h-[38px] text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAdding(true);
                          setOpenStage(stage.id);
                        }}
                        className="tap-target mt-2 inline-flex items-center gap-1 text-sm font-medium text-peacock"
                      >
                        <Plus size={15} aria-hidden /> Add a task
                      </button>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* artifact prompt on completion (§3.3) */}
      {artifactFor && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add artifact"
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4"
          onClick={() => setArtifactFor(null)}
        >
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold">Done! 🎉 Got a link to show for it?</h3>
            <p className="mt-1 text-sm text-ink/60">
              Recording, doc, certificate — proof goes in your locker.
            </p>
            <input
              value={artifactLink}
              onChange={(e) => setArtifactLink(e.target.value)}
              placeholder="https://…"
              aria-label="Artifact link"
              className="mt-3 w-full rounded-xl border border-mist px-3 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="btn-primary flex-1"
                onClick={async () => {
                  if (artifactLink.trim()) {
                    await patch(artifactFor.id, { artifactLink: artifactLink.trim() });
                  }
                  setArtifactFor(null);
                  setArtifactLink("");
                }}
              >
                {artifactLink.trim() ? "Save artifact" : "Done"}
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  setArtifactFor(null);
                  setArtifactLink("");
                }}
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCheck({ task, onCycle }: { task: Task; onCycle: () => void }) {
  const label =
    task.status === "todo" ? "Start" : task.status === "doing" ? "Finish" : "Reopen";
  return (
    <button
      type="button"
      onClick={onCycle}
      aria-label={`${label}: ${task.title}`}
      title={task.status === "doing" ? "In progress — tap to finish" : label}
      className={`tap-target mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        task.status === "done"
          ? "border-peacock bg-peacock text-white"
          : task.status === "doing"
            ? "border-marigold bg-marigold-light text-ink"
            : "border-mist bg-white text-transparent hover:border-peacock"
      }`}
    >
      {task.status === "doing" ? (
        <span className="h-2 w-2 rounded-full bg-marigold" aria-hidden />
      ) : (
        <Check size={14} aria-hidden />
      )}
    </button>
  );
}
