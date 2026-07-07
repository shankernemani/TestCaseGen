"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

type Goal = { id: string; title: string; category: string; status: string };

/** §3.1 "This week": top open goals, tap to complete. */
export default function GoalList({ goals }: { goals: Goal[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function complete(id: string) {
    setBusyId(id);
    await fetch(`/api/roadmap/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (goals.length === 0) {
    return (
      <p className="text-sm text-ink/60">
        Nothing open this week — visit the Roadmap to pick your next step.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {goals.map((g) => (
        <li key={g.id} className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => complete(g.id)}
            disabled={busyId === g.id}
            aria-label={`Mark done: ${g.title}`}
            className="tap-target flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-peacock/40 text-peacock transition-colors hover:bg-peacock hover:text-white"
          >
            <Check size={16} aria-hidden />
          </button>
          <span className="text-sm leading-snug">{g.title}</span>
        </li>
      ))}
    </ul>
  );
}
