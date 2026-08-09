"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JournalForm() {
  const router = useRouter();
  const [kind, setKind] = useState<"win" | "spark">("win");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || busy) return;
    setBusy(true);
    try {
      await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, content: content.trim() }),
      });
      setContent("");
      router.refresh();
    } catch {
      // Offline: keep her words so she can retry.
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("win")}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold ${
            kind === "win" ? "bg-peacock text-silk-50" : "bg-silk-200 text-ink-soft"
          }`}
        >
          🏆 Win
        </button>
        <button
          type="button"
          onClick={() => setKind("spark")}
          className={`flex-1 rounded-full py-1.5 text-sm font-semibold ${
            kind === "spark" ? "bg-plum text-silk-50" : "bg-silk-200 text-ink-soft"
          }`}
        >
          ✨ Spark
        </button>
      </div>
      <textarea
        className="input min-h-[80px] resize-none"
        placeholder={
          kind === "win"
            ? "Something that went well, big or small…"
            : "An idea or question that excited you…"
        }
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={4000}
      />
      <button type="submit" disabled={busy || !content.trim()} className="btn-primary">
        Save entry
      </button>
    </form>
  );
}
