import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";
import JournalForm from "@/components/JournalForm";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "PARENT") redirect("/parent");

  const entries = await prisma.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pb-24 pt-6 md:px-8 md:pb-12 md:pt-10">
      <div>
        <h1 className="font-display text-2xl font-bold">Wins &amp; Sparks</h1>
        <p className="text-sm text-ink-soft">
          Small wins and ideas that excited you, in your own words. Future-you
          will mine these for essays — your voice, preserved.
        </p>
      </div>

      <JournalForm />

      <ul className="flex flex-col gap-2">
        {entries.map((e) => (
          <li key={e.id} className="card py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{e.content}</p>
            <p className="mt-1.5 text-[11px] text-ink-faint">
              {e.kind === "win" ? "🏆 Win" : "✨ Spark"} ·{" "}
              {format(e.createdAt, "d MMM yyyy")}
            </p>
          </li>
        ))}
        {entries.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-faint">
            No entries yet. What went well this week?
          </p>
        )}
      </ul>
      <BottomNav />
    </main>
  );
}
