import type { NodeOfType } from "../../ir/schema";
import type { CodegenContext } from "../context";
import { q, rawList } from "../hcl";

/**
 * Fallback emitter for any catalog-backed service. Renders the node's
 * freeform attributes as a flat resource block plus depends_on for drawn
 * dependency edges. Rich modeling (nested blocks, cross-references, lint)
 * comes when a service is promoted to a typed resource.
 */
export function emitGeneric(node: NodeOfType<"generic">, ctx: CodegenContext): string[] {
  const p = node.properties;
  const label = ctx.labelOf(node.id);
  const entries = Object.entries(p.attributes);
  const dependsOn = ctx.relatedAll(node.id, "depends_on").map((n) => ctx.address(n.id));

  const width = Math.max(0, ...entries.map(([k]) => k.length), dependsOn.length > 0 ? 10 : 0);
  const lines = [`resource "${p.tfType}" "${label}" {`];
  if (entries.length === 0) {
    lines.push(`  # INFRAGER TODO: configure required attributes for ${p.tfType}`);
  }
  for (const [key, value] of entries) {
    const rendered = typeof value === "string" ? q(value) : String(value);
    lines.push(`  ${key.padEnd(width)} = ${rendered}`);
  }
  if (dependsOn.length > 0) {
    lines.push("", `  ${"depends_on".padEnd(width)} = ${rawList(dependsOn)}`);
  }
  lines.push(`}`);
  return [lines.join("\n")];
}
