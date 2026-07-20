import type { CatalogService } from "../catalog/types";
import type { GenericNode, IRNode, ResourceType } from "./schema";

/**
 * Defaults are secure-by-default (encryption on, public access blocked,
 * private ALB/RDS): Infrager should never be the reason an insecure default
 * ships. Lint fires when the user opts INTO something risky, not because the
 * palette handed them a footgun.
 */
export function createNode(type: ResourceType, id: string, name: string): IRNode {
  switch (type) {
    case "vpc":
      return {
        id,
        name,
        type,
        properties: { cidrBlock: "10.0.0.0/16", enableDnsSupport: true, enableDnsHostnames: true },
      };
    case "subnet":
      return {
        id,
        name,
        type,
        properties: {
          cidrBlock: "10.0.1.0/24",
          availabilityZone: "us-east-1a",
          mapPublicIpOnLaunch: false,
        },
      };
    case "security_group":
      return {
        id,
        name,
        type,
        properties: {
          description: "Managed by Infrager",
          ingress: [],
          egress: [
            {
              protocol: "all",
              fromPort: 0,
              toPort: 0,
              cidrBlocks: ["0.0.0.0/0"],
              description: "Allow all outbound",
            },
          ],
        },
      };
    case "ec2_instance":
      return {
        id,
        name,
        type,
        properties: {
          ami: "ami-0c02fb55956c7d316",
          instanceType: "t3.micro",
          associatePublicIpAddress: false,
          rootVolumeSizeGb: 8,
        },
      };
    case "alb":
      return {
        id,
        name,
        type,
        properties: { internal: true, listeners: [{ port: 443, protocol: "HTTPS" }] },
      };
    case "rds_instance":
      return {
        id,
        name,
        type,
        properties: {
          engine: "postgres",
          engineVersion: "16.3",
          instanceClass: "db.t3.micro",
          allocatedStorageGb: 20,
          storageEncrypted: true,
          publiclyAccessible: false,
          multiAz: false,
        },
      };
    case "s3_bucket":
      return {
        id,
        name,
        type,
        properties: { versioningEnabled: true, encryption: "AES256", blockPublicAccess: true },
      };
    case "iam_role":
      return {
        id,
        name,
        type,
        properties: { assumeRoleService: "ec2.amazonaws.com", statements: [] },
      };
  }
}

/** Instantiate a catalog service as a generic IR node. */
export function createCatalogNode(service: CatalogService, id: string, name: string): GenericNode {
  const attributes: GenericNode["properties"]["attributes"] = {};
  for (const [key, value] of Object.entries(service.defaults ?? {})) {
    attributes[key] =
      typeof value === "string" ? value.replaceAll("__NAME__", slugForName(name)) : value;
  }
  return {
    id,
    name,
    type: "generic",
    properties: {
      provider: service.provider,
      serviceId: service.id,
      tfType: service.tfType,
      category: service.category,
      attributes,
    },
  };
}

/** Cloud-safe identifier derived from the display name (most APIs reject spaces). */
function slugForName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "resource"
  );
}

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  vpc: "VPC",
  subnet: "Subnet",
  security_group: "Security Group",
  ec2_instance: "EC2 Instance",
  alb: "Application Load Balancer",
  rds_instance: "RDS Instance",
  s3_bucket: "S3 Bucket",
  iam_role: "IAM Role / Policy",
};
