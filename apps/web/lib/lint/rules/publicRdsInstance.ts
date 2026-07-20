import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const publicRdsInstance: LintRule = {
  id: "public-rds-instance",
  title: "RDS instance publicly accessible",
  description: "Flags databases reachable from the public internet.",
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const db of nodesOfType(diagram, "rds_instance")) {
      if (db.properties.publiclyAccessible) {
        findings.push({
          ruleId: this.id,
          severity: "error",
          nodeId: db.id,
          message: `RDS instance "${db.name}" is publicly accessible.`,
          suggestion:
            "Set publicly_accessible = false and reach the database from inside the VPC (or via a bastion/VPN).",
        });
      }
    }
    return findings;
  },
};
