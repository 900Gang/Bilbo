import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export const COOKIE_NAME = "token";

export type AuthedRequest = Request & { userId: string };

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET!, { expiresIn: "7d" });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
    (req as AuthedRequest).userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
