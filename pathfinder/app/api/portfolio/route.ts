import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";

const PORTFOLIO_TYPES = [
  "performance",
  "award",
  "publication",
  "project",
  "recording",
  "repertoire",
] as const;

const EntrySchema = z.object({
  type: z.enum(PORTFOLIO_TYPES),
  title: z.string().min(1).max(200),
  date: z.string().datetime(),
  description: z.string().max(2000),
  link: z.string().url().max(500).optional(),
});

export async function GET() {
  if (!getSessionRole()) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const entries = await db.portfolioEntry.findMany({ orderBy: { date: "desc" } });
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
  const entry = await db.portfolioEntry.create({
    data: { ...parsed.data, date: new Date(parsed.data.date) },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
