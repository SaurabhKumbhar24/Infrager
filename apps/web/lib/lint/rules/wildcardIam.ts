import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const wildcardIam: LintRule = {
  id: "wildcard-iam",
  title: "Overly broad IAM policy",
  description:
    'Flags Allow statements using "*" for actions or resources. Both together is full admin (error); either alone is a warning.',
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const role of nodesOfType(diagram, "iam_role")) {
      for (const stmt of role.properties.statements) {
        if (stmt.effect !== "Allow") continue;
        const wildAction = stmt.actions.includes("*");
        const wildResource = stmt.resources.includes("*");
        if (wildAction && wildResource) {
          findings.push({
            ruleId: this.id,
            severity: "error",
            nodeId: role.id,
            message: `IAM role "${role.name}" grants full administrator access (Action: "*" on Resource: "*").`,
            suggestion:
              "Scope actions to the specific services and resources this workload needs (least privilege).",
          });
        } else if (wildAction || wildResource) {
          const which = wildAction ? 'Action: "*"' : 'Resource: "*"';
          findings.push({
            ruleId: this.id,
            severity: "warning",
            nodeId: role.id,
            message: `IAM role "${role.name}" has an Allow statement with ${which}.`,
            suggestion: "Replace the wildcard with an explicit list of actions/ARNs.",
          });
        }
      }
    }
    return findings;
  },
};
