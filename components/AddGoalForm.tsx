"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function AddGoalForm({ defaultStage }: { defaultStage: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [capstoneType, setCapstoneType] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          stage: defaultStage,
          capstoneType: capstoneType || undefined,
        }),
      });
      setTitle("");
      setCapstoneType("");
      setOpen(false);
      router.refresh();
    } catch {
      // Offline: keep the typed goal so she can retry.
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center gap-2 rounded-card border-2 border-dashed border-silk-300 py-3 text-sm font-semibold text-ink-soft"
      >
        <Plus size={16} /> Add a goal
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2">
      <input
        autoFocus
        className="input"
        placeholder="What do you want to get done?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={300}
      />
      <select
        className="input text-sm"
        value={capstoneType}
        onChange={(e) => setCapstoneType(e.target.value)}
      >
        <option value="">No capstone type</option>
        <option value="institutional">Institutional (judged/structured)</option>
        <option value="innovative">Innovative (public reach)</option>
        <option value="independent">Independent (solo depth)</option>
      </select>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !title.trim()} className="btn-primary flex-1">
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-silk-300 px-4 text-sm text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
