import type { Diagram } from "../ir/schema";
import { missingNetworkAssociation } from "./rules/missingNetworkAssociation";
import { openSecurityGroup } from "./rules/openSecurityGroup";
import { publicRdsInstance } from "./rules/publicRdsInstance";
import { publicS3Bucket } from "./rules/publicS3Bucket";
import { unconfiguredService } from "./rules/unconfiguredService";
import { unencryptedStorage } from "./rules/unencryptedStorage";
import { wildcardIam } from "./rules/wildcardIam";
import type { LintFinding, LintRule } from "./types";

export type { LintFinding, LintRule, LintSeverity } from "./types";

/** Adding a rule = add a file under rules/ and register it here. */
export const RULES: LintRule[] = [
  openSecurityGroup,
  publicS3Bucket,
  unencryptedStorage,
  wildcardIam,
  missingNetworkAssociation,
  publicRdsInstance,
  unconfiguredService,
];

/**
 * Run every rule over the diagram. Errors sort before warnings; ties keep
 * rule registration order so the panel is stable while editing.
 */
export function runLint(diagram: Diagram): LintFinding[] {
  const findings = RULES.flatMap((rule) => rule.check(diagram));
  return findings.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1
  );
}

/** Findings grouped per node, for on-canvas badges. */
export function findingsByNode(findings: LintFinding[]): Map<string, LintFinding[]> {
  const map = new Map<string, LintFinding[]>();
  for (const f of findings) {
    const list = map.get(f.nodeId) ?? [];
    list.push(f);
    map.set(f.nodeId, list);
  }
  return map;
}
