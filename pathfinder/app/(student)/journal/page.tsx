import JournalClient from "@/components/JournalClient";

export default function JournalPage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">Wins &amp; Sparks</h1>
        <p className="mt-1 text-sm text-ink/60">
          Your mentors read your latest wins before every chat.
        </p>
      </header>
      <JournalClient />
    </div>
  );
}
