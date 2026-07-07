import type { MentorId } from "@/lib/prompts";

// Literal class names so Tailwind's scanner keeps them.
const COLOR_CLASSES: Record<MentorId, string> = {
  priya: "bg-peacock",
  meera: "bg-madder",
  arjun: "bg-marigold text-ink",
  dev: "bg-slate",
  anaya: "bg-plum",
};

export default function MentorAvatar({
  mentorId,
  name,
  size = "md",
}: {
  mentorId: MentorId;
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-8 w-8 text-sm" : "h-11 w-11 text-lg";
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center rounded-full font-display font-semibold text-white ${COLOR_CLASSES[mentorId]} ${sizeClass}`}
    >
      {name[0]}
    </div>
  );
}
