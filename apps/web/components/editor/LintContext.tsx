"use client";

import { createContext, useContext } from "react";
import type { LintFinding } from "@/lib/lint";

/** Findings grouped by node id, consumed by canvas nodes for badges. */
export const LintContext = createContext<Map<string, LintFinding[]>>(new Map());

export function useNodeFindings(nodeId: string): LintFinding[] {
  return useContext(LintContext).get(nodeId) ?? [];
}
