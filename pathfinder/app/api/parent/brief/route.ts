import { NextResponse } from "next/server";
import { format, subDays } from "date-fns";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { backgroundCompletion } from "@/lib/anthropic";
import { PARENT_BRIEF_PROMPT } from "@/lib/prompts";
import { computeStreak } from "@/lib/streak";
import { upcomingAlerts } from "@/lib/deadlines";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// §3.8: Haiku-generated monthly parent brief.
export async function GET() {
  if (getSessionRole() !== "parent") {
    return NextResponse.json({ error: "Parent access only." }, { status: 403 });
  }

  const monthAgo = subDays(new Date(), 30);
  const [profile, doneTasks, sessions, practice, alerts] = await Promise.all([
    db.profile.findUnique({ where: { id: "student" } }),
    db.task.findMany({ where: { status: "done" }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.sessionLog.findMany({
      where: { createdAt: { gte: monthAgo } },
      orderBy: { createdAt: "desc" },
    }),
    db.practiceLog.findMany({ orderBy: { date: "desc" }, take: 40 }),
    upcomingAlerts(),
  ]);

  const streak = computeStreak(practice.map((p) => p.date));
  const monthMinutes = practice
    .filter((p) => p.date >= monthAgo)
    .reduce((s, p) => s + p.minutes, 0);

  const data = [
    `Tasks completed (recent): ${doneTasks.map((t) => t.title).join("; ") || "none yet"}`,
    `Mentor sessions this month: ${sessions.length}`,
    `Session summaries: ${sessions.map((s) => s.summary).join(" | ") || "none"}`,
    `Practice: ${monthMinutes} minutes in the last 30 days; current streak ${streak} days`,
    `Upcoming eligible deadlines: ${
      alerts
        .map((a) => `${a.name} (${a.daysAway} days away)`)
        .join("; ") || "none dated within 45 days"
    }`,
  ].join("\n");

  try {
    const brief = await backgroundCompletion(
      PARENT_BRIEF_PROMPT.replace("{grade}", String(profile?.grade ?? 8)),
      [{ role: "user", content: data }]
    );
    return NextResponse.json({ brief, generatedAt: format(new Date(), "d MMM yyyy") });
  } catch (err) {
    console.error("[parent/brief]", err);
    return NextResponse.json(
      { error: "Could not generate the brief — check the API key.", data },
      { status: 502 }
    );
  }
}
