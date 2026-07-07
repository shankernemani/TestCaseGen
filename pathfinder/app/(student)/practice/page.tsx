import PracticeClient from "@/components/PracticeClient";

export default function PracticePage() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-3xl font-semibold">Practice</h1>
        <p className="mt-1 text-sm text-ink/60">
          Meera reads your last two weeks before every conversation.
        </p>
      </header>
      <PracticeClient />
    </div>
  );
}
