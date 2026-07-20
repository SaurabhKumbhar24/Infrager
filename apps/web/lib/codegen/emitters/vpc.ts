import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q } from "../hcl";

export function emitVpc(node: NodeOfType<"vpc">, ctx: CodegenContext): string[] {
  const p = node.properties;
  return [
    `resource "aws_vpc" "${ctx.labelOf(node.id)}" {
  cidr_block           = ${q(p.cidrBlock)}
  enable_dns_support   = ${p.enableDnsSupport}
  enable_dns_hostnames = ${p.enableDnsHostnames}

  tags = {
    Name = ${q(node.name)}
  }
}`,
  ];
}
