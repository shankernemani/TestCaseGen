import { NextResponse } from "next/server";
import { getSessionRole } from "@/lib/auth";
import { getDeadlines } from "@/lib/deadlines";

export async function GET() {
  if (!getSessionRole()) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const deadlines = await getDeadlines();
  return NextResponse.json({ deadlines });
}
