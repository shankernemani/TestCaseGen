// Live deadline refresh: Claude + web search verifies every stored deadline
// against official sources and proposes relevant additions. Nothing is
// deleted automatically — stale entries are rolled forward or annotated.

import { z } from "zod";
import { prisma } from "./db";
import { anthropic, CHAT_MODEL } from "./anthropic";
import { format } from "date-fns";

// An empty or malformed URL from the model becomes "no url", never a reason
// to reject anything.
const LenientUrl = z.preprocess(
  (v) => {
    if (typeof v !== "string") return undefined;
    const s = v.trim();
    return /^https?:\/\/\S+$/.test(s) ? s.slice(0, 500) : undefined;
  },
  z.string().optional(),
);

const VerifiedSchema = z.object({ id: z.string() });
const UpdateSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  title: z.string().min(1).max(300).optional(),
  url: LenientUrl,
  notes: z.string().max(500).optional(),
});
const AdditionSchema = z.object({
  title: z.string().min(1).max(300),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  url: LenientUrl,
  notes: z.string().max(500).optional(),
  mentorId: z.enum(["priya", "meera", "arjun", "dev", "anaya"]).optional(),
});

export interface RefreshPlan {
  verified: z.infer<typeof VerifiedSchema>[];
  updates: z.infer<typeof UpdateSchema>[];
  additions: z.infer<typeof AdditionSchema>[];
}

/** Parse the model's JSON plan (tolerating fences and surrounding prose).
 * Item-resilient: one malformed entry is dropped, never the whole plan.
 * Returns null only when no JSON object can be parsed at all. */
