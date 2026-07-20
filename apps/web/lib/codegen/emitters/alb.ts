import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q, rawList } from "../hcl";

/**
 * One ALB node expands into aws_lb + aws_lb_target_group + one listener per
 * configured port + one target group attachment per `targets` edge.
 */
export function emitAlb(node: NodeOfType<"alb">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const label = ctx.labelOf(node.id);
  const subnetRefs = ctx.refsAll(node.id, "in_subnet", "id");
  const sgRefs = ctx.refsAll(node.id, "uses_security_group", "id");
  const targets = ctx.relatedAll(node.id, "targets");

  // Target group VPC: follow alb -> subnet -> vpc; fall back to a TODO.
  const subnet = ctx.related(node.id, "in_subnet");
  const vpcId = subnet
    ? ctx.refOrTodo(subnet.id, "in_vpc", "id", "connect this ALB's subnet to a VPC")
    : `"" # INFRAGER TODO: place this ALB in a subnet`;

  const blocks: string[] = [];

  const subnets =
    subnetRefs.length > 0
      ? rawList(subnetRefs)
      : `[] # INFRAGER TODO: an ALB needs at least two subnets in different AZs`;
  const lbLines = [
    `resource "aws_lb" "${label}" {`,
    `  name               = ${q(node.name.toLowerCase().replace(/[^a-z0-9-]+/g, "-").slice(0, 32))}`,
    `  internal           = ${p.internal}`,
    `  load_balancer_type = "application"`,
    `  subnets            = ${subnets}`,
  ];
  if (sgRefs.length > 0) lbLines.push(`  security_groups    = ${rawList(sgRefs)}`);
  lbLines.push(`}`);
  blocks.push(lbLines.join("\n"));

  blocks.push(
    `resource "aws_lb_target_group" "${label}" {
  name     = ${q(`${label.replace(/_/g, "-")}-tg`.slice(0, 32))}
  port     = 80
  protocol = "HTTP"
  vpc_id   = ${vpcId}
}`
  );

  for (const listener of p.listeners) {
    const isHttps = listener.protocol === "HTTPS";
    const lines = [
      `resource "aws_lb_listener" "${label}_${listener.port}" {`,
      `  load_balancer_arn = aws_lb.${label}.arn`,
      `  port              = ${listener.port}`,
      `  protocol          = ${q(listener.protocol)}`,
    ];
    if (isHttps) {
      lines.push(`  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"`);
      lines.push(`  certificate_arn   = var.certificate_arn`);
    }
    lines.push(
      ``,
      `  default_action {`,
      `    type             = "forward"`,
      `    target_group_arn = aws_lb_target_group.${label}.arn`,
      `  }`,
      `}`
    );
    blocks.push(lines.join("\n"));
  }

  for (const target of targets) {
    blocks.push(
      `resource "aws_lb_target_group_attachment" "${label}_${ctx.labelOf(target.id)}" {
  target_group_arn = aws_lb_target_group.${label}.arn
  target_id        = ${ctx.ref(target.id, "id")}
  port             = 80
}`
    );
  }

  return blocks;
}
