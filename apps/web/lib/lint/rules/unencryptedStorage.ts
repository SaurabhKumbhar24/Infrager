import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const unencryptedStorage: LintRule = {
  id: "unencrypted-storage",
  title: "Storage not encrypted at rest",
  description: "Flags RDS instances without storage encryption and S3 buckets without SSE.",
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const db of nodesOfType(diagram, "rds_instance")) {
      if (!db.properties.storageEncrypted) {
        findings.push({
          ruleId: this.id,
          severity: "error",
          nodeId: db.id,
          message: `RDS instance "${db.name}" has storage encryption disabled.`,
          suggestion:
            "Set storage_encrypted = true. Note: encryption cannot be enabled on an existing unencrypted instance without a snapshot migration.",
        });
      }
    }
    for (const bucket of nodesOfType(diagram, "s3_bucket")) {
      if (bucket.properties.encryption === "none") {
        findings.push({
          ruleId: this.id,
          severity: "error",
          nodeId: bucket.id,
          message: `S3 bucket "${bucket.name}" has no server-side encryption configured.`,
          suggestion: "Use AES256 (SSE-S3) as a minimum, or aws:kms for customer-managed keys.",
        });
      }
    }
    return findings;
  },
};
