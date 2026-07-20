/**
 * Smoke test: build a representative diagram in code, print the generated HCL.
 * Run: npx tsx scripts/codegen-smoke.ts
 */
import { generateTerraform } from "../lib/codegen";
import { buildSampleDiagram } from "./fixture";

process.stdout.write(generateTerraform(buildSampleDiagram()));
