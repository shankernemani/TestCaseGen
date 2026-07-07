import Link from "next/link";
import { db } from "@/lib/db";
import { MENTORS, MENTOR_IDS } from "@/lib/prompts";
import MentorAvatar from "@/components/MentorAvatar";

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
  // Show a whisper of the last exchange under each mentor.
  const lastMessages = await Promise.all(
    MENTOR_IDS.map((id) =>
      db.message.findFirst({
        where: { mentorId: id, flagged: false },
        orderBy: { createdAt: "desc" },
      })
    )
  );

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl font-semibold">Your mentors</h1>
        <p className="mt-1 text-sm text-ink/60">
          Five people in your corner — each with their own craft.
        </p>
      </header>

      <ul className="space-y-3">
        {MENTOR_IDS.map((id, i) => {
          const m = MENTORS[id];
          const last = lastMessages[i];
          return (
            <li key={id}>
              <Link
                href={`/mentors/${id}`}
                className="card flex items-center gap-4 transition-colors hover:border-peacock"
              >
                <MentorAvatar mentorId={id} name={m.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-lg font-semibold">{m.name}</span>
                    <span className="text-xs text-ink/50">{m.role}</span>
                  </div>
                  <p className="truncate text-sm text-ink/60">
                    {last ? last.content.replace(/\[\[task:[^\]]*\]\]/, "").trim() : m.domain}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
