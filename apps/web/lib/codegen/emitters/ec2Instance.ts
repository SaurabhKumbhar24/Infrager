import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q, rawList } from "../hcl";

export function emitEc2Instance(node: NodeOfType<"ec2_instance">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const subnetId = ctx.refOrTodo(node.id, "in_subnet", "id", "place this instance in a subnet");
  const sgRefs = ctx.refsAll(node.id, "uses_security_group", "id");
  const role = ctx.related(node.id, "assumes_role");

  const lines = [
    `resource "aws_instance" "${ctx.labelOf(node.id)}" {`,
    `  ami                         = ${q(p.ami)}`,
    `  instance_type               = ${q(p.instanceType)}`,
    `  subnet_id                   = ${subnetId}`,
    `  associate_public_ip_address = ${p.associatePublicIpAddress}`,
  ];
  if (sgRefs.length > 0) lines.push(`  vpc_security_group_ids      = ${rawList(sgRefs)}`);
  if (role) {
    // The instance profile is emitted by the IAM role emitter.
    lines.push(`  iam_instance_profile        = aws_iam_instance_profile.${ctx.labelOf(role.id)}.name`);
  }
  lines.push(
    ``,
    `  root_block_device {`,
    `    volume_size = ${p.rootVolumeSizeGb}`,
    `  }`,
    ``,
    `  tags = {`,
    `    Name = ${q(node.name)}`,
    `  }`,
    `}`
  );
  return [lines.join("\n")];
}
