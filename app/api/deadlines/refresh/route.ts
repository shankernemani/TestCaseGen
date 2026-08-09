import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { refreshDeadlines } from "@/lib/refresh";

// The web check runs several searches; allow it time.
export const maxDuration = 300;

export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    const result = await refreshDeadlines();
    return NextResponse.json(result);
  } catch (err) {
    console.error("[deadline-refresh] failed:", err);
    if (err instanceof Error && err.message === "COOLDOWN") {
      return NextResponse.json(
        { error: "Checked recently — try again in a few minutes." },
        { status: 429 },
      );
    }
    const message = err instanceof Error ? err.message : "";
    const detail = message.includes("credit balance")
      ? "Anthropic API credits are exhausted — top up at console.anthropic.com → Plans & Billing."
      : message.includes("ANTHROPIC_API_KEY")
        ? message
        : "The web check failed — try again in a moment.";
    return NextResponse.json({ error: detail }, { status: 502 });
  }
}
