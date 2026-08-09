"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ProfileValues {
  grade: number;
  interests: string;
  strengths: string;
  notes: string;
  thread: string;
}

export default function ProfileForm({ initial }: { initial: ProfileValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof ProfileValues>(key: K, value: ProfileValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    setSaved(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      }
    } catch {
      // Offline: edits stay in the form for retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3">
      <label className="text-sm font-semibold text-ink-soft">
        Narrative thread
        <span className="block text-xs font-normal text-ink-faint">
          The one-line spine of the profile — every mentor sees this.
        </span>
        <input
          className="input mt-1"
          value={values.thread}
          onChange={(e) => set("thread", e.target.value)}
          maxLength={300}
          required
        />
      </label>

      <label className="text-sm font-semibold text-ink-soft">
        Grade
        <select
          className="input mt-1"
          value={values.grade}
          onChange={(e) => set("grade", parseInt(e.target.value, 10))}
        >
          {[6, 7, 8, 9, 10, 11, 12].map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-semibold text-ink-soft">
        Interests
        <textarea
          className="input mt-1 min-h-[64px]"
          value={values.interests}
          onChange={(e) => set("interests", e.target.value)}
          maxLength={1000}
          required
        />
      </label>

      <label className="text-sm font-semibold text-ink-soft">
        Strengths
        <textarea
          className="input mt-1 min-h-[64px]"
          value={values.strengths}
          onChange={(e) => set("strengths", e.target.value)}
          maxLength={1000}
        />
      </label>

      <label className="text-sm font-semibold text-ink-soft">
        Notes
        <textarea
          className="input mt-1 min-h-[64px]"
          value={values.notes}
          onChange={(e) => set("notes", e.target.value)}
          maxLength={2000}
        />
      </label>

      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? "Saving…" : saved ? "Saved ✓" : "Save profile"}
      </button>
    </form>
  );
}
