import PortfolioClient from "@/components/PortfolioClient";

export default function PortfolioPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">Proof Locker</h1>
        <p className="mt-1 text-sm text-ink/60">
          Performances, awards, recordings, repertoire — documented from day one.
        </p>
      </header>
      <PortfolioClient />
    </div>
  );
}
