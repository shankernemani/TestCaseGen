// The signature Arohanam tracker: Grade 8 → University as seven ascending
// swaras, current stage highlighted, progress = goals done in current stage.
import { STAGES } from "@/lib/stages";

export default function ArohanamTracker({
  currentStage,
  done,
  total,
}: {
  currentStage: number;
  done: number;
  total: number;
}) {
  return (
    <div className="card">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-peacock-700">
          Arohanam
        </h2>
        <span className="text-xs text-ink-faint">
          {STAGES[currentStage - 1].label} · {done}/{total} goals done
        </span>
      </div>
      <div className="flex items-end justify-between px-1">
        {STAGES.map((s) => {
          const isPast = s.n < currentStage;
          const isCurrent = s.n === currentStage;
          // Ascending scale: each swara sits a little higher.
          const lift = (s.n - 1) * 8;
          return (
            <div
              key={s.n}
              className="flex flex-1 flex-col items-center gap-1"
              style={{ marginBottom: lift }}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full font-display text-sm font-bold transition ${
                  isCurrent
                    ? "bg-peacock text-silk-50 ring-4 ring-gold-soft"
                    : isPast
                      ? "bg-gold text-silk-50"
                      : "bg-silk-200 text-ink-faint"
                }`}
              >
                {s.swara}
              </span>
              <span
                className={`text-[9px] leading-tight ${
                  isCurrent ? "font-semibold text-peacock-700" : "text-ink-faint"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      {total > 0 && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-silk-200">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
