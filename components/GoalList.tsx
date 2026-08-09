"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Circle, Sparkles, X } from "lucide-react";

export interface GoalView {
  id: string;
  title: string;
  status: string;
  source: string;
  dueLabel?: string | null;
}

export default function GoalList({
  goals,
  readOnly = false,
}: {
  goals: GoalView[];
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function act(id: string, action: string) {
    if (readOnly || busyId) return;
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/goals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!res.ok) {
        // e.g. 409 when a stale tab acts on an already-changed goal.
        const data = await res.json().catch(() => ({}) as { error?: string });
        setError(data.error ?? "That didn't work — pull to refresh and retry.");
      }
      router.refresh();
    } catch {
      // Offline tap: nothing changed server-side; buttons must not stay locked.
      setError("Network problem — try again.");
    } finally {
      setBusyId(null);
    }
  }

  if (goals.length === 0) {
    return (
      <p className="py-3 text-center text-sm text-ink-faint">
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {error && (
        <li className="text-center text-xs text-madder">{error}</li>
      )}
      {goals.map((g) => {
        const done = g.status === "done";
        const suggested = g.status === "suggested";
        return (
          <li
            key={g.id}
            className={`card flex items-start gap-3 py-3 ${
              suggested ? "border-dashed border-gold-soft bg-silk-50" : ""
            }`}
          >
            {!suggested ? (
              <button
                aria-label={done ? "Reopen goal" : "Mark goal done"}
                disabled={readOnly || busyId === g.id}
                onClick={() => act(g.id, done ? "reopen" : "complete")}
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  done
                    ? "border-peacock bg-peacock text-silk-50"
                    : "border-silk-300 text-transparent active:border-peacock"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : <Circle size={12} />}
              </button>
            ) : (
              <Sparkles size={20} className="mt-0.5 shrink-0 text-gold" />
            )}
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm leading-snug ${
                  done ? "text-ink-faint line-through" : ""
                }`}
              >
                {g.title}
              </p>
              {(() => {
                const sourceName =
                  g.source !== "self" && g.source !== "parent"
                    ? g.source.charAt(0).toUpperCase() + g.source.slice(1)
                    : g.source === "parent"
                      ? "Parent"
                      : "";
                const parts: string[] = [];
                if (suggested) parts.push(`Suggested by ${sourceName || "a mentor"}`);
                else if (sourceName) parts.push(sourceName);
                if (g.dueLabel) parts.push(`due ${g.dueLabel}`);
                return parts.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-ink-faint">
                    {parts.join(" · ")}
                  </p>
                ) : null;
              })()}
              {suggested && !readOnly && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => act(g.id, "accept")}
                    disabled={busyId === g.id}
                    className="rounded-full bg-peacock px-3 py-1 text-xs font-semibold text-silk-50"
                  >
                    Add to roadmap
                  </button>
                  <button
                    onClick={() => act(g.id, "drop")}
                    disabled={busyId === g.id}
                    className="flex items-center gap-1 rounded-full border border-silk-300 px-3 py-1 text-xs text-ink-soft"
                  >
                    <X size={12} /> Skip
                  </button>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
