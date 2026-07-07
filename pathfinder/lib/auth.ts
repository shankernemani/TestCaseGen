import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Simple two-profile local auth (§1): Sarvagna / Parent, PIN each.
 * Session = HMAC-signed httpOnly cookie "role.expiresAtMs.signature".
 */

const COOKIE = "pathfinder_session";
const SESSION_DAYS = 30;

function secret(): string {
  return process.env.SESSION_SECRET || "pathfinder-dev-secret";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export type SessionRole = "student" | "parent";

export function createSessionValue(role: SessionRole): string {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${role}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSessionValue(value: string | undefined): SessionRole | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [role, expires, sig] = parts;
  const payload = `${role}.${expires}`;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  if (Number(expires) < Date.now()) return null;
  if (role !== "student" && role !== "parent") return null;
  return role;
}

export function getSessionRole(): SessionRole | null {
  return parseSessionValue(cookies().get(COOKIE)?.value);
}

export function sessionCookie(role: SessionRole) {
  return {
    name: COOKIE,
    value: createSessionValue(role),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  };
}

export const SESSION_COOKIE_NAME = COOKIE;
