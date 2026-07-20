import {
  type Diagram,
  type IRNode,
  type RelationshipType,
  type ResourceType,
  referencedNodes,
  referencingNodes,
} from "../ir/schema";

/** IR resource type -> Terraform resource type of the PRIMARY emitted resource. */
export const TF_RESOURCE_TYPE: Record<ResourceType, string> = {
  vpc: "aws_vpc",
  subnet: "aws_subnet",
  security_group: "aws_security_group",
  ec2_instance: "aws_instance",
  alb: "aws_lb",
  rds_instance: "aws_db_instance",
  s3_bucket: "aws_s3_bucket",
  iam_role: "aws_iam_role",
};

function slugify(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
  if (!slug) return fallback;
  return /^[0-9]/.test(slug) ? `r_${slug}` : slug;
}

/**
 * Shared state for one generation pass: stable, de-duplicated Terraform labels
 * per node, plus reference helpers so emitters never build address strings by
 * hand.
 */
export class CodegenContext {
  private readonly labels = new Map<string, string>();

  constructor(readonly diagram: Diagram) {
    const used = new Set<string>();
    for (const node of diagram.nodes) {
      const base = slugify(node.name, node.type);
      let label = base;
      for (let i = 2; used.has(label); i++) label = `${base}_${i}`;
      used.add(label);
      this.labels.set(node.id, label);
    }
  }

  labelOf(nodeId: string): string {
    return this.labels.get(nodeId) ?? nodeId;
  }

  /** Terraform resource type of a node's primary emitted resource. */
  tfTypeOf(node: IRNode): string {
    return node.type === "generic" ? node.properties.tfType : TF_RESOURCE_TYPE[node.type];
  }

  /** Terraform address attribute reference, e.g. aws_vpc.main.id */
  ref(nodeId: string, attr: string): string {
    const node = this.diagram.nodes.find((n) => n.id === nodeId);
    const tfType = node ? this.tfTypeOf(node) : "unknown";
    return `${tfType}.${this.labelOf(nodeId)}.${attr}`;
  }

  /** Bare Terraform address (no attribute), for depends_on lists. */
  address(nodeId: string): string {
    const node = this.diagram.nodes.find((n) => n.id === nodeId);
    const tfType = node ? this.tfTypeOf(node) : "unknown";
    return `${tfType}.${this.labelOf(nodeId)}`;
  }

  /** First node `nodeId` references via `rel`, if any. */
  related(nodeId: string, rel: RelationshipType): IRNode | undefined {
    return referencedNodes(this.diagram, nodeId, rel)[0];
  }

  /** All nodes `nodeId` references via `rel`. */
  relatedAll(nodeId: string, rel: RelationshipType): IRNode[] {
    return referencedNodes(this.diagram, nodeId, rel);
  }

  /** All nodes that reference `nodeId` via `rel`. */
  referencedBy(nodeId: string, rel: RelationshipType): IRNode[] {
    return referencingNodes(this.diagram, nodeId, rel);
  }

  /**
   * Reference to the first node related via `rel`, or an explicit TODO
   * placeholder when the user has not drawn the connection. The generated
   * file stays parseable and the gap is impossible to miss (lint also flags
   * missing associations on the canvas).
   */
  refOrTodo(nodeId: string, rel: RelationshipType, attr: string, hint: string): string {
    const target = this.related(nodeId, rel);
    if (target) return this.ref(target.id, attr);
    return `"" # INFRAGER TODO: ${hint}`;
  }

  /** References to all nodes related via `rel` (e.g. security group id lists). */
  refsAll(nodeId: string, rel: RelationshipType, attr: string): string[] {
    return this.relatedAll(nodeId, rel).map((n) => this.ref(n.id, attr));
  }
}
