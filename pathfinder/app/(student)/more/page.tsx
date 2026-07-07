import Link from "next/link";
import { BookOpen, CalendarClock, Flame, NotebookPen } from "lucide-react";
import { getDeadlines } from "@/lib/deadlines";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function MorePage() {
  const deadlines = await getDeadlines();
  const eligible = deadlines.filter((d) => d.eligible);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">More</h1>
      </header>

      <nav className="space-y-2" aria-label="More sections">
        <Link href="/practice" className="card flex items-center gap-3 transition-colors hover:border-peacock">
          <Flame size={20} className="text-marigold" aria-hidden />
          <div>
            <p className="font-medium">Practice log</p>
            <p className="text-xs text-ink/55">Daily minutes and your streak</p>
          </div>
        </Link>
        <Link href="/journal" className="card flex items-center gap-3 transition-colors hover:border-peacock">
          <NotebookPen size={20} className="text-plum" aria-hidden />
          <div>
            <p className="font-medium">Wins &amp; Sparks</p>
            <p className="text-xs text-ink/55">Two-line journal your mentors read</p>
          </div>
        </Link>
      </nav>

      <section className="card">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <CalendarClock size={18} className="text-peacock" aria-hidden /> Deadline radar
        </h2>
        <ul className="mt-3 space-y-3">
          {eligible.map((d) => (
            <li key={d.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-2">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-peacock underline-offset-2 hover:underline"
                >
                  {d.name}
                </a>
                {d.daysAway !== null && (
                  <span className={`shrink-0 text-xs ${d.daysAway <= 45 ? "font-semibold text-marigold" : "text-ink/50"}`}>
                    {d.daysAway}d
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/55">
                {d.typicalWindow} · {d.eligibility}
              </p>
            </li>
          ))}
        </ul>
        {eligible.length < deadlines.length && (
          <p className="mt-3 border-t border-mist pt-2 text-xs text-ink/50">
            {deadlines.length - eligible.length} more unlock in later grades — they&apos;re
            waiting on the radar.
          </p>
        )}
      </section>

      <section className="card">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <BookOpen size={18} className="text-slate" aria-hidden /> About Pathfinder
        </h2>
        <p className="mt-2 text-sm text-ink/70">
          Built by Appa as a thoughtful alternative to expensive consultancies. The mentors
          coach — they never write your work. Your chats are yours alone; the parent view
          only sees goals, streaks, and short summaries.
        </p>
      </section>

      <LogoutButton />
    </div>
  );
}
