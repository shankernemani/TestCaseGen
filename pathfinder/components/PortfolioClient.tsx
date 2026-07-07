"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Download, Plus } from "lucide-react";

type Entry = {
  id: string;
  type: string;
  title: string;
  date: string;
  description: string;
  link: string | null;
};

const TYPES = [
  { id: "performance", label: "Performance" },
  { id: "recording", label: "Recording" },
  { id: "award", label: "Award" },
  { id: "publication", label: "Publication" },
  { id: "project", label: "Project" },
  { id: "repertoire", label: "Repertoire" },
];

const TYPE_BADGE: Record<string, string> = {
  performance: "bg-madder-light text-madder",
  recording: "bg-madder-light text-madder",
  award: "bg-marigold-light text-ink",
  publication: "bg-slate-light text-slate",
  project: "bg-peacock-light text-peacock-dark",
  repertoire: "bg-plum-light text-plum",
};

/** §3.5 Proof Locker — everything documented from day one. */
export default function PortfolioClient() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "recording",
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    link: "",
  });

  useEffect(() => {
    fetch("/api/portfolio")
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => setEntries(d.entries ?? []));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        title: form.title.trim(),
        date: new Date(form.date).toISOString(),
        description: form.description.trim(),
        ...(form.link.trim() ? { link: form.link.trim() } : {}),
      }),
    });
    if (res.ok) {
      const { entry } = await res.json();
      setEntries((prev) => [entry, ...prev]);
      setShowForm(false);
      setForm({ ...form, title: "", description: "", link: "" });
    }
  }

  const placeholder =
    form.type === "repertoire"
      ? "Kriti · raga · tala · date learned (e.g. Vatapi Ganapatim · Hamsadhwani · Adi)"
      : form.type === "performance"
        ? "Venue, pieces sung, recording link if any"
        : "What is it, and what did YOU do? Numbers and outcomes count.";

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowForm((s) => !s)} className="btn-primary flex-1">
          <Plus size={17} className="mr-1" aria-hidden /> Add proof
        </button>
        <a href="/api/portfolio/export?format=md" className="btn-quiet" download>
          <Download size={17} className="mr-1" aria-hidden /> Export
        </a>
      </div>

      {showForm && (
        <form onSubmit={add} className="card space-y-3">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Entry type">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={form.type === t.id}
                onClick={() => setForm({ ...form, type: t.id })}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  form.type === t.id ? "bg-peacock text-white" : "border border-mist bg-white text-ink/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            aria-label="Title"
            className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            aria-label="Date"
            className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder={placeholder}
            aria-label="Description"
            className="w-full resize-none rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <input
            type="url"
            value={form.link}
            onChange={(e) => setForm({ ...form, link: e.target.value })}
            placeholder="Link (recording, doc, certificate) — optional"
            aria-label="Link"
            className="w-full rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-primary w-full">
            Add to locker
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="card text-center">
          <p className="font-display text-lg">No recordings yet</p>
          <p className="mt-1 text-sm text-ink/60">
            Meera can help you plan your first — everything you save here becomes your
            application record in Grade 12.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <li key={e.id} className="card !p-3">
              <div className="flex items-center justify-between gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[e.type] ?? "bg-mist"}`}>
                  {e.type}
                </span>
                <span className="text-[11px] text-ink/45">{format(new Date(e.date), "d MMM yyyy")}</span>
              </div>
              <p className="mt-1.5 font-medium leading-snug">{e.title}</p>
              <p className="mt-0.5 text-sm text-ink/60">{e.description}</p>
              {e.link && (
                <a
                  href={e.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-sm font-medium text-peacock underline"
                >
                  Open link
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
