import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sweepIdleSessions } from "@/lib/context";

/** Fire-and-forget from the dashboard/parent view: folds any idle mentor
 * sessions into memory so summaries and suggested goals stay fresh. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const closed = await sweepIdleSessions();
  return NextResponse.json({ closed });
}
