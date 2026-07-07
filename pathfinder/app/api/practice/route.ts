import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { computeStreak, weeklyMinutes } from "@/lib/streak";

const LogSchema = z.object({
  minutes: z.number().int().min(1).max(600),
  note: z.string().max(300).optional(),
  date: z.string().datetime().optional(), // defaults to today
});

export async function GET() {
  if (!getSessionRole()) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const logs = await db.practiceLog.findMany({ orderBy: { date: "desc" }, take: 60 });
  const streak = computeStreak(logs.map((l) => l.date));
  const week = weeklyMinutes(logs);
  const today = await db.practiceLog.findUnique({
    where: { date: startOfDay(new Date()) },
  });
  return NextResponse.json({ streak, week, today, recent: logs.slice(0, 14) });
}

export async function POST(req: NextRequest) {
  if (getSessionRole() !== "student") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  const parsed = LogSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid log" }, { status: 400 });
  }
  const day = startOfDay(parsed.data.date ? new Date(parsed.data.date) : new Date());

  // One log per day — additional logs add minutes.
  const log = await db.practiceLog.upsert({
    where: { date: day },
    update: {
      minutes: { increment: parsed.data.minutes },
      ...(parsed.data.note ? { note: parsed.data.note } : {}),
    },
    create: { date: day, minutes: parsed.data.minutes, note: parsed.data.note },
  });
  const logs = await db.practiceLog.findMany({ orderBy: { date: "desc" }, take: 60 });
  return NextResponse.json({ log, streak: computeStreak(logs.map((l) => l.date)) }, { status: 201 });
}
