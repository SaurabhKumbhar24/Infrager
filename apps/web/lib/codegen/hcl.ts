/** Tiny HCL rendering helpers shared by all emitters. */

/** Quote and escape a string literal for HCL. */
export function q(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Render a list of quoted string literals: ["a", "b"]. */
export function strList(items: string[]): string {
  return `[${items.map(q).join(", ")}]`;
}

/** Render a list of raw (unquoted) expressions: [aws_subnet.a.id, aws_subnet.b.id]. */
export function rawList(items: string[]): string {
  return `[${items.join(", ")}]`;
}

/** Indent every non-empty line of a chunk by `level` two-space steps. */
export function indent(text: string, level = 1): string {
  const pad = "  ".repeat(level);
  return text
    .split("\n")
    .map((line) => (line.trim() === "" ? line : pad + line))
    .join("\n");
}

/**
 * Render an HCL object literal for use inside jsonencode(...), e.g. IAM policy
 * documents. Uses HCL map syntax (key = value), one key per line.
 */
export function hclObject(obj: Record<string, unknown>, level = 0): string {
  const pad = "  ".repeat(level + 1);
  const lines = Object.entries(obj).map(([key, value]) => `${pad}${key} = ${hclValue(value, level + 1)}`);
  return `{\n${lines.join("\n")}\n${"  ".repeat(level)}}`;
}

function hclValue(value: unknown, level: number): string {
  if (typeof value === "string") return q(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const pad = "  ".repeat(level + 1);
    const items = value.map((v) => `${pad}${hclValue(v, level + 1)}`).join(",\n");
    return `[\n${items},\n${"  ".repeat(level)}]`;
  }
  if (value !== null && typeof value === "object") {
    return hclObject(value as Record<string, unknown>, level);
  }
  return "null";
}
