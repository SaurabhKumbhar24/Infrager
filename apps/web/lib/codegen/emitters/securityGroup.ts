import type { NodeOfType, SecurityGroupRule } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q, strList } from "../hcl";

function ruleBlock(kind: "ingress" | "egress", rule: SecurityGroupRule): string {
  const protocol = rule.protocol === "all" ? "-1" : rule.protocol;
  const lines = [
    `  ${kind} {`,
    `    protocol    = ${q(protocol)}`,
    `    from_port   = ${rule.fromPort}`,
    `    to_port     = ${rule.toPort}`,
    `    cidr_blocks = ${strList(rule.cidrBlocks)}`,
  ];
  if (rule.description) lines.push(`    description = ${q(rule.description)}`);
  lines.push(`  }`);
  return lines.join("\n");
}

export function emitSecurityGroup(
  node: NodeOfType<"security_group">,
  ctx: CodegenContext
): string[] {
  const p = node.properties;
  const vpcId = ctx.refOrTodo(node.id, "in_vpc", "id", "connect this security group to a VPC");
  const blocks = [
    ...p.ingress.map((r) => ruleBlock("ingress", r)),
    ...p.egress.map((r) => ruleBlock("egress", r)),
  ];
  const rules = blocks.length > 0 ? `\n\n${blocks.join("\n\n")}` : "";
  return [
    `resource "aws_security_group" "${ctx.labelOf(node.id)}" {
  name        = ${q(node.name)}
  description = ${q(p.description)}
  vpc_id      = ${vpcId}${rules}

  tags = {
    Name = ${q(node.name)}
  }
}`,
  ];
}
