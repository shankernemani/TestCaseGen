"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ExternalLink } from "lucide-react";

export interface DeadlineView {
  id: string;
  title: string;
  dateLabel: string;
  isPast: boolean;
  url?: string | null;
  notes?: string | null;
}

export default function DeadlineManager({ deadlines }: { deadlines: DeadlineView[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date || busy) return;
    setBusy(true);
    try {
      await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          date,
          url: url.trim() || undefined,
        }),
      });
      setTitle("");
      setDate("");
      setUrl("");
      setOpen(false);
      router.refresh();
    } catch {
      // Offline: keep the form contents for retry.
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string, title: string) {
    if (busy) return;
    if (!window.confirm(`Delete "${title}"?`)) return;
    setBusy(true);
    try {
      await fetch("/api/deadlines", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      router.refresh();
    } catch {
      // Offline: nothing deleted.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center justify-center gap-2 rounded-card border-2 border-dashed border-silk-300 py-3 text-sm font-semibold text-ink-soft"
        >
          <Plus size={16} /> Add a deadline
        </button>
      ) : (
        <form onSubmit={add} className="card flex flex-col gap-2">
          <input
            autoFocus
            className="input"
            placeholder="What's the deadline?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={300}
          />
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            type="url"
            className="input"
            placeholder="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={busy || !title.trim() || !date} className="btn-primary flex-1">
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
      )}

      <ul className="flex flex-col gap-2">
        {deadlines.map((d) => (
          <li
            key={d.id}
            className={`card flex items-start gap-3 py-3 ${d.isPast ? "opacity-50" : ""}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-snug">{d.title}</p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {d.dateLabel}
                {d.isPast ? " · past" : ""}
              </p>
              {d.notes && (
                <p className="mt-1 text-xs leading-snug text-ink-soft">{d.notes}</p>
              )}
              {d.url && (
                <a
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-peacock-600"
                >
                  Official site <ExternalLink size={11} />
                </a>
              )}
            </div>
            <button
              aria-label={`Delete ${d.title}`}
              onClick={() => remove(d.id, d.title)}
              disabled={busy}
              className="-m-1 p-3 text-ink-faint active:text-madder"
            >
              <Trash2 size={16} />
            </button>
          </li>
        ))}
        {deadlines.length === 0 && (
          <p className="py-4 text-center text-sm text-ink-faint">No deadlines yet.</p>
        )}
      </ul>
    </div>
  );
}
