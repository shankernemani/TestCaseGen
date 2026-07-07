"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Trophy, Zap } from "lucide-react";

type Entry = { id: string; text: string; kind: string; createdAt: string };

/** §3.7 "Wins & Sparks" — two-line entries that feed all mentor contexts. */
export default function JournalClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<"win" | "spark">("win");

  useEffect(() => {
    fetch("/api/journal")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setEntries(d.entries ?? []));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim(), kind }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setText("");
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="card">
        <div className="flex gap-2" role="radiogroup" aria-label="Entry kind">
          <button
            type="button"
            role="radio"
            aria-checked={kind === "win"}
            onClick={() => setKind("win")}
            className={`tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
              kind === "win" ? "border-peacock bg-peacock-light text-peacock-dark" : "border-mist bg-white text-ink/60"
            }`}
          >
            <Trophy size={15} aria-hidden /> Something I finished
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={kind === "spark"}
            onClick={() => setKind("spark")}
            className={`tap-target flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium ${
              kind === "spark" ? "border-plum bg-plum-light text-plum" : "border-mist bg-white text-ink/60"
            }`}
          >
            <Zap size={15} aria-hidden /> Something that excited me
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={kind === "win" ? "What did you finish?" : "What lit you up?"}
          aria-label="Journal entry"
          className="mt-3 w-full resize-none rounded-xl border border-mist px-3 py-2 text-sm"
        />
        <button type="submit" disabled={!text.trim()} className="btn-primary mt-2 w-full">
          Save it
        </button>
      </form>

      {entries.length === 0 ? (
        <p className="px-2 text-sm text-ink/60">
          No entries yet — two lines on a Friday is all it takes.
        </p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="card flex items-start gap-3 !p-3">
              {e.kind === "win" ? (
                <Trophy size={17} className="mt-0.5 shrink-0 text-peacock" aria-hidden />
              ) : (
                <Zap size={17} className="mt-0.5 shrink-0 text-plum" aria-hidden />
              )}
              <div>
                <p className="text-sm leading-snug">{e.text}</p>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  {format(new Date(e.createdAt), "d MMM yyyy")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
