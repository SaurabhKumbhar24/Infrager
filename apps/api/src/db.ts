import { Pool } from "pg";
import { config } from "./config";

/**
 * PostgreSQL data layer. `document` is JSONB holding { diagram, layout } —
 * the IR plus canvas positions, exactly what the frontend serializes.
 * Timestamps are epoch milliseconds (BIGINT) to match the web app's Date
 * handling.
 */
export const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : undefined,
});

export async function migrate(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id            UUID PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    BIGINT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id         UUID PRIMARY KEY,
      user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT NOT NULL,
      document   JSONB NOT NULL,
      created_at BIGINT NOT NULL,
      updated_at BIGINT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id, updated_at DESC);
  `);
}
