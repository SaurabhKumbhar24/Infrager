import type { Diagram } from "../ir/schema";

/** Shapes shared between the web app and the Infrager API (apps/api). */

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/**
 * What the API persists per project: the pure IR plus the canvas layout
 * (node positions). Layout is deliberately OUTSIDE the Diagram so the IR
 * stays canvas-agnostic; the editor recombines them on load.
 */
export interface ProjectDocument {
  diagram: Diagram;
  layout: Record<string, { x: number; y: number }>;
}

export interface ProjectSummary {
  id: string;
  name: string;
  nodeCount: number;
  layout: Record<string, { x: number; y: number }>;
  nodeTypes: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ProjectFull {
  id: string;
  name: string;
  document: ProjectDocument;
  createdAt: number;
  updatedAt: number;
}
