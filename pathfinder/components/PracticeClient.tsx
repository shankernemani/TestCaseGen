"use client";

import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

type Week = { day: string; minutes: number }[];

/** §3.6 one-tap daily log: minutes + optional note, weekly chart, streak. */
export default function PracticeClient() {
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<Week>([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [note, setNote] = useState("");
  const [custom, setCustom] = useState("");
  const [loaded, setLoaded] = useState(false);

  async function load() {
    const res = await fetch("/api/practice");
    if (res.ok) {
      const data = await res.json();
      setStreak(data.streak);
      setWeek(data.week);
      setTodayMinutes(data.today?.minutes ?? 0);
      setLoaded(true);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function log(minutes: number) {
    const res = await fetch("/api/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ minutes, ...(note.trim() ? { note: note.trim() } : {}) }),
    });
    if (res.ok) {
      setNote("");
      setCustom("");
      load();
    }
  }

  const max = Math.max(30, ...week.map((w) => w.minutes));

  return (
    <div className="space-y-4">
      <section className="card flex items-center gap-4">
        <Flame
          size={40}
          className={streak > 0 ? "text-marigold" : "text-ink/25"}
          fill={streak > 0 ? "#E8A020" : "none"}
          aria-hidden
        />
        <div>
          <div className="font-display text-3xl font-semibold">{streak} days</div>
          <p className="text-sm text-ink/60">
            {streak === 0
              ? "Log today's practice to light the flame"
              : todayMinutes > 0
                ? `${todayMinutes} minutes today — beautifully done`
                : "Keep it alive — log today's practice"}
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-semibold">Log today</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[15, 30, 45, 60].map((m) => (
            <button key={m} type="button" onClick={() => log(m)} className="btn-quiet flex-1">
              {m} min
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min={1}
            max={600}
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="Other…"
            aria-label="Custom minutes"
            className="w-24 rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note (raga, piece, what clicked)"
            aria-label="Practice note"
            className="flex-1 rounded-xl border border-mist px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={!custom || Number(custom) < 1}
            onClick={() => log(Number(custom))}
            className="btn-primary"
          >
            Log
          </button>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-lg font-semibold">This week</h2>
        {loaded && (
          <div className="mt-3 flex h-32 items-end gap-2" role="img" aria-label="Practice minutes this week">
            {week.map((w, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-ink/50">{w.minutes > 0 ? w.minutes : ""}</span>
                <div
                  className={`w-full rounded-t-md ${w.minutes > 0 ? "bg-peacock" : "bg-mist"}`}
                  style={{ height: `${Math.max(4, (w.minutes / max) * 100)}%` }}
                />
                <span className="text-[10px] text-ink/50">{w.day}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
