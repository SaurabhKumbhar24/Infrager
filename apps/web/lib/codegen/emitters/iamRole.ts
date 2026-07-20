import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { hclObject, q } from "../hcl";
import { indent } from "../hcl";

/**
 * One IAM node expands into aws_iam_role + aws_iam_role_policy (when it has
 * statements) + aws_iam_instance_profile (when an EC2 instance assumes it).
 */
export function emitIamRole(node: NodeOfType<"iam_role">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const label = ctx.labelOf(node.id);
  // IAM names must match [\w+=,.@-]+ (no spaces).
  const iamName = node.name.replace(/[^\w+=,.@-]+/g, "-");
  const blocks: string[] = [];

  const assumeDoc = hclObject({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Action: "sts:AssumeRole",
        Principal: { Service: p.assumeRoleService },
      },
    ],
  });
  blocks.push(
    `resource "aws_iam_role" "${label}" {
  name               = ${q(iamName)}
  assume_role_policy = jsonencode(${indent(assumeDoc).trimStart()})
}`
  );

  if (p.statements.length > 0) {
    const policyDoc = hclObject({
      Version: "2012-10-17",
      Statement: p.statements.map((s) => ({
        ...(s.sid ? { Sid: s.sid } : {}),
        Effect: s.effect,
        Action: s.actions,
        Resource: s.resources,
      })),
    });
    blocks.push(
      `resource "aws_iam_role_policy" "${label}" {
  name   = ${q(`${iamName}-policy`)}
  role   = aws_iam_role.${label}.id
  policy = jsonencode(${indent(policyDoc).trimStart()})
}`
    );
  }

  if (ctx.referencedBy(node.id, "assumes_role").length > 0) {
    blocks.push(
      `resource "aws_iam_instance_profile" "${label}" {
  name = ${q(`${iamName}-profile`)}
  role = aws_iam_role.${label}.name
}`
    );
  }

  return blocks;
}
