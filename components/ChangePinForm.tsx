"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ChangePinForm() {
  const [open, setOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (newPin !== confirmPin) {
      setMessage({ ok: false, text: "New PINs don't match." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPin, newPin }),
      });
      const data = await res.json().catch(() => ({}) as { error?: string });
      if (res.ok) {
        setMessage({ ok: true, text: "PIN changed." });
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setOpen(false);
      } else {
        setMessage({ ok: false, text: data.error ?? "Couldn't change the PIN." });
      }
    } catch {
      setMessage({ ok: false, text: "Network problem — try again." });
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div>
        <button
          onClick={() => setOpen(true)}
          className="card flex w-full items-center gap-3 text-sm font-semibold text-ink-soft"
        >
          <KeyRound size={18} /> Change PIN
        </button>
        {message && (
          <p
            className={`mt-1 text-center text-xs ${message.ok ? "text-peacock-600" : "text-madder"}`}
          >
            {message.text}
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-2">
      <p className="text-sm font-semibold text-ink-soft">Change PIN</p>
      <input
        type="password"
        inputMode="numeric"
        className="input"
        placeholder="Current PIN"
        value={currentPin}
        onChange={(e) => setCurrentPin(e.target.value)}
        autoFocus
      />
      <input
        type="password"
        inputMode="numeric"
        className="input"
        placeholder="New PIN (4–12 digits)"
        value={newPin}
        onChange={(e) => setNewPin(e.target.value)}
      />
      <input
        type="password"
        inputMode="numeric"
        className="input"
        placeholder="Repeat new PIN"
        value={confirmPin}
        onChange={(e) => setConfirmPin(e.target.value)}
      />
      {message && !message.ok && (
        <p className="text-center text-xs text-madder">{message.text}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy || currentPin.length < 4 || newPin.length < 4}
          className="btn-primary flex-1"
        >
          {busy ? "Saving…" : "Change PIN"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setMessage(null);
          }}
          className="rounded-full border border-silk-300 px-4 text-sm text-ink-soft"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
