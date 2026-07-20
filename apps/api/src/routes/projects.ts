import { randomUUID } from "node:crypto";
import { Router } from "express";
import { requireAuth, type AuthedRequest } from "../auth";
import { pool } from "../db";

export const projectsRouter = Router();
projectsRouter.use(requireAuth);

/**
 * document = { diagram: <IR>, layout: {nodeId: {x,y}} }. The API treats it as
 * an opaque-but-shaped JSON blob: shallow shape validation + size cap, no IR
 * semantics (those live in the web app's lib/ir).
 */
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

interface DocumentShape {
  diagram: { version: number; nodes: unknown[]; edges: unknown[] };
  layout: Record<string, { x: number; y: number }>;
}

function parseDocument(body: unknown): DocumentShape | null {
  if (!body || typeof body !== "object") return null;
  const doc = body as Partial<DocumentShape>;
  if (!doc.diagram || !Array.isArray(doc.diagram.nodes) || !Array.isArray(doc.diagram.edges)) {
    return null;
  }
  if (JSON.stringify(doc).length > MAX_DOCUMENT_BYTES) return null;
  return { diagram: doc.diagram, layout: doc.layout ?? {} };
}

interface ProjectRow {
  id: string;
  name: string;
  document: DocumentShape;
  created_at: string;
  updated_at: string;
}

function toSummary(row: ProjectRow) {
  const nodes = row.document.diagram.nodes as { type?: string }[];
  return {
    id: row.id,
    name: row.name,
    nodeCount: nodes.length,
    layout: row.document.layout,
    nodeTypes: nodes.map((n) => n.type ?? "unknown"),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

function toFull(row: ProjectRow) {
  return {
    id: row.id,
    name: row.name,
    document: row.document,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

projectsRouter.get("/", async (req: AuthedRequest, res) => {
  const result = await pool.query<ProjectRow>(
    "SELECT id, name, document, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC",
    [req.user!.id]
  );
  res.json({ projects: result.rows.map(toSummary) });
});

projectsRouter.post("/", async (req: AuthedRequest, res) => {
  const name =
    (typeof req.body?.name === "string" ? req.body.name.trim() : "") || "Untitled architecture";
  if (name.length > 120) {
    res.status(400).json({ error: "Project name is too long." });
    return;
  }
  const id = randomUUID();
  const now = Date.now();
  const document: DocumentShape = {
    diagram: { version: 1, nodes: [], edges: [] },
    layout: {},
  };
  await pool.query(
    "INSERT INTO projects (id, user_id, name, document, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6)",
    [id, req.user!.id, name, JSON.stringify(document), now, now]
  );
  res.status(201).json({ project: { id, name, document, createdAt: now, updatedAt: now } });
});

projectsRouter.get("/:id", async (req: AuthedRequest, res) => {
  const result = await pool.query<ProjectRow>(
    "SELECT id, name, document, created_at, updated_at FROM projects WHERE id = $1 AND user_id = $2",
    [req.params.id, req.user!.id]
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ project: toFull(result.rows[0]) });
});

projectsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const sets: string[] = [];
  const values: unknown[] = [];

  if (typeof req.body?.name === "string" && req.body.name.trim()) {
    values.push(req.body.name.trim().slice(0, 120));
    sets.push(`name = $${values.length}`);
  }
  if (req.body?.document !== undefined) {
    const document = parseDocument(req.body.document);
    if (!document) {
      res.status(400).json({ error: "Malformed or oversized document." });
      return;
    }
    values.push(JSON.stringify(document));
    sets.push(`document = $${values.length}`);
  }
  if (sets.length === 0) {
    res.status(400).json({ error: "Nothing to update." });
    return;
  }

  values.push(Date.now());
  sets.push(`updated_at = $${values.length}`);
  values.push(req.params.id, req.user!.id);

  const result = await pool.query<ProjectRow>(
    `UPDATE projects SET ${sets.join(", ")}
     WHERE id = $${values.length - 1} AND user_id = $${values.length}
     RETURNING id, name, document, created_at, updated_at`,
    values
  );
  if (!result.rows[0]) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ project: toFull(result.rows[0]) });
});

projectsRouter.delete("/:id", async (req: AuthedRequest, res) => {
  const result = await pool.query("DELETE FROM projects WHERE id = $1 AND user_id = $2", [
    req.params.id,
    req.user!.id,
  ]);
  if (result.rowCount === 0) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ ok: true });
});
