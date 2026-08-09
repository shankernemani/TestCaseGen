import { redirect } from "next/navigation";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Music2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { lastSevenDays } from "@/lib/practice";
import { toDayString } from "@/lib/streak";
import PracticeForm from "@/components/PracticeForm";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function PracticePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  const logs = await prisma.practiceLog.findMany({
    orderBy: [{ day: "desc" }, { createdAt: "desc" }],
    take: 60,
  });

  const today = toDayString(new Date());
  const week = lastSevenDays(logs, today);
  const weekMinutes = week.reduce((sum, l) => sum + l.minutes, 0);
  const weekDays = new Set(week.map((l) => l.day)).size;

  return (
    <main className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Practice log</h1>
        <p className="text-sm text-ink-soft">
          Your training is your greatest differentiator — the log is proof.
          Meera reads this. <Link href="/mentors/meera" className="font-semibold text-madder">Talk to her →</Link>
        </p>
      </div>

      <div className="card flex items-center gap-3 border-madder-200 bg-madder-50">
        <Music2 size={20} className="shrink-0 text-madder" />
        <p className="text-sm text-madder-700">
          <strong>This week:</strong> {weekDays} of 7 days · {weekMinutes} minutes
        </p>
      </div>

      <PracticeForm />

      <ul className="flex flex-col gap-2">
        {logs.map((l) => (
          <li key={l.id} className="card py-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{l.what}</p>
              <p className="shrink-0 text-xs text-ink-faint">
                {l.minutes} min · {format(parseISO(l.day), "d MMM")}
              </p>
            </div>
            {l.note && (
              <p className="mt-1 text-sm leading-snug text-ink-soft">{l.note}</p>
            )}
          </li>
        ))}
        {logs.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">
            No practice logged yet. Even 20 minutes counts — log today&apos;s.
          </p>
        )}
      </ul>
      <BottomNav />
    </main>
  );
}
