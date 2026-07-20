import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q, rawList } from "../hcl";

export function emitRdsInstance(node: NodeOfType<"rds_instance">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const label = ctx.labelOf(node.id);
  const subnetRefs = ctx.refsAll(node.id, "in_subnet", "id");
  const sgRefs = ctx.refsAll(node.id, "uses_security_group", "id");

  const blocks: string[] = [];

  if (subnetRefs.length > 0) {
    const note =
      subnetRefs.length < 2 ? " # INFRAGER TODO: AWS requires subnets in at least two AZs" : "";
    blocks.push(
      `resource "aws_db_subnet_group" "${label}" {
  name       = ${q(`${label.replace(/_/g, "-")}-subnets`)}
  subnet_ids = ${rawList(subnetRefs)}${note}
}`
    );
  }

  const lines = [
    `resource "aws_db_instance" "${label}" {`,
    `  identifier          = ${q(label.replace(/_/g, "-"))}`,
    `  engine              = ${q(p.engine)}`,
    `  engine_version      = ${q(p.engineVersion)}`,
    `  instance_class      = ${q(p.instanceClass)}`,
    `  allocated_storage   = ${p.allocatedStorageGb}`,
    `  storage_encrypted   = ${p.storageEncrypted}`,
    `  publicly_accessible = ${p.publiclyAccessible}`,
    `  multi_az            = ${p.multiAz}`,
    `  username            = "dbadmin"`,
    `  password            = var.db_password`,
    `  skip_final_snapshot = true`,
  ];
  if (subnetRefs.length > 0) {
    lines.push(`  db_subnet_group_name = aws_db_subnet_group.${label}.name`);
  }
  if (sgRefs.length > 0) {
    lines.push(`  vpc_security_group_ids = ${rawList(sgRefs)}`);
  }
  lines.push(`}`);
  blocks.push(lines.join("\n"));

  return blocks;
}
