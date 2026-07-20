import dotenv from "dotenv";

dotenv.config();

// `||` (not ??) so an empty string in .env falls back to the dev default.
export const config = {
  port: Number(process.env.PORT || 4000),
  /** e.g. postgres://user:pass@host:5432/infrager */
  databaseUrl:
    process.env.DATABASE_URL || "postgres://infrager:infrager@localhost:5433/infrager",
  authSecret: process.env.AUTH_SECRET || "infrager-dev-secret-change-me",
  /** Comma-separated list of allowed browser origins. */
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  sessionDays: 7,
};
