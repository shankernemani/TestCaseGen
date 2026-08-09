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

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = PatchBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const { id, action } = parsed.data;

  const data =
    action === "complete"
      ? { status: "done", completedAt: new Date() }
      : action === "reopen"
        ? { status: "open", completedAt: null }
        : action === "accept"
          ? { status: "open" }
          : { status: "dropped" };

  const goal = await prisma.goal.update({ where: { id }, data });
  if (action === "complete" && user.role === "STUDENT") {
    await markActivityToday();
  }
  return NextResponse.json({ goal });
}
