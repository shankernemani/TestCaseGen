import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { MENTOR_IDS, MENTORS } from "@/lib/mentors";
import { MENTOR_BG, MENTOR_TEXT } from "@/components/mentorColors";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function MentorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  return (
    <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <h1 className="font-display text-2xl font-bold md:text-3xl">
        Your mentors
      </h1>
      <p className="mt-1 text-sm text-ink-soft">
        Five coaches, one goal. They remember what you talked about.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:gap-4">
        {MENTOR_IDS.map((id) => {
          const m = MENTORS[id];
          return (
            <Link
              key={id}
              href={`/mentors/${id}`}
              className="card flex items-center gap-4 transition-shadow hover:shadow-pop"
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-white ${MENTOR_BG[m.color]}`}
              >
                {m.name[0]}
              </span>
              <div className="min-w-0">
                <p className="font-semibold">
                  {m.name}{" "}
                  <span className={`text-xs font-medium ${MENTOR_TEXT[m.color]}`}>
                    · {m.role}
                  </span>
                </p>
                <p className="truncate text-sm text-ink-soft">{m.tagline}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <BottomNav />
    </main>
  );
}
