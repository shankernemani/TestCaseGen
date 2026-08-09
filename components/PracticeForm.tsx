"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PracticeForm() {
  const router = useRouter();
  const [minutes, setMinutes] = useState("30");
  const [what, setWhat] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(minutes, 10);
    if (!what.trim() || !mins || busy) return;
    setBusy(true);
    try {
      await fetch("/api/practice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minutes: mins,
          what: what.trim(),
          note: note.trim() || undefined,
        }),
      });
      setWhat("");
      setNote("");
      router.refresh();
    } catch {
      // Offline: keep the entry so she can retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={600}
          className="input w-24"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          aria-label="Minutes practiced"
        />
        <input
          className="input flex-1"
          placeholder="What did you practice? (varnam, kriti, alankaras…)"
          value={what}
          onChange={(e) => setWhat(e.target.value)}
          maxLength={200}
        />
      </div>
      <input
        className="input"
        placeholder="One note (optional) — what felt good, what was hard"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
      />
      <button
        type="submit"
        disabled={busy || !what.trim() || !parseInt(minutes, 10)}
        className="btn-primary"
      >
        Log practice
      </button>
    </form>
  );
}
