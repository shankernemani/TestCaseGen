import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionRole } from "@/lib/auth";

const PatchSchema = z.object({
  nextDate: z.string().datetime().nullable().optional(),
  typicalWindow: z.string().max(120).optional(),
  url: z.string().url().max(500).optional(),
});

// §3.4: parent can edit dates yearly (they shift).
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (getSessionRole() !== "parent") {
    return NextResponse.json({ error: "Parent access only." }, { status: 403 });
  }
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }
  const { nextDate, ...rest } = parsed.data;
  try {
    const deadline = await db.deadline.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(nextDate !== undefined ? { nextDate: nextDate ? new Date(nextDate) : null } : {}),
      },
    });
    return NextResponse.json({ deadline });
  } catch {
    return NextResponse.json({ error: "Deadline not found" }, { status: 404 });
  }
}
