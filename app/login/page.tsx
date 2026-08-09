"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PROFILES = [
  { role: "STUDENT", label: "Sarvagna", emoji: "🎶", color: "bg-peacock" },
  { role: "PARENT", label: "Parent", emoji: "🧭", color: "bg-slate" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<"STUDENT" | "PARENT" | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || busy) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, pin }),
    });
    setBusy(false);
    if (res.ok) {
      router.push(role === "PARENT" ? "/parent" : "/");
      router.refresh();
    } else {
      setError("That PIN doesn't match. Try again.");
      setPin("");
    }
  }

  return (
    <main className="flex min-h-dvh flex-col justify-center gap-8 px-6 py-10">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-peacock-700">
          Pathfinder
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Grade 8 → University · one swara at a time
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {PROFILES.map((p) => (
          <button
            key={p.role}
            onClick={() => {
              setRole(p.role);
              setError("");
            }}
            className={`card flex flex-col items-center gap-2 py-6 transition ${
              role === p.role ? "ring-2 ring-peacock" : ""
            }`}
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl text-silk-50 ${p.color}`}
            >
              {p.emoji}
            </span>
            <span className="font-semibold">{p.label}</span>
          </button>
        ))}
      </div>

      {role && (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            placeholder="Enter your PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="input text-center tracking-[0.5em]"
          />
          {error && <p className="text-center text-sm text-madder">{error}</p>}
          <button type="submit" disabled={busy || pin.length < 4} className="btn-primary">
            {busy ? "Checking…" : "Enter"}
          </button>
        </form>
      )}
    </main>
  );
}
