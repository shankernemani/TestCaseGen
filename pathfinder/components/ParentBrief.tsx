"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

/** §3.8 monthly parent brief — Haiku-generated on demand. */
export default function ParentBrief() {
  const [brief, setBrief] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/parent/brief");
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setBrief(data.brief);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not generate the brief.");
    }
  }

  return (
    <section className="card">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Sparkles size={18} className="text-marigold" aria-hidden /> Monthly brief
      </h2>
      {brief ? (
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/80">{brief}</p>
      ) : (
        <p className="mt-1 text-sm text-ink/60">
          Progress, upcoming deadlines, and one dinner-table conversation topic.
        </p>
      )}
      {error && <p className="mt-2 text-sm text-madder">{error}</p>}
      <button type="button" onClick={generate} disabled={busy} className="btn-primary mt-3">
        {busy ? "Writing…" : brief ? "Regenerate" : "Generate this month's brief"}
      </button>
    </section>
  );
}
