import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markActivityToday } from "@/lib/context";

const Body = z.object({
  kind: z.enum(["win", "spark"]),
  content: z.string().min(1).max(4000),
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
  const entry = await prisma.journalEntry.create({ data: parsed.data });
  await markActivityToday();
  return NextResponse.json({ entry });
}
