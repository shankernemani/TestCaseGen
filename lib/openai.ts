// OpenAI fallback provider. Anthropic stays primary (the spec pins it and the
// personas are tuned for Claude); these paths run only when the Anthropic
// call fails — e.g. exhausted credits — so the mentors never go dark.

import OpenAI from "openai";
import type { ChatTurn } from "./anthropic";

// Latest/cheapest current tiers (verified against this key's /v1/models):
// gpt-5.4-mini for chat + web research, gpt-5.4-nano for background work.
// GPT-5-family models are reasoning models — they take max_completion_tokens
// and reasoning_effort, and need headroom above the visible-reply budget.
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-5.4-mini";
const OPENAI_BACKGROUND_MODEL =
  process.env.OPENAI_BACKGROUND_MODEL ?? "gpt-5.4-nano";
const OPENAI_RESEARCH_MODEL =
  process.env.OPENAI_RESEARCH_MODEL ?? "gpt-5.4-mini";

let _client: OpenAI | null = null;

export function hasOpenAI(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function openai(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set");
    }
    _client = new OpenAI();
  }
  return _client;
}

export interface MentorSource {
  provider: "anthropic" | "openai";
  deltas: AsyncGenerator<string>;
  /** Call only after `deltas` is fully consumed. */
  final: () => Promise<{ text: string; truncated: boolean }>;
}

/** Streaming mentor reply via OpenAI. The awaited create() validates auth
 * before we commit to a streamed response. */
export async function openaiMentorSource(
  system: string,
  turns: ChatTurn[],
): Promise<MentorSource> {
  const stream = await openai().chat.completions.create({
    model: OPENAI_CHAT_MODEL,
    stream: true,
    // Reasoning tokens draw from the same budget as the visible reply.
    max_completion_tokens: 2048,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: system },
      ...turns.map((t) => ({ role: t.role, content: t.content })),
    ],
  });

  let acc = "";
  let truncated = false;
  async function* deltas() {
    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      if (choice?.finish_reason === "length") truncated = true;
      const text = choice?.delta?.content ?? "";
      if (text) {
        acc += text;
        yield text;
      }
    }
  }
  return {
    provider: "openai",
    deltas: deltas(),
    final: async () => ({ text: acc.trim(), truncated }),
  };
}

/** Background summary text via OpenAI (same prompt contract as Haiku). */
export async function openaiSummarize(prompt: string): Promise<string> {
  const response = await openai().chat.completions.create({
    model: OPENAI_BACKGROUND_MODEL,
    max_completion_tokens: 3000,
    reasoning_effort: "low",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}

/** Web-search-backed research via the Responses API (tool use enabled).
 * Used by the deadline refresh when Anthropic is unavailable. */
export async function openaiWebResearch(prompt: string): Promise<string> {
  const response = await openai().responses.create({
    model: OPENAI_RESEARCH_MODEL,
    tools: [{ type: "web_search" }],
    input: prompt,
  });
  // output_text is the SDK convenience aggregate; fall back to manual walk.
  const direct = (response as { output_text?: string }).output_text;
  if (direct && direct.trim()) return direct.trim();
  const output = (response as { output?: unknown[] }).output ?? [];
  return output
    .flatMap((o) => {
      const item = o as { type?: string; content?: { type?: string; text?: string }[] };
      if (item.type !== "message") return [];
      return (item.content ?? [])
        .filter((c) => c.type === "output_text" && typeof c.text === "string")
        .map((c) => c.text as string);
    })
    .join("\n")
    .trim();
}
