// Dashboard stat tiles (dataviz stat-tile contract: label · value · trend).
// Both tiles carry a 7-day trend row so they sit as a balanced pair — bars
// for practice minutes, dots for active days. Past periods use the
// de-emphasis step of the ramp; today uses the full accent.
import { Flame } from "lucide-react";

export function PracticeTile({
  weekMinutes,
  weekDays,
  bars,
}: {
  weekMinutes: number;
  weekDays: number;
  bars: number[]; // minutes per day, oldest → today (7 entries)
}) {
  const max = Math.max(...bars, 1);
  return (
    <div className="card flex flex-col">
      <p className="eyebrow">Practice</p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none text-ink">
        {weekMinutes}
        <span className="ml-1 text-sm font-normal text-ink-faint">min</span>
      </p>
      <p className="mt-1 text-xs text-ink-faint">{weekDays} of 7 days</p>
      <div
        className="mt-auto flex h-9 items-end gap-1 pt-3"
        aria-label={`Minutes per day, last 7 days: ${bars.join(", ")}`}
      >
        {bars.map((minutes, i) => {
          const isToday = i === bars.length - 1;
          if (minutes === 0) {
            return (
              <span key={i} className="h-[3px] flex-1 rounded-sm bg-silk-200" />
            );
          }
          const h = Math.max(Math.round((minutes / max) * 36), 6);
          return (
            <span
              key={i}
              className={`flex-1 rounded-t-sm ${
                isToday ? "bg-peacock-500" : "bg-peacock-200"
              }`}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function StreakTile({
  streak,
  best,
  activeDays,
}: {
  streak: number;
  best: number;
  activeDays: boolean[]; // last 7 days, oldest → today
}) {
  return (
    <div className="card flex flex-col">
      <p className="eyebrow">Streak</p>
      <p className="mt-1.5 flex items-baseline text-[26px] font-semibold leading-none text-ink">
        {streak}
        <span className="ml-1 text-sm font-normal text-ink-faint">
          {streak === 1 ? "day" : "days"}
        </span>
        {streak > 0 && (
          <Flame size={16} className="ml-auto self-center text-marigold" />
        )}
      </p>
      <p className="mt-1 text-xs text-ink-faint">best {best}</p>
      <div
        className="mt-auto flex h-9 items-center gap-1 pt-3"
        aria-label={`Active days, last 7: ${activeDays.filter(Boolean).length}`}
      >
        {activeDays.map((active, i) => {
          const isToday = i === activeDays.length - 1;
          return (
            <span key={i} className="flex flex-1 justify-center">
              <span
                className={`h-2 w-2 rounded-full ${
                  active
                    ? isToday
                      ? "bg-marigold-500"
                      : "bg-marigold-200"
                    : "bg-silk-200"
                }`}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}
