"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROFILES = [
  { id: "student" as const, name: "Sarvagna", hint: "your journey", emoji: "🎵" },
  { id: "parent" as const, name: "Parent", hint: "progress view", emoji: "🧭" },
];

export default function LoginPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState<"student" | "parent" | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, pin }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(profileId === "parent" ? "/parent" : "/today");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Something went wrong.");
      setPin("");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <h1 className="font-display text-4xl font-semibold text-peacock">Pathfinder</h1>
      <p className="mt-2 text-ink/70">
        Grade 8 to university — one honest step at a time.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3">
        {PROFILES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setProfileId(p.id);
              setError("");
            }}
            className={`card tap-target text-left transition-colors ${
              profileId === p.id ? "border-peacock ring-2 ring-peacock/30" : ""
            }`}
            aria-pressed={profileId === p.id}
          >
            <div className="text-2xl" aria-hidden>
              {p.emoji}
            </div>
            <div className="mt-1 font-display text-lg font-semibold">{p.name}</div>
            <div className="text-sm text-ink/60">{p.hint}</div>
          </button>
        ))}
      </div>

      {profileId && (
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="pin" className="block text-sm font-medium">
            Enter your PIN
          </label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="mt-2 w-full rounded-xl border border-mist bg-white px-4 py-3 text-lg tracking-widest"
            placeholder="••••"
          />
          {error && (
            <p role="alert" className="mt-2 text-sm text-madder">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || pin.length < 4} className="btn-primary mt-4 w-full">
            {busy ? "Opening…" : "Open Pathfinder"}
          </button>
        </form>
      )}
    </main>
  );
}
