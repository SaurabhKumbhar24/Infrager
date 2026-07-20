import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

export const publicS3Bucket: LintRule = {
  id: "public-s3-bucket",
  title: "S3 bucket allows public access",
  description: "Flags buckets without a full public access block.",
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const bucket of nodesOfType(diagram, "s3_bucket")) {
      if (!bucket.properties.blockPublicAccess) {
        findings.push({
          ruleId: this.id,
          severity: "error",
          nodeId: bucket.id,
          message: `S3 bucket "${bucket.name}" does not block public access.`,
          suggestion:
            "Enable Block Public Access. If you are serving a website, front the bucket with CloudFront instead of making it public.",
        });
      }
    }
    return findings;
  },
};
