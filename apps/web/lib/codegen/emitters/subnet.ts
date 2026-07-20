import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q } from "../hcl";

export function emitSubnet(node: NodeOfType<"subnet">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const vpcId = ctx.refOrTodo(node.id, "in_vpc", "id", "connect this subnet to a VPC");
  return [
    `resource "aws_subnet" "${ctx.labelOf(node.id)}" {
  vpc_id                  = ${vpcId}
  cidr_block              = ${q(p.cidrBlock)}
  availability_zone       = ${q(p.availabilityZone)}
  map_public_ip_on_launch = ${p.mapPublicIpOnLaunch}

  tags = {
    Name = ${q(node.name)}
  }
}`,
  ];
}
