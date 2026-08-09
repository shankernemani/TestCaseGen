import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const CreateBody = z.object({
  title: z.string().min(1).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: z.string().url().max(500).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { title, date, url, notes } = parsed.data;
  const deadline = await prisma.deadline.create({
    data: { title, date: new Date(`${date}T12:00:00+05:30`), url, notes },
  });
  return NextResponse.json({ deadline });
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = z
    .object({ id: z.string() })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  await prisma.deadline.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
