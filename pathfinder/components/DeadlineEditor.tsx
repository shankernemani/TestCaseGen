"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Pencil } from "lucide-react";

type Deadline = {
  id: string;
  name: string;
  typicalWindow: string;
  eligibility: string;
  url: string;
  nextDate: string | null;
  relevantFromGrade: number;
};

/** §3.4: parent edits deadline dates yearly (they shift). */
export default function DeadlineEditor({ deadlines }: { deadlines: Deadline[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [date, setDate] = useState("");

  async function save(id: string) {
    await fetch(`/api/deadlines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextDate: date ? new Date(date).toISOString() : null }),
    });
    setEditing(null);
    router.refresh();
  }

  return (
    <ul className="mt-3 space-y-3">
      {deadlines.map((d) => (
        <li key={d.id} className="text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-peacock underline-offset-2 hover:underline"
              >
                {d.name}
              </a>
              <p className="text-xs text-ink/55">
                {d.typicalWindow} · {d.eligibility} · from Grade {d.relevantFromGrade}
              </p>
              {d.nextDate && editing !== d.id && (
                <p className="text-xs font-medium text-marigold">
                  Next: {format(new Date(d.nextDate), "d MMM yyyy")}
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label={`Edit date for ${d.name}`}
              onClick={() => {
                setEditing(editing === d.id ? null : d.id);
                setDate(d.nextDate ? format(new Date(d.nextDate), "yyyy-MM-dd") : "");
              }}
              className="tap-target flex shrink-0 items-center justify-center text-ink/40 hover:text-peacock"
            >
              <Pencil size={15} aria-hidden />
            </button>
          </div>
          {editing === d.id && (
            <div className="mt-1.5 flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                aria-label={`Next date for ${d.name}`}
                className="flex-1 rounded-xl border border-mist px-3 py-1.5 text-sm"
              />
              <button type="button" onClick={() => save(d.id)} className="btn-primary !min-h-[38px] text-sm">
                Save
              </button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
