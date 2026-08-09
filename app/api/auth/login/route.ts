import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession, verifyPin } from "@/lib/auth";

const Body = z.object({
  role: z.enum(["STUDENT", "PARENT"]),
  pin: z.string().min(4).max(32),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { role, pin } = parsed.data;

  const user = await prisma.user.findUnique({ where: { role } });
  if (!user || !verifyPin(pin, user.pinHash, user.pinSalt)) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true });
}
