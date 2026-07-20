import {
  type Diagram,
  type IRNode,
  type NodeOfType,
  type ResourceType,
  nodesOfType,
  providerOf,
} from "../ir/schema";
import { CodegenContext } from "./context";
import { rawList } from "./hcl";
import { emitAlb } from "./emitters/alb";
import { emitEc2Instance } from "./emitters/ec2Instance";
import { emitGeneric } from "./emitters/generic";
import { emitIamRole } from "./emitters/iamRole";
import { emitRdsInstance } from "./emitters/rdsInstance";
import { emitS3Bucket } from "./emitters/s3Bucket";
import { emitSecurityGroup } from "./emitters/securityGroup";
import { emitSubnet } from "./emitters/subnet";
import { emitVpc } from "./emitters/vpc";

export type Emitter<T extends ResourceType | "generic" = ResourceType | "generic"> = (
  node: NodeOfType<T>,
  ctx: CodegenContext
) => string[];

/**
 * Template-per-resource-type registry. Adding a rich resource type = add its
 * IR node type, add an emitter file, register it here. Catalog services all
 * flow through the `generic` emitter.
 */
const EMITTERS: { [T in ResourceType | "generic"]: Emitter<T> } = {
  vpc: emitVpc,
  subnet: emitSubnet,
  security_group: emitSecurityGroup,
  ec2_instance: emitEc2Instance,
  alb: emitAlb,
  rds_instance: emitRdsInstance,
  s3_bucket: emitS3Bucket,
  iam_role: emitIamRole,
  generic: emitGeneric,
};

/**
 * Tie-break for nodes with no dependency ordering between them, so output is
 * stable and reads top-down (network -> identity -> compute -> data).
 */
const TYPE_PRIORITY: Record<ResourceType | "generic", number> = {
  vpc: 0,
  subnet: 1,
  security_group: 2,
  iam_role: 3,
  s3_bucket: 4,
  ec2_instance: 5,
  rds_instance: 6,
  alb: 7,
  generic: 8,
};

/**
 * Kahn topological sort over IR edges. Edge direction is source-depends-on-
 * target (see schema.ts), so a node is emittable once everything it references
 * has been emitted. Ready nodes are picked by TYPE_PRIORITY then name for
 * deterministic output. RELATIONSHIP_RULES cannot express a cycle today, but
 * if one ever appears the remaining nodes are appended rather than dropped.
 */
export function orderNodes(diagram: Diagram): IRNode[] {
  const pendingDeps = new Map<string, Set<string>>();
  for (const node of diagram.nodes) pendingDeps.set(node.id, new Set());
  for (const edge of diagram.edges) {
    if (pendingDeps.has(edge.sourceId) && pendingDeps.has(edge.targetId)) {
      pendingDeps.get(edge.sourceId)!.add(edge.targetId);
    }
  }

  const byPriority = (a: IRNode, b: IRNode) =>
    TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type] || a.name.localeCompare(b.name);

  const ordered: IRNode[] = [];
  const remaining = new Set(diagram.nodes.map((n) => n.id));
  while (remaining.size > 0) {
    const ready = diagram.nodes
      .filter((n) => remaining.has(n.id) && pendingDeps.get(n.id)!.size === 0)
      .sort(byPriority);
    if (ready.length === 0) {
      // Cycle: emit the rest in priority order so nothing is silently lost.
      ordered.push(...diagram.nodes.filter((n) => remaining.has(n.id)).sort(byPriority));
      break;
    }
    for (const node of ready) {
      ordered.push(node);
      remaining.delete(node.id);
      for (const deps of pendingDeps.values()) deps.delete(node.id);
    }
  }
  return ordered;
}

function header(diagram: Diagram): string[] {
  const hasAws = diagram.nodes.some((n) => providerOf(n) === "aws");
  const hasGcp = diagram.nodes.some((n) => providerOf(n) === "gcp");

  const required: string[] = [];
  if (hasAws) {
    required.push(`    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }`);
  }
  if (hasGcp) {
    required.push(`    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }`);
  }

  const blocks: string[] = [
    `terraform {
  required_version = ">= 1.5.0"

  required_providers {
${required.join("\n")}
  }
}`,
  ];

  if (hasAws) {
    blocks.push(
      `provider "aws" {
  region = var.aws_region
}`,
      `variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}`
    );
  }
  if (hasGcp) {
    blocks.push(
      `provider "google" {
  project = var.gcp_project
  region  = var.gcp_region
}`,
      `variable "gcp_project" {
  description = "Google Cloud project id"
  type        = string
}`,
      `variable "gcp_region" {
  description = "Google Cloud region to deploy into"
  type        = string
  default     = "us-central1"
}`
    );
  }

  if (nodesOfType(diagram, "rds_instance").length > 0) {
    blocks.push(`variable "db_password" {
  description = "Master password for RDS (set via TF_VAR_db_password, never commit it)"
  type        = string
  sensitive   = true
}`);
  }

  const needsCert = nodesOfType(diagram, "alb").some((alb) =>
    alb.properties.listeners.some((l) => l.protocol === "HTTPS")
  );
  if (needsCert) {
    blocks.push(`variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS listeners"
  type        = string
}`);
  }

  return blocks;
}

/**
 * Emit a node's blocks. `depends_on` edges on rich nodes are injected into
 * the primary resource block (the generic emitter handles its own).
 */
function emitNode(node: IRNode, ctx: CodegenContext): string[] {
  const blocks = (EMITTERS[node.type] as Emitter)(node, ctx);
  if (node.type === "generic") return blocks;

  const dependsOn = ctx.relatedAll(node.id, "depends_on").map((n) => ctx.address(n.id));
  if (dependsOn.length === 0) return blocks;

  const primaryHeader = `resource "${ctx.tfTypeOf(node)}" "${ctx.labelOf(node.id)}"`;
  return blocks.map((block) => {
    if (!block.startsWith(primaryHeader)) return block;
    const end = block.lastIndexOf("}");
    return `${block.slice(0, end)}\n  depends_on = ${rawList(dependsOn)}\n${block.slice(end)}`;
  });
}

/** Walk the IR and emit a single main.tf-style document. */
export function generateTerraform(diagram: Diagram): string {
  if (diagram.nodes.length === 0) {
    return "# Drag resources onto the canvas to generate Terraform.\n";
  }
  const ctx = new CodegenContext(diagram);
  const blocks = [
    "# Generated by Infrager. Review before applying.",
    ...header(diagram),
    ...orderNodes(diagram).flatMap((node) => emitNode(node, ctx)),
  ];
  return blocks.join("\n\n") + "\n";
}
