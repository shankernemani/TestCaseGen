// Smoke test (§1): login → open a mentor chat → send a message → get a reply.
// The chat step needs a real ANTHROPIC_API_KEY; without one it verifies the
// graceful error path instead of the reply.
import { expect, test } from "@playwright/test";

const STUDENT_PIN = process.env.SEED_STUDENT_PIN ?? "1213";
const HAS_KEY = Boolean(process.env.ANTHROPIC_API_KEY);

test("login → mentor chat → send message", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: /Sarvagna/ }).click();
  await page.getByPlaceholder("Enter your PIN").fill(STUDENT_PIN);
  await page.getByRole("button", { name: "Enter" }).click();

  await expect(page.getByText(/Good (morning|afternoon|evening), Sarvagna/)).toBeVisible();
  await expect(page.getByText("Arohanam")).toBeVisible();

  await page.getByRole("link", { name: "Mentors" }).click();
  await page.getByRole("link", { name: /Anaya/ }).click();

  const box = page.getByPlaceholder("Message Anaya…");
  await box.fill("Hi Anaya! Just saying hello.");
  await page.getByRole("button", { name: "Send" }).click();

  await expect(page.getByText("Hi Anaya! Just saying hello.")).toBeVisible();

  if (HAS_KEY) {
    // A real assistant reply bubble appears (Anaya stops "thinking").
    await expect(page.getByText(/Anaya is thinking…/)).toBeHidden({
      timeout: 60_000,
    });
    const bubbles = page.locator("div.rounded-tl-sm");
    await expect(bubbles.last()).not.toBeEmpty();
  } else {
    await expect(
      page.getByText(/ANTHROPIC_API_KEY|couldn't reply/),
    ).toBeVisible({ timeout: 30_000 });
  }
});
