import { type IRNode, referencedNodes } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const missingNetworkAssociation: LintRule = {
  id: "missing-network-association",
  title: "Missing VPC/subnet association",
  description:
    "Flags resources whose required network attachment edge is missing; codegen emits a TODO placeholder for these.",
  check(diagram) {
    const findings: LintFinding[] = [];
    const missing = (node: IRNode, what: string): LintFinding => ({
      ruleId: this.id,
      severity: "warning",
      nodeId: node.id,
      message: `${what}`,
      suggestion: "Draw the connection on the canvas; the generated Terraform has a TODO until then.",
    });

    for (const node of diagram.nodes) {
      switch (node.type) {
        case "subnet":
          if (referencedNodes(diagram, node.id, "in_vpc").length === 0) {
            findings.push(missing(node, `Subnet "${node.name}" is not attached to a VPC.`));
          }
          break;
        case "security_group":
          if (referencedNodes(diagram, node.id, "in_vpc").length === 0) {
            findings.push(missing(node, `Security group "${node.name}" is not attached to a VPC.`));
          }
          break;
        case "ec2_instance":
          if (referencedNodes(diagram, node.id, "in_subnet").length === 0) {
            findings.push(missing(node, `EC2 instance "${node.name}" is not placed in a subnet.`));
          }
          break;
        case "rds_instance":
          if (referencedNodes(diagram, node.id, "in_subnet").length === 0) {
            findings.push(missing(node, `RDS instance "${node.name}" is not placed in a subnet.`));
          }
          break;
        case "alb": {
          const subnets = referencedNodes(diagram, node.id, "in_subnet");
          if (subnets.length === 0) {
            findings.push(missing(node, `Load balancer "${node.name}" is not placed in any subnet.`));
          } else if (subnets.length === 1) {
            findings.push(
              missing(
                node,
                `Load balancer "${node.name}" is in only one subnet; AWS requires subnets in at least two availability zones.`
              )
            );
          }
          break;
        }
        default:
          break;
      }
    }
    return findings;
  },
};
