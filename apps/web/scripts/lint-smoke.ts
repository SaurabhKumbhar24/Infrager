/**
 * Smoke test for the lint engine.
 * Run: npx tsx scripts/lint-smoke.ts
 *
 * Pass 1: the sample diagram (open SSH, wildcard IAM, single-subnet ALB).
 * Pass 2: the same diagram with every remaining insecure toggle flipped, plus
 * a detached subnet, to prove each rule fires.
 */
import { runLint } from "../lib/lint";
import { createNode } from "../lib/ir/defaults";
import { buildSampleDiagram } from "./fixture";

function print(label: string, diagram: Parameters<typeof runLint>[0]) {
  const findings = runLint(diagram);
  console.log(`\n== ${label}: ${findings.length} finding(s) ==`);
  for (const f of findings) {
    console.log(`  [${f.severity.toUpperCase()}] (${f.ruleId}) ${f.message}`);
  }
}

print("sample diagram", buildSampleDiagram());

const bad = buildSampleDiagram();
for (const node of bad.nodes) {
  if (node.type === "s3_bucket") {
    node.properties.blockPublicAccess = false;
    node.properties.encryption = "none";
  }
  if (node.type === "rds_instance") {
    node.properties.storageEncrypted = false;
    node.properties.publiclyAccessible = true;
  }
}
bad.nodes.push(createNode("subnet", "n10", "Orphan Subnet"));
print("everything insecure", bad);
