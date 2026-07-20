/** Shared sample diagram for smoke tests: a small 3-tier app with lint bait. */
import { getService } from "../lib/catalog";
import { createCatalogNode, createNode } from "../lib/ir/defaults";
import type { Diagram, IREdge, IRNode, RelationshipType } from "../lib/ir/schema";

export function buildSampleDiagram(): Diagram {
  const nodes: IRNode[] = [
    createNode("vpc", "n1", "Main VPC"),
    createNode("subnet", "n2", "Public Subnet A"),
    createNode("subnet", "n3", "Private Subnet B"),
    createNode("security_group", "n4", "Web SG"),
    createNode("ec2_instance", "n5", "App Server"),
    createNode("alb", "n6", "Public ALB"),
    createNode("rds_instance", "n7", "App DB"),
    createNode("s3_bucket", "n8", "Assets Bucket"),
    createNode("iam_role", "n9", "App Role"),
    // Catalog (generic) nodes: one AWS, two GCP, exercising the generic
    // emitter, the google provider header, and depends_on edges.
    createCatalogNode(getService("aws.lambda")!, "n10", "Thumbnailer"),
    createCatalogNode(getService("gcp.gcs")!, "n11", "Backup Bucket"),
    createCatalogNode(getService("gcp.bigquery_dataset")!, "n12", "Events Warehouse"),
  ];

  // Lint bait: open SSH to the world + wildcard IAM.
  const sg = nodes[3];
  if (sg.type === "security_group") {
    sg.properties.ingress.push({
      protocol: "tcp",
      fromPort: 22,
      toPort: 22,
      cidrBlocks: ["0.0.0.0/0"],
      description: "SSH",
    });
  }
  const role = nodes[8];
  if (role.type === "iam_role") {
    role.properties.statements.push({ effect: "Allow", actions: ["*"], resources: ["*"] });
  }
  const alb = nodes[5];
  if (alb.type === "alb") {
    alb.properties.listeners.push({ port: 80, protocol: "HTTP" });
  }

  let seq = 0;
  const edge = (rel: RelationshipType, sourceId: string, targetId: string): IREdge => ({
    id: `e${++seq}`,
    relationship: rel,
    sourceId,
    targetId,
  });

  return {
    version: 1,
    nodes,
    edges: [
      edge("in_vpc", "n2", "n1"),
      edge("in_vpc", "n3", "n1"),
      edge("in_vpc", "n4", "n1"),
      edge("in_subnet", "n5", "n3"),
      edge("uses_security_group", "n5", "n4"),
      edge("assumes_role", "n5", "n9"),
      edge("in_subnet", "n6", "n2"),
      edge("uses_security_group", "n6", "n4"),
      edge("targets", "n6", "n5"),
      edge("in_subnet", "n7", "n3"),
      edge("uses_security_group", "n7", "n4"),
      edge("depends_on", "n10", "n8"), // Lambda depends on the assets bucket
      edge("depends_on", "n12", "n11"), // BigQuery dataset depends on backup bucket
    ],
  };
}
