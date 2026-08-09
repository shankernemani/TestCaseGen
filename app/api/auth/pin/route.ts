import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser, hashPin, verifyPin } from "@/lib/auth";

const Body = z.object({
  currentPin: z.string().min(4).max(32),
  newPin: z
    .string()
    .min(4)
    .max(12)
    .regex(/^\d+$/, "PIN must be digits only"),
});

/** Change the logged-in user's PIN (requires the current PIN). */
export async function POST(req: Request) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "PIN must be 4–12 digits" },
      { status: 400 },
    );
  }
  const user = await prisma.user.findUnique({ where: { id: current.id } });
  if (!user || !verifyPin(parsed.data.currentPin, user.pinHash, user.pinSalt)) {
    return NextResponse.json({ error: "Current PIN is wrong" }, { status: 403 });
  }
  const { hash, salt } = hashPin(parsed.data.newPin);
  await prisma.user.update({
    where: { id: user.id },
    data: { pinHash: hash, pinSalt: salt },
  });
  return NextResponse.json({ ok: true });
}
