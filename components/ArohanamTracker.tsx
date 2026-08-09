// The signature element: Grade 8 → University as the seven ascending swaras,
// drawn as one rising path. Climbed ground is gold, the current swara is
// peacock with a halo, the road ahead stays quiet. Token hexes mirror
// tailwind.config.ts (SVG needs literals).
import { STAGES } from "@/lib/stages";

const C = {
  gold: "#BF8A00",
  goldSoft: "#E3C566",
  peacock: "#116466",
  peacockHalo: "rgba(17, 100, 102, 0.14)",
  track: "#E8E8ED",
  futureStroke: "#D2D2D7",
  ink: "#1D1D1F",
  faint: "#86868B",
  white: "#FFFFFF",
};

const W = 700;
const x = (i: number) => 52 + i * 99.3;
const y = (i: number) => 84 - i * 10.5;

export default function ArohanamTracker({
  currentStage,
  done,
  total,
}: {
  currentStage: number;
  done: number;
  total: number;
}) {
  const current = currentStage - 1; // 0-indexed
  const allPoints = STAGES.map((_, i) => `${x(i)},${y(i)}`).join(" ");
  const climbedPoints = STAGES.slice(0, current + 1)
    .map((_, i) => `${x(i)},${y(i)}`)
    .join(" ");

  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold text-peacock-700">
          Arohanam
        </h2>
        <p className="text-xs text-ink-faint">
          {total > 0 ? (
            <>
              <span className="font-semibold text-ink">{done}</span> of {total}{" "}
              goals this stage
            </>
          ) : (
            STAGES[current].label
          )}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} 124`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label={`Journey tracker: currently at ${STAGES[current].label}, stage ${currentStage} of 7`}
      >
        {/* the road, then the climbed portion in gold */}
        <polyline
          points={allPoints}
          fill="none"
          stroke={C.track}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {current > 0 && (
          <polyline
            points={climbedPoints}
            fill="none"
            stroke={C.goldSoft}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {STAGES.map((s, i) => {
          const isPast = i < current;
          const isCurrent = i === current;
          return (
            <g key={s.n}>
              {isCurrent && (
                <circle cx={x(i)} cy={y(i)} r={21} fill={C.peacockHalo} />
              )}
              <circle
                cx={x(i)}
                cy={y(i)}
                r={14}
                fill={isCurrent ? C.peacock : isPast ? C.gold : C.white}
                stroke={isPast ? C.gold : isCurrent ? C.peacock : C.futureStroke}
                strokeWidth={1.5}
              />
              <text
                x={x(i)}
                y={y(i) + 4}
                textAnchor="middle"
                fontSize={11}
                fontWeight={700}
                fill={isPast || isCurrent ? C.white : C.faint}
              >
                {s.swara}
              </text>
              <text
                x={x(i)}
                y={y(i) + 32}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={isCurrent ? 700 : 400}
                fill={isCurrent ? C.ink : C.faint}
              >
                {s.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
