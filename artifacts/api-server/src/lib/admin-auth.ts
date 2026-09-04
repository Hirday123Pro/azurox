import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { db, adminTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, RequestHandler } from "express";

const SESSION_COOKIE = "azurox_admin_session";
const sessions = new Set<string>();

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export async function getAdmin() {
  const [admin] = await db.select().from(adminTable).limit(1);
  return admin;
}

function hashPassword(password: string, salt: string) {
  return scryptSync(password, salt, 64).toString("hex");
}

export function passwordMatches(password: string, hash: string, salt: string) {
  const expected = Buffer.from(hash, "hex");
  const actual = Buffer.from(hashPassword(password, salt), "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function startSession(res: Response) {
  const token = randomBytes(32).toString("hex");
  sessions.add(token);
  res.cookie(SESSION_COOKIE, token, cookieOptions);
}

export function endSession(req: Request, res: Response) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (typeof token === "string") sessions.delete(token);
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "lax", path: "/" });
}

export function isAuthenticated(req: Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  return typeof token === "string" && sessions.has(token);
}

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
};

export function createPasswordRecord(password: string) {
  const salt = randomBytes(16).toString("hex");
  return { passwordHash: hashPassword(password, salt), passwordSalt: salt };
}

export function clearSessions() {
  sessions.clear();
}

export { SESSION_COOKIE };