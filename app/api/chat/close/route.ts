import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isMentorId } from "@/lib/mentors";
import { closeIdleSession } from "@/lib/context";

const Body = z.object({ mentorId: z.string() });

/** Explicit session close (§2.3) — runs the background summary immediately. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isMentorId(parsed.data.mentorId)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  try {
    const closed = await closeIdleSession(parsed.data.mentorId, true);
    return NextResponse.json({ closed });
  } catch {
    return NextResponse.json({ closed: false });
  }
}
