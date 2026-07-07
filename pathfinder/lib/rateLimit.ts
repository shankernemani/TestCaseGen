import { startOfDay } from "date-fns";
import { db } from "./db";

/** §3.2: 60 messages/day across mentors — cost control + healthy usage. */
export const DAILY_MESSAGE_LIMIT = 60;

export const REST_MESSAGE =
  "Your mentors need rest too 🌙 — you've had a full day of conversations. They'll be fresh and ready tomorrow morning.";

export async function isOverDailyLimit(): Promise<boolean> {
  const count = await db.message.count({
    where: { role: "user", createdAt: { gte: startOfDay(new Date()) } },
  });
  return count >= DAILY_MESSAGE_LIMIT;
}
