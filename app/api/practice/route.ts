import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markActivityToday } from "@/lib/context";
import { toDayString } from "@/lib/streak";

const Body = z.object({
  minutes: z.number().int().min(1).max(600),
  what: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const entry = await prisma.practiceLog.create({
    data: { ...parsed.data, day: toDayString(new Date()) },
  });
  await markActivityToday();
  return NextResponse.json({ entry });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = z
    .object({ id: z.string() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await prisma.practiceLog.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
