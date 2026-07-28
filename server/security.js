import { createHash, randomBytes } from "node:crypto";

export const SESSION_COOKIE = "imana_session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
export const createOpaqueToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");
export const normalizeEmail = (value) => String(value).trim().toLowerCase();
export const sessionCookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DURATION_MS,
});
