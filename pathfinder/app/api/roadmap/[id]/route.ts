import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";

const TaskPatchSchema = z.object({
  status: z.enum(["todo", "doing", "done", "suggested"]).optional(),
  title: z.string().min(1).max(200).optional(),
  due: z.string().datetime().nullable().optional(),
  artifactLink: z.string().url().max(500).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (getSessionRole() !== "student") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  const parsed = TaskPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const { due, ...rest } = parsed.data;
  try {
    const task = await db.task.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(due !== undefined ? { due: due ? new Date(due) : null } : {}),
      },
    });
    return NextResponse.json({ task });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  if (getSessionRole() !== "student") {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  try {
    await db.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
}
