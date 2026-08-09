// Smoke test (§1): login → open a mentor chat → send a message → get a reply.
// The chat step needs a real ANTHROPIC_API_KEY; without one it verifies the
// graceful error path instead of the reply.
import { expect, test } from "@playwright/test";
import fs from "fs";

const STUDENT_PIN = process.env.SEED_STUDENT_PIN ?? "1213";

// The server reads the key from .env (which this process doesn't load), so
// check both places — and treat the .env.example placeholder as "no key".
function hasApiKey(): boolean {
  if (process.env.ANTHROPIC_API_KEY) return true;
  try {
    const match = fs
      .readFileSync(".env", "utf8")
      .match(/^ANTHROPIC_API_KEY=(.+)$/m);
    const value = match?.[1]?.trim() ?? "";
    return value !== "" && value !== "sk-ant-...";
  } catch {
    return false;
  }
}
const HAS_KEY = hasApiKey();

test("login → mentor chat → send message", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sarvagna/ }).click();
  await page.getByPlaceholder("Enter your PIN").fill(STUDENT_PIN);
  await page.getByRole("button", { name: "Enter" }).click();

  await expect(page.getByText(/Good (morning|afternoon|evening), Sarvagna/)).toBeVisible();
  await expect(page.getByText("Arohanam")).toBeVisible();

  await page.getByRole("link", { name: "Mentors" }).click();
  await page.getByRole("link", { name: /Anaya/ }).click();

  // Unique per run: messages persist in the DB, so a fixed string would
  // match bubbles left over from earlier test runs.
  const message = `Hi Anaya! Smoke test ${Date.now()}`;
  const box = page.getByPlaceholder("Message Anaya…");
  await box.fill(message);
  await page.getByRole("button", { name: "Send" }).click();

  if (HAS_KEY) {
    await expect(page.getByText(/Anaya is thinking…/)).toBeHidden({
      timeout: 60_000,
    });
    // A key can exist with an exhausted credit balance; both a streamed
    // reply and a clean credit error are correct behavior here.
    const creditError = page.getByText(/credits are exhausted|couldn't reply/);
    if (await creditError.isVisible().catch(() => false)) {
      await expect(box).toHaveValue(message); // rollback path restored her text
    } else {
      await expect(page.getByText(message)).toBeVisible();
      const bubbles = page.locator("div.rounded-tl-sm");
      await expect(bubbles.last()).not.toBeEmpty();
    }
  } else {
    // Graceful error path: the server 502s, the client shows the error and
    // rolls the message back into the composer for retry.
    await expect(
      page.getByText(/ANTHROPIC_API_KEY|couldn't reply/),
    ).toBeVisible({ timeout: 30_000 });
    await expect(box).toHaveValue(message);
  }
});
