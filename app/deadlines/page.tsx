import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import DeadlineManager from "@/components/DeadlineManager";
import BottomNav from "@/components/BottomNav";

export const dynamic = "force-dynamic";

export default async function DeadlinesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const deadlines = await prisma.deadline.findMany({ orderBy: { date: "asc" } });
  const now = new Date();

  return (
    <main className="flex flex-col gap-4 px-4 pb-24 pt-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Deadlines</h1>
        <p className="text-sm text-ink-soft">
          Competition windows and dates. Always verify on the official site —
          dates shift every year.
        </p>
      </div>
      <DeadlineManager
        deadlines={deadlines.map((d) => ({
          id: d.id,
          title: d.title,
          dateLabel: format(d.date, "d MMMM yyyy"),
          isPast: d.date < now,
          url: d.url,
          notes: d.notes,
        }))}
      />
      {user.role === "STUDENT" && <BottomNav />}
    </main>
  );
}
