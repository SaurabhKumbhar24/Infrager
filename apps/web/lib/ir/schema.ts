/**
 * Infrager intermediate representation (IR).
 *
 * This is the contract between the three halves of the app:
 *
 *   canvas (React Flow state)  --serialize-->  IR  --consume-->  codegen (HCL)
 *                                              IR  --consume-->  lint (rule engine)
 *
 * The IR is deliberately independent of both the canvas library and Terraform
 * syntax: no React Flow types appear here, and property names are semantic
 * ("encryption", "blockPublicAccess") rather than provider attribute names
 * ("server_side_encryption_configuration"). Codegen owns the mapping to HCL.
 *
 * Everything here is plain JSON-serializable data, so a Diagram can later be
 * POSTed to a backend for persistence without any transformation.
 */

// ---------------------------------------------------------------------------
// Resource types
// ---------------------------------------------------------------------------

export type CloudProvider = "aws" | "gcp";

/**
 * The "rich" resource types: full typed properties, bespoke codegen emitters,
 * and security lint rules. Everything else on the palette is a catalog-backed
 * `generic` node (see GenericNode below): still real Terraform output, but
 * with freeform attributes. Promoting a service from generic to rich =
 * adding it here + typed properties + an emitter (+ lint rules).
 */
export const RESOURCE_TYPES = [
  "vpc",
  "subnet",
  "security_group",
  "ec2_instance",
  "alb",
  "rds_instance",
  "s3_bucket",
  "iam_role",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

// ---------------------------------------------------------------------------
// Per-resource properties
// ---------------------------------------------------------------------------

export interface VpcProperties {
  cidrBlock: string;
  enableDnsSupport: boolean;
  enableDnsHostnames: boolean;
}

export interface SubnetProperties {
  cidrBlock: string;
  availabilityZone: string;
  /** Maps to map_public_ip_on_launch; also used by lint to reason about exposure. */
  mapPublicIpOnLaunch: boolean;
}

export interface SecurityGroupRule {
  protocol: "tcp" | "udp" | "icmp" | "all";
  fromPort: number;
  toPort: number;
  cidrBlocks: string[];
  description?: string;
}

export interface SecurityGroupProperties {
  description: string;
  ingress: SecurityGroupRule[];
  egress: SecurityGroupRule[];
}

export interface Ec2InstanceProperties {
  ami: string;
  instanceType: string;
  associatePublicIpAddress: boolean;
  rootVolumeSizeGb: number;
}

export interface AlbListener {
  port: number;
  protocol: "HTTP" | "HTTPS";
}

export interface AlbProperties {
  /** internal = true keeps the ALB off the public internet. */
  internal: boolean;
  listeners: AlbListener[];
}

export interface RdsInstanceProperties {
  engine: "postgres" | "mysql" | "mariadb";
  engineVersion: string;
  instanceClass: string;
  allocatedStorageGb: number;
  storageEncrypted: boolean;
  publiclyAccessible: boolean;
  multiAz: boolean;
}

export type S3Encryption = "none" | "AES256" | "aws:kms";

export interface S3BucketProperties {
  versioningEnabled: boolean;
  encryption: S3Encryption;
  /** Maps to aws_s3_bucket_public_access_block with all four flags. */
  blockPublicAccess: boolean;
}

export interface IamPolicyStatement {
  sid?: string;
  effect: "Allow" | "Deny";
  actions: string[];
  resources: string[];
}

/**
 * IAM Role and its inline policy are modeled as ONE node. v1 has no standalone
 * policy node: a separate policy node would mostly exist to draw an
 * "attached_to" edge, and collapsing them keeps both the palette and the lint
 * rules ("does this role grant Action:*?") simpler. Codegen expands this node
 * into aws_iam_role + aws_iam_role_policy (+ instance profile when attached
 * to EC2).
 */
export interface IamRoleProperties {
  /** Service principal allowed to assume the role, e.g. "ec2.amazonaws.com". */
  assumeRoleService: string;
  statements: IamPolicyStatement[];
}

// ---------------------------------------------------------------------------
// Nodes (discriminated union on `type`)
// ---------------------------------------------------------------------------

interface ResourceNodeBase {
  /** Stable unique id within the diagram (also the canvas node id). */
  id: string;
  /**
   * User-facing name; codegen slugifies it into the Terraform resource label,
   * so it should be unique per diagram.
   */
  name: string;
}

export interface VpcNode extends ResourceNodeBase {
  type: "vpc";
  properties: VpcProperties;
}
export interface SubnetNode extends ResourceNodeBase {
  type: "subnet";
  properties: SubnetProperties;
}
export interface SecurityGroupNode extends ResourceNodeBase {
  type: "security_group";
  properties: SecurityGroupProperties;
}
export interface Ec2InstanceNode extends ResourceNodeBase {
  type: "ec2_instance";
  properties: Ec2InstanceProperties;
}
export interface AlbNode extends ResourceNodeBase {
  type: "alb";
  properties: AlbProperties;
}
export interface RdsInstanceNode extends ResourceNodeBase {
  type: "rds_instance";
  properties: RdsInstanceProperties;
}
export interface S3BucketNode extends ResourceNodeBase {
  type: "s3_bucket";
  properties: S3BucketProperties;
}
export interface IamRoleNode extends ResourceNodeBase {
  type: "iam_role";
  properties: IamRoleProperties;
}

/** Freeform attribute values a generic node can carry. */
export type GenericAttributeValue = string | number | boolean;

/**
 * Catalog-backed node for any service without bespoke modeling yet. Carries
 * its own tfType so codegen never needs a catalog lookup, keeping stored
 * diagrams self-contained even if the catalog changes.
 */
export interface GenericProperties {
  provider: CloudProvider;
  /** Catalog id, e.g. "aws.lambda" — used for icon/category lookups. */
  serviceId: string;
  /** Terraform resource type to emit, e.g. "aws_lambda_function". */
  tfType: string;
  category: string;
  attributes: Record<string, GenericAttributeValue>;
}

export interface GenericNode extends ResourceNodeBase {
  type: "generic";
  properties: GenericProperties;
}

export type IRNode =
  | VpcNode
  | SubnetNode
  | SecurityGroupNode
  | Ec2InstanceNode
  | AlbNode
  | RdsInstanceNode
  | S3BucketNode
  | IamRoleNode
  | GenericNode;

/** Maps a ResourceType to its node type, e.g. NodeOfType<"vpc"> = VpcNode. */
export type NodeOfType<T extends ResourceType | "generic"> = Extract<IRNode, { type: T }>;

/** Which cloud a node belongs to (the rich 8 are all AWS today). */
export function providerOf(node: IRNode): CloudProvider {
  return node.type === "generic" ? node.properties.provider : "aws";
}

// ---------------------------------------------------------------------------
// Edges (typed relationships)
// ---------------------------------------------------------------------------

/**
 * Direction convention: source DEPENDS ON / REFERENCES target — the same
 * direction as a Terraform attribute reference (aws_subnet.x.vpc_id points at
 * the VPC, so the edge is subnet --in_vpc--> vpc). Codegen can therefore
 * derive dependency order directly from edge direction.
 */
export type RelationshipType =
  | "in_vpc" // subnet | security_group  ->  vpc
  | "in_subnet" // ec2 | alb | rds  ->  subnet
  | "uses_security_group" // ec2 | alb | rds  ->  security_group
  | "assumes_role" // ec2  ->  iam_role  (via instance profile)
  | "targets" // alb  ->  ec2  (target group attachment)
  | "depends_on"; // anything -> anything: plain Terraform depends_on ordering

export interface IREdge {
  id: string;
  relationship: RelationshipType;
  /** id of the dependent node (the one holding the reference). */
  sourceId: string;
  /** id of the referenced node. */
  targetId: string;
}

/**
 * Which (source type, target type) pairs each relationship allows. Single
 * source of truth used by the canvas (to validate/auto-type connections), by
 * lint (to ignore nonsensical edges), and by tests.
 */
export const RELATIONSHIP_RULES: Record<
  Exclude<RelationshipType, "depends_on">,
  { sources: readonly ResourceType[]; targets: readonly ResourceType[] }
> = {
  in_vpc: { sources: ["subnet", "security_group"], targets: ["vpc"] },
  in_subnet: { sources: ["ec2_instance", "alb", "rds_instance"], targets: ["subnet"] },
  uses_security_group: {
    sources: ["ec2_instance", "alb", "rds_instance"],
    targets: ["security_group"],
  },
  assumes_role: { sources: ["ec2_instance"], targets: ["iam_role"] },
  targets: { sources: ["alb"], targets: ["ec2_instance"] },
};

type TypedRelationship = keyof typeof RELATIONSHIP_RULES;

/**
 * All TYPED relationships a (sourceType -> targetType) connection could mean.
 * `depends_on` is never inferred here: the canvas falls back to it when no
 * typed rule matches (any node may depend on any other).
 */
export function inferRelationships(
  sourceType: ResourceType | "generic",
  targetType: ResourceType | "generic"
): RelationshipType[] {
  if (sourceType === "generic" || targetType === "generic") return [];
  return (Object.keys(RELATIONSHIP_RULES) as TypedRelationship[]).filter((rel) => {
    const rule = RELATIONSHIP_RULES[rel];
    return rule.sources.includes(sourceType) && rule.targets.includes(targetType);
  });
}

export function isValidRelationship(
  relationship: RelationshipType,
  sourceType: ResourceType | "generic",
  targetType: ResourceType | "generic"
): boolean {
  if (relationship === "depends_on") return true;
  if (sourceType === "generic" || targetType === "generic") return false;
  const rule = RELATIONSHIP_RULES[relationship];
  return rule.sources.includes(sourceType) && rule.targets.includes(targetType);
}

// ---------------------------------------------------------------------------
// Diagram (the serialized document)
// ---------------------------------------------------------------------------

export interface Diagram {
  /** Schema version for forward-compatible persistence/migration. */
  version: 1;
  nodes: IRNode[];
  edges: IREdge[];
}

export function emptyDiagram(): Diagram {
  return { version: 1, nodes: [], edges: [] };
}

// ---------------------------------------------------------------------------
// Query helpers (shared by codegen and lint)
// ---------------------------------------------------------------------------

export function getNode(diagram: Diagram, id: string): IRNode | undefined {
  return diagram.nodes.find((n) => n.id === id);
}

export function nodesOfType<T extends ResourceType | "generic">(
  diagram: Diagram,
  type: T
): NodeOfType<T>[] {
  return diagram.nodes.filter((n): n is NodeOfType<T> => n.type === type);
}

/** Nodes this node references, optionally filtered by relationship. */
export function referencedNodes(
  diagram: Diagram,
  nodeId: string,
  relationship?: RelationshipType
): IRNode[] {
  return diagram.edges
    .filter((e) => e.sourceId === nodeId && (!relationship || e.relationship === relationship))
    .map((e) => getNode(diagram, e.targetId))
    .filter((n): n is IRNode => n !== undefined);
}

/** Nodes that reference this node, optionally filtered by relationship. */
export function referencingNodes(
  diagram: Diagram,
  nodeId: string,
  relationship?: RelationshipType
): IRNode[] {
  return diagram.edges
    .filter((e) => e.targetId === nodeId && (!relationship || e.relationship === relationship))
    .map((e) => getNode(diagram, e.sourceId))
    .filter((n): n is IRNode => n !== undefined);
}
