import { NextRequest } from "next/server";
import { getSessionRole } from "@/lib/auth";
import { exportPortfolioMarkdown } from "@/lib/exporter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!getSessionRole()) {
    return Response.json({ error: "Please log in." }, { status: 401 });
  }
  const format = req.nextUrl.searchParams.get("format") ?? "md";
  if (format !== "md") {
    return Response.json({ error: "Only format=md is supported right now." }, { status: 400 });
  }
  const md = await exportPortfolioMarkdown();
  return new Response(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="sarvagna-portfolio.md"`,
    },
  });
}
