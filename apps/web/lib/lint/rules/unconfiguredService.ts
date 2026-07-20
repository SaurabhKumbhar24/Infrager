import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const unconfiguredService: LintRule = {
  id: "unconfigured-service",
  title: "Catalog service has no attributes",
  description:
    "Flags generic (catalog) resources with an empty attribute set; the emitted Terraform block will not pass validate until configured.",
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const node of nodesOfType(diagram, "generic")) {
      if (Object.keys(node.properties.attributes).length === 0) {
        findings.push({
          ruleId: this.id,
          severity: "warning",
          nodeId: node.id,
          message: `"${node.name}" (${node.properties.tfType}) has no attributes configured yet.`,
          suggestion: "Open the Inspect panel and add the attributes this resource requires.",
        });
      }
    }
    return findings;
  },
};
