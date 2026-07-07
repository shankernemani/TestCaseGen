import { describe, expect, it } from "vitest";
import {
  countWords,
  exceedsWordLimit,
  isGhostwriteRequest,
  isSensitiveTopic,
} from "./safety";

describe("isGhostwriteRequest (§7)", () => {
  it.each([
    "write my essay for me",
    "Can you write my QCEC entry?",
    "please write the essay for the competition",
    "could you write me a personal statement",
    "do my homework",
    "finish my draft for me",
  ])("catches: %s", (msg) => {
    expect(isGhostwriteRequest(msg)).toBe(true);
  });

  it.each([
    "how do I structure my essay?",
    "give me feedback on my draft",
    "what makes a good opening paragraph?",
    "I wrote my essay yesterday, can you review it?",
  ])("allows coaching request: %s", (msg) => {
    expect(isGhostwriteRequest(msg)).toBe(false);
  });
});

describe("isSensitiveTopic (§7)", () => {
  it.each([
    "sometimes I think about hurting myself",
    "I feel hopeless about everything",
    "a boy at school keeps bullying me",
    "I don't want to be alive",
  ])("flags: %s", (msg) => {
    expect(isSensitiveTopic(msg)).toBe(true);
  });

  it.each([
    "I'm nervous about the competition",
    "my essay deadline is stressing me a bit",
    "I lost the olympiad and I'm sad",
  ])("does not over-flag ordinary feelings: %s", (msg) => {
    expect(isSensitiveTopic(msg)).toBe(false);
  });
});

describe("word limit (§7 output check)", () => {
  it("counts words", () => {
    expect(countWords("one two  three\nfour")).toBe(4);
  });
  it("flags replies over 250 words", () => {
    expect(exceedsWordLimit("word ".repeat(251))).toBe(true);
    expect(exceedsWordLimit("word ".repeat(250))).toBe(false);
  });
});
