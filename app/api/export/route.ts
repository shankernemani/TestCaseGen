import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * Full-data JSON backup. Five years of goals and journal entries live in one
 * SQLite file — this is the cheap insurance policy.
 *
 * Parent visibility rule (§0.7): raw chat transcripts are included only when
 * the STUDENT downloads her own backup — never in a parent-initiated export.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [
    profile,
    goals,
    journalEntries,
    deadlines,
    practiceLogs,
    mentorMemories,
    activityDays,
  ] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.goal.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.journalEntry.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.deadline.findMany({ orderBy: { date: "asc" } }),
    prisma.practiceLog.findMany({ orderBy: { day: "asc" } }),
    prisma.mentorMemory.findMany(),
    prisma.activityDay.findMany(),
  ]);

  const data: Record<string, unknown> = {
    app: "pathfinder-v2",
    exportedAt: new Date().toISOString(),
    exportedBy: user.role,
    profile,
    goals,
    journalEntries,
    deadlines,
    practiceLogs,
    mentorMemories,
    activityDays,
  };

  if (user.role === "STUDENT") {
    data.chatMessages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "asc" },
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="pathfinder-backup-${stamp}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
