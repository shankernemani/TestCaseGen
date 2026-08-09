import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { markActivityToday } from "@/lib/context";

const CreateBody = z.object({
  title: z.string().min(1).max(300),
  stage: z.number().int().min(1).max(7).optional(),
  capstoneType: z.enum(["institutional", "innovative", "independent"]).optional(),
  dueDate: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { title, stage, capstoneType, dueDate } = parsed.data;
  const goal = await prisma.goal.create({
    data: {
      title,
      stage: stage ?? 1,
      capstoneType,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      source: user.role === "PARENT" ? "parent" : "self",
    },
  });
  return NextResponse.json({ goal });
}

const PatchBody = z.object({
  id: z.string(),
  action: z.enum(["complete", "reopen", "accept", "drop"]),
});

// Which current statuses each action may be applied to. Notably, "accept"
// only moves a mentor suggestion to open — and per the spec it must be HER
// tap, so PATCH is student-only.
const ALLOWED_FROM: Record<string, string[]> = {
  complete: ["open"],
  reopen: ["done"],
  accept: ["suggested"],
  drop: ["open", "suggested"],
};

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only Sarvagna can change goal status" },
      { status: 403 },
    );
  }

  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id, action } = parsed.data;

  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
  if (!ALLOWED_FROM[action].includes(existing.status)) {
    return NextResponse.json(
      { error: `Cannot ${action} a ${existing.status} goal` },
      { status: 409 },
    );
  }

  const data =
    action === "complete"
      ? { status: "done", completedAt: new Date() }
      : action === "reopen"
        ? { status: "open", completedAt: null }
        : action === "accept"
          ? { status: "open", completedAt: null }
          : { status: "dropped", completedAt: null };

  const goal = await prisma.goal.update({ where: { id }, data });
  if (action === "complete") {
    await markActivityToday();
  }
  return NextResponse.json({ goal });
}
