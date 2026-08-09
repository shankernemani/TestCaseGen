// Provider-agnostic mentor reply stream: Anthropic primary, OpenAI fallback.
// A source's first network round-trip happens before it is returned, so
// auth/credit failures surface as thrown errors — never as a broken stream.

import { mentorReplyStream, type ChatTurn } from "./anthropic";
import { hasOpenAI, openaiMentorSource, type MentorSource } from "./openai";

export type { MentorSource };

function textOfEvent(event: unknown): string | null {
  const e = event as { type?: string; delta?: { type?: string; text?: string } };
  if (
    e.type === "content_block_delta" &&
    e.delta?.type === "text_delta" &&
    typeof e.delta.text === "string"
  ) {
    return e.delta.text;
  }
  return null;
}

async function anthropicMentorSource(
  system: string,
  turns: ChatTurn[],
): Promise<MentorSource> {
  const stream = mentorReplyStream(system, turns);
  const iterator = stream[Symbol.asyncIterator]();
  const first = await iterator.next(); // throws on auth/credit failures

  async function* deltas() {
    if (!first.done) {
      const t = textOfEvent(first.value);
      if (t) yield t;
    }
    for (;;) {
      const result = await iterator.next();
      if (result.done) break;
      const t = textOfEvent(result.value);
      if (t) yield t;
    }
  }
  return {
    provider: "anthropic",
    deltas: deltas(),
    final: async () => {
      const message = await stream.finalMessage();
      const text = message.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { text: string }).text)
        .join("\n")
        .trim();
      return { text, truncated: message.stop_reason === "max_tokens" };
    },
  };
}

export async function getMentorSource(
  system: string,
  turns: ChatTurn[],
): Promise<MentorSource> {
  try {
    return await anthropicMentorSource(system, turns);
  } catch (err) {
    if (!hasOpenAI()) throw err;
    console.warn(
      "[mentor] Anthropic unavailable, using OpenAI fallback:",
      err instanceof Error ? err.message.slice(0, 200) : err,
    );
    return openaiMentorSource(system, turns);
  }
}
