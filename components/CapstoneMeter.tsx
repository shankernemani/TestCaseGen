// Capstone-mix (§3.1): how many active goals feed each of the three capstone
// types. Identity rides the colored mark; text stays in text tokens.
import type { CapstoneType } from "@/lib/stages";

const ROWS: { key: CapstoneType; label: string; hint: string; dot: string }[] = [
  {
    key: "institutional",
    label: "Institutional",
    hint: "judged & structured",
    dot: "bg-peacock",
  },
  {
    key: "innovative",
    label: "Innovative",
    hint: "public reach",
    dot: "bg-marigold",
  },
  {
    key: "independent",
    label: "Independent",
    hint: "solo depth",
    dot: "bg-plum",
  },
];

export default function CapstoneMeter({
  mix,
}: {
  mix: Record<CapstoneType, number>;
}) {
  return (
    <div className="card">
      <p className="eyebrow">Capstone mix</p>
      <ul className="mt-3 space-y-2.5">
        {ROWS.map(({ key, label, hint, dot }) => (
          <li key={key} className="flex items-center gap-2.5">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                mix[key] > 0 ? dot : "bg-silk-300"
              }`}
            />
            <span className="text-[13px] font-medium text-ink">{label}</span>
            <span className="text-xs text-ink-faint">{hint}</span>
            <span className="ml-auto text-sm font-semibold tabular-nums text-ink">
              {mix[key]}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-ink-faint">
        A strong profile eventually shows all three.
      </p>
    </div>
  );
}
