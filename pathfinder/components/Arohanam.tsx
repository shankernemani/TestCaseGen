import { STAGES, stageIndex, type StageId } from "@/lib/stages";

/**
 * §8 signature element: seven swara nodes (Sa→Ni) ascending left-to-right
 * like a scale. Done = peacock fill, active = marigold with soft ring,
 * future = mist. The one memorable visual — everything else stays quiet.
 */
export default function Arohanam({
  activeStage,
  progress,
}: {
  activeStage: StageId;
  /** 0..1 — goals done in the current stage */
  progress: number;
}) {
  const activeIdx = stageIndex(activeStage);

  return (
    <div aria-label={`Journey tracker: stage ${activeIdx + 1} of 7`} role="img">
      <div className="flex items-end justify-between gap-1">
        {STAGES.map((stage, i) => {
          const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "future";
          // each node lifted slightly higher than the last
          const lift = i * 9;
          return (
            <div
              key={stage.id}
              className="flex flex-1 flex-col items-center"
              style={{ paddingBottom: `${lift}px` }}
            >
              <div
                className={
                  state === "done"
                    ? "flex h-11 w-11 items-center justify-center rounded-full bg-peacock font-display text-sm font-semibold text-white"
                    : state === "active"
                      ? "flex h-11 w-11 animate-swara-pulse items-center justify-center rounded-full bg-marigold font-display text-sm font-bold text-ink ring-4 ring-marigold/30"
                      : "flex h-11 w-11 items-center justify-center rounded-full border-2 border-mist bg-white font-display text-sm text-ink/40"
                }
              >
                {stage.swara}
              </div>
              <span
                className={`mt-1 text-[10px] leading-tight ${
                  state === "active" ? "font-semibold text-ink" : "text-ink/50"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* progress within the active stage */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-mist">
          <div
            className="h-full rounded-full bg-marigold transition-all"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink/60">
          {STAGES[activeIdx].theme} — {Math.round(progress * 100)}% of this stage&apos;s goals done
        </p>
      </div>
    </div>
  );
}
