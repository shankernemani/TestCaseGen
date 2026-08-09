import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <Link
        href={user.role === "PARENT" ? "/parent" : "/"}
        className="flex items-center gap-1 text-sm font-medium text-peacock-600"
      >
        <ChevronLeft size={16} />
        {user.role === "PARENT" ? "Back to parent view" : "Back to Today"}
      </Link>
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
