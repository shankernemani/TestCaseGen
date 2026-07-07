import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPin } from "@/lib/pin";
import { sessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

const LoginSchema = z.object({
  profileId: z.enum(["student", "parent"]),
  pin: z.string().min(4).max(12),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { profileId, pin } = parsed.data;

  const profile = await db.profile.findUnique({ where: { id: profileId } });
  if (!profile || !verifyPin(pin, profile.pinHash)) {
    return NextResponse.json({ error: "That PIN doesn't match — try again." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, role: profile.role, name: profile.name });
  res.cookies.set(sessionCookie(profile.role as "student" | "parent"));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: SESSION_COOKIE_NAME, value: "", path: "/", maxAge: 0 });
  return res;
}
