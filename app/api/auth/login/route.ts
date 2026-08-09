import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, verifyPin } from "@/lib/auth";

const Body = z.object({
  role: z.enum(["STUDENT", "PARENT"]),
  pin: z.string().min(4).max(32),
});

// Brute-force guard: a 4-digit PIN space is tiny, so lock a profile out
// after repeated failures. In-memory is fine for a single-process app; a
// restart clears it, but an attacker can't restart the server.
const MAX_FAILURES = 5;
const LOCKOUT_MS = 5 * 60 * 1000;
const attempts = new Map<string, { failures: number; lockedUntil: number }>();

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { role, pin } = parsed.data;

  const now = Date.now();
  let state = attempts.get(role) ?? { failures: 0, lockedUntil: 0 };
  if (now < state.lockedUntil) {
    const mins = Math.ceil((state.lockedUntil - now) / 60000);
    return NextResponse.json(
      { error: `Too many tries — locked for ${mins} more minute${mins === 1 ? "" : "s"}.` },
      { status: 429 },
    );
  }
  // A lockout that has expired grants a fresh batch of attempts — otherwise
  // one wrong PIN after expiry would immediately re-lock forever.
  if (state.lockedUntil !== 0 && now >= state.lockedUntil) {
    state = { failures: 0, lockedUntil: 0 };
  }

  const user = await prisma.user.findUnique({ where: { role } });
  if (!user || !verifyPin(pin, user.pinHash, user.pinSalt)) {
    const failures = state.failures + 1;
    attempts.set(role, {
      failures,
      lockedUntil: failures >= MAX_FAILURES ? now + LOCKOUT_MS : 0,
    });
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  attempts.delete(role);
  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
