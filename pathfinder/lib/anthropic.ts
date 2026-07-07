import Anthropic from "@anthropic-ai/sdk";
import { db } from "./db";

/**
 * §4: central SDK wrapper — retries (2, exponential), 30s timeout,
 * token logging to the Usage table, model selection.
 * All AI calls are server-side; the key never reaches the client.
 */

export const MODELS = {
  chat: process.env.CHAT_MODEL || "claude-sonnet-4-6",
  background: process.env.BACKGROUND_MODEL || "claude-haiku-4-5",
} as const;

let _client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env — mentors need it to reply."
    );
  }
  if (!_client) {
    _client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      maxRetries: 2, // exponential backoff built into the SDK
      timeout: 30_000,
    });
  }
  return _client;
}

export async function logUsage(model: string, inTok: number, outTok: number) {
  try {
    await db.usage.create({ data: { model, inTok, outTok } });
  } catch {
    // usage logging must never break the product
  }
}

export type ChatMessage = { role: "user" | "assistant"; content: string };

/** Non-streaming completion for background tasks (summaries, tagging, briefs). */
export async function backgroundCompletion(
  system: string,
  messages: ChatMessage[],
  maxTokens = 700
): Promise<string> {
  const client = anthropic();
  const res = await client.messages.create({
    model: MODELS.background,
    max_tokens: maxTokens,
    system,
    messages,
  });
  await logUsage(MODELS.background, res.usage.input_tokens, res.usage.output_tokens);
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

/** Streaming mentor chat (Sonnet). Returns the SDK stream. */
export function mentorStream(system: string, messages: ChatMessage[]) {
  const client = anthropic();
  return client.messages.stream({
    model: MODELS.chat,
    max_tokens: 1024,
    system,
    messages,
  });
}
