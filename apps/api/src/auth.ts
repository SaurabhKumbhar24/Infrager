import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Stateless Bearer-token auth: no cookies, no server-side session store. */
export function signToken(user: SessionUser): string {
  return jwt.sign({ email: user.email, name: user.name }, config.authSecret, {
    subject: user.id,
    expiresIn: `${config.sessionDays}d`,
  });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const payload = jwt.verify(token, config.authSecret) as jwt.JwtPayload;
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: typeof payload.email === "string" ? payload.email : "",
      name: typeof payload.name === "string" ? payload.name : "",
    };
  } catch {
    return null;
  }
}

export interface AuthedRequest extends Request {
  user?: SessionUser;
}

/** Express middleware: requires `Authorization: Bearer <jwt>`. */
export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const user = token ? verifyToken(token) : null;
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.user = user;
  next();
}
