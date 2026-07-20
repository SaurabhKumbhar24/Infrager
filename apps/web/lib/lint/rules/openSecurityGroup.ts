import { nodesOfType } from "../../ir/schema";
import type { LintFinding, LintRule } from "../types";

const WORLD_CIDRS = new Set(["0.0.0.0/0", "::/0"]);

/** Ports where world-open ingress is treated as an error, not just a warning. */
const SENSITIVE_PORTS: Record<number, string> = {
  22: "SSH",
  3389: "RDP",
  3306: "MySQL",
  5432: "PostgreSQL",
  1433: "SQL Server",
  27017: "MongoDB",
  6379: "Redis",
  9200: "Elasticsearch",
};

export const openSecurityGroup: LintRule = {
  id: "open-security-group",
  title: "Security group open to the world",
  description:
    "Flags ingress rules that allow 0.0.0.0/0 or ::/0. Sensitive ports (SSH, RDP, databases) are errors; anything else is a warning.",
  check(diagram) {
    const findings: LintFinding[] = [];
    for (const sg of nodesOfType(diagram, "security_group")) {
      for (const rule of sg.properties.ingress) {
        if (!rule.cidrBlocks.some((cidr) => WORLD_CIDRS.has(cidr))) continue;

        const coversAll = rule.protocol === "all" || (rule.fromPort === 0 && rule.toPort === 0);
        const hitServices = Object.entries(SENSITIVE_PORTS)
          .filter(([port]) => coversAll || (rule.fromPort <= +port && +port <= rule.toPort))
          .map(([port, service]) => `${service} (${port})`);

        if (coversAll) {
          findings.push({
            ruleId: this.id,
            severity: "error",
            nodeId: sg.id,
            message: `Security group "${sg.name}" allows ingress from the entire internet on ALL ports.`,
            suggestion: "Restrict the rule to the specific ports and source CIDRs you need.",
          });
        } else if (hitServices.length > 0) {
          findings.push({
            ruleId: this.id,
            severity: "error",
            nodeId: sg.id,
            message: `Security group "${sg.name}" exposes ${hitServices.join(", ")} to the entire internet (0.0.0.0/0).`,
            suggestion:
              "Limit the source to a trusted CIDR, or reach these services through a bastion/VPN.",
          });
        } else {
          findings.push({
            ruleId: this.id,
            severity: "warning",
            nodeId: sg.id,
            message: `Security group "${sg.name}" allows ingress from anywhere on ports ${rule.fromPort}-${rule.toPort}.`,
            suggestion:
              "Fine for a public web tier (80/443 behind an ALB); otherwise restrict the source CIDR.",
          });
        }
      }
    }
    return findings;
  },
};
