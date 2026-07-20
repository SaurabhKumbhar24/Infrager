import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { Router, type Response } from "express";
import { requireAuth, signToken, type AuthedRequest, type SessionUser } from "../auth";
import { pool } from "../db";

export const authRouter = Router();

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
}

function sendSession(res: Response, user: SessionUser, status = 200): void {
  res.status(status).json({ token: signToken(user), user });
}

authRouter.post("/signup", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Enter a valid email address." });
    return;
  }
  if (name.length < 1 || name.length > 80) {
    res.status(400).json({ error: "Enter your name." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }

  const existing = await pool.query("SELECT 1 FROM users WHERE email = $1", [email]);
  if (existing.rowCount) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const id = randomUUID();
  await pool.query(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)",
    [id, email, name, bcrypt.hashSync(password, 10), Date.now()]
  );
  sendSession(res, { id, email, name }, 201);
});

authRouter.post("/login", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  const result = await pool.query<UserRow>("SELECT * FROM users WHERE email = $1", [email]);
  const user = result.rows[0];
  // Same message for unknown email and wrong password: no account enumeration.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }
  sendSession(res, { id: user.id, email: user.email, name: user.name });
});

authRouter.get("/me", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
