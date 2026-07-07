import { format } from "date-fns";
import { db } from "./db";
import { backgroundCompletion } from "./anthropic";
import { COMMON_APP_DRAFT_PROMPT } from "./prompts";

/** §3.5 Common App hard limits. */
export const LIMITS = {
  position: 50,
  description: 150,
  honorsTitle: 100,
} as const;

const VAGUE_WORDS = ["many", "various", "helped with", "assisted with", "numerous", "several things"];

export function flagVagueness(text: string): string[] {
  const lower = text.toLowerCase();
  return VAGUE_WORDS.filter((w) => lower.includes(w));
}

function counter(text: string, limit: number): string {
  const n = text.length;
  return `(${n}/${limit} chars${n > limit ? " — OVER LIMIT" : ""})`;
}

type Entry = {
  type: string;
  title: string;
  date: Date;
  description: string;
  link: string | null;
};

async function commonAppBlock(e: Entry): Promise<string> {
  let position = "";
  let description = "";
  let honorsTitle = "";

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const raw = await backgroundCompletion(COMMON_APP_DRAFT_PROMPT, [
        {
          role: "user",
          content: `Entry — type: ${e.type}; title: ${e.title}; date: ${format(e.date, "MMM yyyy")}; description: ${e.description}`,
        },
      ]);
      position = raw.match(/POSITION:\s*(.+)/)?.[1]?.trim() ?? "";
      description = raw.match(/DESCRIPTION:\s*(.+)/)?.[1]?.trim() ?? "";
      honorsTitle = raw.match(/HONORS_TITLE:\s*(.+)/)?.[1]?.trim() ?? "";
    } catch {
      // fall through to deterministic fallback
    }
  }
  if (!description) {
    position = e.title.slice(0, LIMITS.position);
    description = e.description.slice(0, LIMITS.description);
    honorsTitle = e.title.slice(0, LIMITS.honorsTitle);
  }

  const vague = flagVagueness(`${position} ${description}`);
  const vagueNote = vague.length
    ? `\n> ⚠️ Vague wording to sharpen: ${vague.join(", ")} — replace with numbers and specifics.`
    : "";

  return [
    `- **Position/Leadership**: ${position} ${counter(position, LIMITS.position)}`,
    `- **Activity description**: ${description} ${counter(description, LIMITS.description)}`,
    `- **Honors title**: ${honorsTitle} ${counter(honorsTitle, LIMITS.honorsTitle)}`,
  ].join("\n") + vagueNote;
}

/**
 * §3.5: export the Proof Locker as Markdown — activities-list draft,
 * honors-list draft, arts-supplement package, plus Common App draft mode.
 * Sarvagna edits the drafts herself; the app only counts characters.
 */
export async function exportPortfolioMarkdown(withCommonApp = true): Promise<string> {
  const entries = await db.portfolioEntry.findMany({ orderBy: { date: "desc" } });
  const profile = await db.profile.findUnique({ where: { id: "student" } });

  const byType = (types: string[]) => entries.filter((e) => types.includes(e.type));

  const section = (title: string, items: typeof entries) =>
    items.length
      ? `## ${title}\n\n${items
          .map(
            (e) =>
              `- **${e.title}** — ${format(e.date, "MMM yyyy")}\n  ${e.description}${e.link ? `\n  Link: ${e.link}` : ""}`
          )
          .join("\n")}\n`
      : `## ${title}\n\n_Nothing here yet._\n`;

  const parts: string[] = [
    `# ${profile?.name ?? "Sarvagna"} — Portfolio ("Proof Locker")`,
    `_Exported ${format(new Date(), "d MMMM yyyy")} · everything documented from day one._\n`,
    section("Activities draft (projects & performances)", byType(["project", "performance"])),
    section("Honors draft (awards & publications)", byType(["award", "publication"])),
    section("Arts supplement package (recordings)", byType(["recording"])),
    section("Repertoire log", byType(["repertoire"])),
  ];

  if (withCommonApp && entries.length) {
    const blocks: string[] = ["## Common App draft mode\n"];
    blocks.push(
      "_Character limits are the real ones: Position ≤ 50 · Activity ≤ 150 · Honors ≤ 100. Edit these yourself — the app only counts characters._\n"
    );
    for (const e of entries) {
      blocks.push(`### ${e.title}\n${await commonAppBlock(e)}\n`);
    }
    parts.push(blocks.join("\n"));
  }

  return parts.join("\n");
}
