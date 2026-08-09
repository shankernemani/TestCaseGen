import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

const Body = z.object({
  grade: z.number().int().min(6).max(12),
  interests: z.string().min(1).max(1000),
  strengths: z.string().max(1000),
  notes: z.string().max(2000),
  thread: z.string().min(1).max(300),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const profile = await prisma.studentProfile.update({
    where: { id: "sarvagna" },
    data: parsed.data,
  });
  return NextResponse.json({ profile });
}
