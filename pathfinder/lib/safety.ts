/**
 * §7 AI guardrails — implemented as code, not just prompts.
 * Belt-and-braces beyond the prompt rules.
 */

// Ghostwriting requests: short-circuit with the coaching-decline template
// before any API call is made.
const GHOSTWRITE_PATTERNS: RegExp[] = [
  /write\s+(my|the|an?)\s+(essay|entry|submission|article|story|poem|speech|application|personal\s+statement)\s*(for\s+me)?/i,
  /write\s+(it|this|that|one)\s+for\s+me/i,
  /(can|could|will|would)\s+you\s+write\s+(my|me|the)\b/i,
  /do\s+my\s+(essay|homework|entry|assignment|project)/i,
  /(finish|complete)\s+(my|the)\s+(essay|draft|entry|assignment)\s+for\s+me/i,
];

export function isGhostwriteRequest(message: string): boolean {
  return GHOSTWRITE_PATTERNS.some((p) => p.test(message));
}

// Sensitive-topic list: kind redirect + "Talk to Amma/Appa?" card.
// Never stored in mentor memory summaries.
const SENSITIVE_PATTERNS: RegExp[] = [
  /suicid|kill(ing)?\s+myself|end(ing)?\s+my\s+life|self[-\s]?harm|hurt(ing)?\s+myself|cut(ting)?\s+myself/i,
  /\babus(e|ed|ing)\b|molest|inappropriate\s+touch/i,
  /want\s+to\s+die|don'?t\s+want\s+to\s+(live|be\s+alive)/i,
  /(feel|feeling|felt)\s+(really\s+)?(hopeless|worthless|empty\s+inside)/i,
  /eating\s+disorder|starv(e|ing)\s+myself|anorexi|bulimi/i,
  /\bdepress(ed|ion)\b|panic\s+attack|anxiety\s+attack/i,
  /(boyfriend|girlfriend|dating)\s+(problem|trouble|secret)/i,
  /bull(y|ied|ying)\s+me|threatens?\s+me/i,
];

export function isSensitiveTopic(message: string): boolean {
  return SENSITIVE_PATTERNS.some((p) => p.test(message));
}

/** §7 output check: replies beyond 250 words trigger pressure next turn. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const REPLY_WORD_LIMIT = 250;

export function exceedsWordLimit(text: string): boolean {
  return countWords(text) > REPLY_WORD_LIMIT;
}
