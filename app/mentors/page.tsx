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
    <main className="flex flex-col gap-3 px-4 pb-24 pt-6">
      <h1 className="font-display text-2xl font-bold">Your mentors</h1>
      <p className="-mt-2 mb-1 text-sm text-ink-soft">
        Five coaches, one goal. They remember what you talked about.
      </p>
      {MENTOR_IDS.map((id) => {
        const m = MENTORS[id];
        return (
          <Link key={id} href={`/mentors/${id}`} className="card flex items-center gap-4">
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-display text-lg font-bold text-silk-50 ${MENTOR_BG[m.color]}`}
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
      <BottomNav />
    </main>
  );
}
