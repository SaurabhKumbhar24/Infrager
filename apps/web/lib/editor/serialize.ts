import type { Edge, Node } from "@xyflow/react";
import type { Diagram, IRNode, RelationshipType } from "../ir/schema";
import { inferRelationships } from "../ir/schema";
import type { ProjectDocument } from "../types/project";

/**
 * Bridge between React Flow state and the IR. React Flow nodes carry the full
 * IR node in `data.ir`; edges carry the relationship in `data.relationship`.
 * Nothing outside this module (and the node/inspector components) touches
 * React Flow types, so the canvas library stays swappable.
 */

export type CanvasNodeData = { ir: IRNode } & Record<string, unknown>;
export type CanvasEdgeData = { relationship: RelationshipType } & Record<string, unknown>;
export type CanvasNode = Node<CanvasNodeData, "resource">;
export type CanvasEdge = Edge<CanvasEdgeData>;

/** Canvas state -> pure IR document (what codegen, lint, and the API see). */
export function toDocument(nodes: CanvasNode[], edges: CanvasEdge[]): ProjectDocument {
  const diagram: Diagram = {
    version: 1,
    nodes: nodes.map((n) => n.data.ir),
    edges: edges.flatMap((e) =>
      e.data
        ? [{ id: e.id, relationship: e.data.relationship, sourceId: e.source, targetId: e.target }]
        : []
    ),
  };
  const layout: ProjectDocument["layout"] = {};
  for (const n of nodes) layout[n.id] = { x: n.position.x, y: n.position.y };
  return { diagram, layout };
}

/** Stored document -> canvas state. */
export function fromDocument(document: ProjectDocument): {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
} {
  const nodes: CanvasNode[] = document.diagram.nodes.map((ir, i) => ({
    id: ir.id,
    type: "resource",
    position: document.layout[ir.id] ?? { x: 80 + (i % 4) * 240, y: 80 + Math.floor(i / 4) * 160 },
    data: { ir },
  }));
  const edges: CanvasEdge[] = document.diagram.edges.map((e) => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    label: e.relationship,
    data: { relationship: e.relationship },
  }));
  return { nodes, edges };
}

/**
 * Decide what a user-drawn connection means. The IR convention is
 * source-depends-on-target; users draw in either direction, so if the drawn
 * direction is invalid but the reverse is valid, we flip it silently. When no
 * typed relationship applies (generic nodes, or unrelated rich pairs), the
 * connection becomes a plain `depends_on` in the drawn direction — any
 * resource may depend on any other.
 */
export function resolveConnection(
  sourceIr: IRNode,
  targetIr: IRNode
): { sourceId: string; targetId: string; relationship: RelationshipType } | null {
  if (sourceIr.id === targetIr.id) return null;
  const forward = inferRelationships(sourceIr.type, targetIr.type);
  if (forward.length > 0) {
    return { sourceId: sourceIr.id, targetId: targetIr.id, relationship: forward[0] };
  }
  const reverse = inferRelationships(targetIr.type, sourceIr.type);
  if (reverse.length > 0) {
    return { sourceId: targetIr.id, targetId: sourceIr.id, relationship: reverse[0] };
  }
  return { sourceId: sourceIr.id, targetId: targetIr.id, relationship: "depends_on" };
}
