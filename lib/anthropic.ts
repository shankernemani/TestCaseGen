// Server-side Anthropic API access (§1: never expose the key client-side).
// Chat runs on the spec-designated mentor model; background summarization
// (§2.3) runs on the cheaper background model.

import Anthropic from "@anthropic-ai/sdk";

export const CHAT_MODEL =
  process.env.PATHFINDER_CHAT_MODEL ?? "claude-sonnet-4-6";
export const BACKGROUND_MODEL =
  process.env.PATHFINDER_BACKGROUND_MODEL ?? "claude-haiku-4-5";

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.",
      );
    }
    _client = new Anthropic();
  }
  return _client;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

/** One mentor reply. Short replies are a product rule (§2.1 rule 2), so a
 * modest max_tokens is intentional. */
export async function mentorReply(
  system: string,
  turns: ChatTurn[],
): Promise<string> {
  const response = await anthropic().messages.create({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system,
    messages: turns.map((t) => ({ role: t.role, content: t.content })),
  });
  return response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export interface SessionSummary {
  session_summary: string;
  memory_summary: string;
  commitments: string[];
}

/** Background Haiku pass (§2.3): session summary + rolling memory merge +
 * commitment extraction. Returns null if the model output can't be parsed —
 * callers should skip the memory update rather than corrupt it. */
export async function summarizeSession(
  prompt: string,
): Promise<SessionSummary | null> {
  const response = await anthropic().messages.create({
    model: BACKGROUND_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
  try {
    // Tolerate a stray markdown fence despite the instruction not to use one.
    const jsonText = text.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(jsonText);
    if (
      typeof parsed.session_summary === "string" &&
      typeof parsed.memory_summary === "string" &&
      Array.isArray(parsed.commitments)
    ) {
      return {
        session_summary: parsed.session_summary,
        memory_summary: parsed.memory_summary,
        commitments: parsed.commitments.filter(
          (c: unknown): c is string => typeof c === "string" && c.trim() !== "",
        ),
      };
    }
    return null;
  } catch {
    return null;
  }
}
