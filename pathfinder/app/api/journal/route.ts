import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";

const EntrySchema = z.object({
  text: z.string().min(1).max(500),
  kind: z.enum(["win", "spark"]),
});

export async function GET() {
  if (!getSessionRole()) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const entries = await db.journalEntry.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest) {
  if (getSessionRole() !== "student") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  const parsed = EntrySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid entry" }, { status: 400 });
  }
  const entry = await db.journalEntry.create({ data: parsed.data });
  return NextResponse.json({ entry }, { status: 201 });
}