export function parseRefreshPlan(text: string): RefreshPlan | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/, "")
    .replace(/```\s*$/, "");
  // The model may write prose before/after the JSON — grab the outermost object.
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const collect = <T>(value: unknown, schema: z.ZodType<T>): T[] => {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
      const parsed = schema.safeParse(item);
      return parsed.success ? [parsed.data] : [];
    });
  };
  return {
    verified: collect(obj.verified, VerifiedSchema),
    updates: collect(obj.updates, UpdateSchema),
    additions: collect(obj.additions, AdditionSchema),
  };
}

/** True when a proposed addition duplicates an existing deadline. */
export function isDuplicateDeadline(
  addition: { title: string; url?: string },
  existing: { title: string; url: string | null }[],
): boolean {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);
  // Three leading words: "Math Kangaroo India 2027…" must still match
  // "Math Kangaroo India registration…".
  const addWords = normalize(addition.title).slice(0, 3).join(" ");
  return existing.some((e) => {
    if (addition.url && e.url && addition.url === e.url) return true;
    const exWords = normalize(e.title).slice(0, 3).join(" ");
    return addWords !== "" && exWords === addWords;
  });
}

/** Claude + server-side web search, with pause_turn resumption. */
async function anthropicWebResearch(prompt: string): Promise<string> {
  const client = anthropic();
  const tools = [
    { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: 12 },
  ];
  let messages: { role: "user" | "assistant"; content: unknown }[] = [
    { role: "user", content: prompt },
  ];
  let response = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 4000,
    tools,
    messages: messages as never,
  });
  let guard = 0;
  while (response.stop_reason === "pause_turn" && guard++ < 5) {
    messages = [...messages, { role: "assistant", content: response.content }];
    response = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 4000,
      tools,
      messages: messages as never,
    });
  }
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { text: string }).text)
    .join("\n");
}

const REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
let lastRefreshAt = 0;

export interface RefreshResult {
  checked: number;
  updated: number;
  added: number;
  summary: string;
}

export async function refreshDeadlines(): Promise<RefreshResult> {
  if (Date.now() - lastRefreshAt < REFRESH_COOLDOWN_MS) {
    throw new Error("COOLDOWN");
  }
  lastRefreshAt = Date.now();

  const [profile, allDeadlines] = await Promise.all([
    prisma.studentProfile.findUnique({ where: { id: "sarvagna" } }),
    prisma.deadline.findMany({ orderBy: { date: "asc" } }),
  ]);
  // Priya's entries are admissions-process reminders (e.g. the Grade-11
  // ex-AO research note), not web-verifiable competitions — keep them out
  // of the review entirely.
  const deadlines = allDeadlines.filter((d) => d.mentorId !== "priya");

  const today = format(new Date(), "yyyy-MM-dd");
  const existingList = deadlines
    .map(
      (d) =>
        `- id=${d.id} | ${d.title} | ${format(d.date, "yyyy-MM-dd")} | ${d.url ?? "no url"}`,
    )
    .join("\n");

  const prompt = `You maintain the competition-deadline calendar for Sarvagna, a Grade ${profile?.grade ?? 8} student in India (born ~${profile?.birthYear ?? 2012}). Her profile: Carnatic vocalist, strong in English/writing and social studies, exploring linguistics and music-cognition. Preferred arenas ("swim lanes"): writing competitions, linguistics olympiad (Panini/IOL), junior olympiad routes (HBCSE IOQ/IJSO), music youth competitions (Cleveland Thyagaraja Aradhana, Chennai December season), girls' tech challenges (Technovation), science-communication (Breakthrough Junior), science fairs (IRIS/INSPIRE). India-eligible only.

TODAY: ${today}

CURRENT CALENDAR:
${existingList || "(empty)"}

TASK — use web search to verify, preferring OFFICIAL competition sites (cross-check student communities/aggregators only to discover changes, never as the final source for a date):
1. For EACH current entry: is the title still the competition's real name, is the date the correct current/next deadline, is the age window still right for her? If a cycle has closed, roll the entry forward to the next cycle's confirmed or expected date and say "expected — verify when announced" in notes. If a competition changed name or rules (e.g. category removed), fix the title/notes.
2. Propose up to 6 NEW deadlines she is eligible for in the next ~18 months that fit her swim lanes and are missing from the calendar. Each needs a real date you verified and the official URL.
3. Every date must be a real finding from your searches, never from memory. Notes should be one line: eligibility window + anything time-critical.
4. NEVER set a date in the past. This calendar is forward-looking: when you can only verify a PREVIOUS cycle's date, keep the entry pointed at the NEXT cycle's expected date (previous date + 1 year is a fine estimate) and record the verified previous-cycle date in the notes.

Respond with ONLY this JSON (no fence, no prose):
{
  "verified": [{"id": "<existing id you checked and found fully correct>"}],
  "updates": [{"id": "<existing id>", "date": "YYYY-MM-DD", "title": "...", "url": "...", "notes": "..."}],
  "additions": [{"title": "...", "date": "YYYY-MM-DD", "url": "...", "notes": "...", "mentorId": "arjun"}]
}
EVERY existing id must appear in exactly one of "verified" or "updates" — an entry you could not confirm goes in "updates" with a note saying what you could not confirm. Updates carry only the fields that change (id always). mentorId: arjun for competitions, meera for music, priya for admissions-process dates, dev for writing.`;

  // Anthropic (Claude + web_search) primary; OpenAI (Responses API +
  // web_search tool) fallback — same prompt, same JSON plan contract.
  let text: string;
  let provider = "anthropic";
  try {
    text = await anthropicWebResearch(prompt);
  } catch (err) {
    const { hasOpenAI, openaiWebResearch } = await import("./openai");
    if (!hasOpenAI()) throw err;
    console.warn(
      "[deadline-refresh] Anthropic unavailable, using OpenAI web search:",
      err instanceof Error ? err.message.slice(0, 160) : err,
    );
    provider = "openai";
    text = await openaiWebResearch(prompt);
  }

  console.log(
    `[deadline-refresh] provider=${provider} plan text:\n${text.slice(0, 3000)}`,
  );
  const plan = parseRefreshPlan(text);
  if (!plan) {
    throw new Error("The web check returned an unreadable plan — try again.");
  }

  // Stamp verified entries so she can see when each date was last confirmed.
  for (const v of plan.verified) {
    const existing = deadlines.find((d) => d.id === v.id);
    if (!existing) continue;
    const base = (existing.notes ?? "").replace(/\s*\(web-checked [0-9-]+\)$/, "");
    await prisma.deadline.update({
      where: { id: v.id },
      data: { notes: `${base} (web-checked ${today})`.trim() },
    });
  }

  let updated = 0;
  for (const u of plan.updates) {
    const existing = deadlines.find((d) => d.id === u.id);
    if (!existing) continue;
    // Hard guardrail: the calendar is forward-looking. A model that could
    // only verify last cycle's (past) date must not roll an entry backward.
    if (u.date && u.date < today) {
      console.warn(`[deadline-refresh] rejected past-dated update ${u.id} -> ${u.date}`);
      continue;
    }
    await prisma.deadline.update({
      where: { id: u.id },
      data: {
        ...(u.date ? { date: new Date(`${u.date}T12:00:00+05:30`) } : {}),
        ...(u.title ? { title: u.title } : {}),
        ...(u.url ? { url: u.url } : {}),
        ...(u.notes ? { notes: `${u.notes} (web-checked ${today})` } : {}),
      },
    });
    updated++;
  }

  let added = 0;
  for (const a of plan.additions.slice(0, 8)) {
    if (a.date < today) {
      console.warn(`[deadline-refresh] rejected past-dated addition "${a.title.slice(0, 50)}"`);
      continue;
    }
    if (isDuplicateDeadline(a, deadlines)) continue;
    await prisma.deadline.create({
      data: {
        title: a.title,
        date: new Date(`${a.date}T12:00:00+05:30`),
        url: a.url,
        notes: `${a.notes ?? ""} (web-checked ${today} — confirm on the official site)`.trim(),
        mentorId: a.mentorId ?? "arjun",
      },
    });
    added++;
  }

  return {
    checked: deadlines.length,
    updated,
    added,
    summary: `Checked ${deadlines.length} entries against the web: ${plan.verified.length} confirmed, ${updated} updated, ${added} added.`,
  };
}
