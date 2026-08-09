// OpenAI fallback provider. Anthropic stays primary (the spec pins it and the
// personas are tuned for Claude); these paths run only when the Anthropic
// call fails — e.g. exhausted credits — so the mentors never go dark.

import OpenAI from "openai";
import type { ChatTurn } from "./anthropic";

const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL ?? "gpt-4o";
const OPENAI_BACKGROUND_MODEL =
  process.env.OPENAI_BACKGROUND_MODEL ?? "gpt-4o-mini";

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
    max_tokens: 1024,
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
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content?.trim() ?? "";
}
