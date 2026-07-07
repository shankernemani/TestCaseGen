import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";
import { CATEGORIES } from "@/lib/stages";

const TaskCreateSchema = z.object({
  stage: z.enum(["g8", "g9", "g10", "g11", "g12", "dec", "uni"]),
  category: z.enum(CATEGORIES),
  title: z.string().min(1).max(200),
  status: z.enum(["todo", "doing", "done", "suggested"]).optional(),
  due: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const role = getSessionRole();
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  const tasks = await db.task.findMany({
    orderBy: [{ due: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const role = getSessionRole();
  if (!role) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const parsed = TaskCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });
  }
  const { due, ...rest } = parsed.data;

  const task = await db.task.create({
    data: {
      ...rest,
      due: due ? new Date(due) : undefined,
      // Parent-added tasks arrive as suggestions (§3.8).
      status: role === "parent" ? "suggested" : parsed.data.status ?? "todo",
      source: role === "parent" ? "parent" : "user",
    },
  });
  return NextResponse.json({ task }, { status: 201 });
}
