import type { Diagram } from "../ir/schema";

export type LintSeverity = "error" | "warning";

export interface LintFinding {
  /** Stable rule id, e.g. "open-security-group". */
  ruleId: string;
  severity: LintSeverity;
  /** Node the finding applies to; drives on-canvas badges. */
  nodeId: string;
  /** Human-readable problem statement, includes the node's name. */
  message: string;
  /** Optional one-line remediation hint. */
  suggestion?: string;
}

/**
 * A rule is a pure predicate over the whole IR. It sees the full diagram (not
 * a single node) because several checks are relational, e.g. "EC2 with no
 * in_subnet edge". Rules must be side-effect free and fast: lint runs on
 * every canvas change.
 */
export interface LintRule {
  id: string;
  title: string;
  description: string;
  check(diagram: Diagram): LintFinding[];
}
