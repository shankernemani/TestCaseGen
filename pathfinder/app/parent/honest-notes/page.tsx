import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";

// §3.8 / §6.4: the family's own research conclusions, static.
export default function HonestNotesPage() {
  const role = getSessionRole();
  if (role !== "parent") redirect(role ? "/today" : "/login");

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <Link href="/parent" className="tap-target inline-flex items-center gap-1 text-sm font-medium text-peacock">
        <ArrowLeft size={16} aria-hidden /> Parent view
      </Link>

      <h1 className="mt-3 font-display text-3xl font-semibold">Honest Notes</h1>
      <p className="mt-1 text-sm text-ink/60">
        The research that made us walk away from a ₹30-lakh contract — kept here so we never
        forget it.
      </p>

      <div className="mt-5 space-y-4">
        <section className="card">
          <h2 className="font-display text-lg font-semibold">The funding map (2026)</h2>
          <p className="mt-2 text-sm text-ink/75">
            Nine US universities are <strong>need-blind AND meet 100% of need</strong> for
            international students:
          </p>
          <p className="mt-1 text-sm font-medium">
            Harvard · Yale · Princeton · MIT · Amherst · Dartmouth · Bowdoin · Brown · Notre Dame
          </p>
          <p className="mt-3 text-sm text-ink/75">
            <strong>Merit scholarships</strong> for internationals: Vanderbilt, Rochester, Case
            Western, Duke (Karsh), USC, Emory, Richmond. The <strong>Tata Scholarship at
            Cornell</strong> is specifically for Indian students.
          </p>
          <p className="mt-3 text-sm text-ink/75">
            The UK has almost no undergraduate funding for Indians — if money matters, it&apos;s a
            US-first strategy.
          </p>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold">The twelve principles</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink/75">
            <li>Academics gate everything — rigor, rising grades, eventually SAT ~1500+.</li>
            <li>Well-lopsided beats well-rounded: one deep spike, everything else solid.</li>
            <li>Her Carnatic training is the spike — a decade of documented depth.</li>
            <li>2–3 activities with one cohesive theme; padding is transparent to readers.</li>
            <li>One finished, public artifact per year beats ten memberships.</li>
            <li>Junior-category arbitrage: enter while under age ceilings — thinner fields.</li>
            <li>Big fish, small pond: prestigious-but-unsaturated arenas over bloodbaths.</li>
            <li>Selective free programs (RSI, SSP, TASS, PROMYS) are merit signals; paid camps are not.</li>
            <li>Document everything from day one — the Proof Locker is the application.</li>
            <li>Depth of relationships: two recommenders cultivated over years, not weeks.</li>
            <li>Grade 8 is for exploration and habits; what &quot;counts&quot; starts Grade 9.</li>
            <li>Structure and accountability are what consultants sell — we built them instead.</li>
          </ol>
        </section>

        <section className="card border-madder/40">
          <h2 className="font-display text-lg font-semibold text-madder">Bright lines</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
            <li><strong>No ghostwriting</strong> — not by AI, not by adults, under any phrasing.</li>
            <li><strong>No fake NGOs</strong> or resume-manufactured &quot;service&quot;.</li>
            <li><strong>No pay-to-publish</strong> journals or vanity conferences.</li>
            <li><strong>No purchased internships</strong> or pay-for-access &quot;research&quot;.</li>
          </ul>
          <p className="mt-2 text-sm text-ink/75">
            Admissions officers can tell. And she&apos;d know. The honesty is the product&apos;s soul.
          </p>
        </section>

        <section className="card">
          <h2 className="font-display text-lg font-semibold">When to bring in a human</h2>
          <p className="mt-2 text-sm text-ink/75">
            Grade 10–11 is when to consider hiring a human counselor for final-mile application
            review (typically ₹3–8L). This app&apos;s job is everything <em>before</em> that:
            strategy cadence, discovery, competitions, documentation, and honest feedback. It
            does not replace her guru, her teachers, real judges, recommenders — or that final
            human review.
          </p>
        </section>
      </div>
    </div>
  );
}
