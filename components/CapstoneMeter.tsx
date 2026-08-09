// Capstone-mix meter (§3.1): three dots — Institutional / Innovative /
// Independent — showing how many active goals feed each capstone type.
import type { CapstoneType } from "@/lib/stages";

const LABELS: { key: CapstoneType; label: string; dot: string }[] = [
  { key: "institutional", label: "Institutional", dot: "bg-peacock" },
  { key: "innovative", label: "Innovative", dot: "bg-marigold" },
  { key: "independent", label: "Independent", dot: "bg-plum" },
];

export default function CapstoneMeter({
  mix,
}: {
  mix: Record<CapstoneType, number>;
}) {
  return (
    <div className="card flex items-center justify-between">
      <span className="text-sm font-semibold text-ink-soft">Capstone mix</span>
      <div className="flex gap-4">
        {LABELS.map(({ key, label, dot }) => (
          <div key={key} className="flex items-center gap-1.5" title={label}>
            <span
              className={`h-3 w-3 rounded-full ${mix[key] > 0 ? dot : "bg-silk-300"}`}
            />
            <span className="text-xs text-ink-faint">
              {label.slice(0, 5)} {mix[key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
