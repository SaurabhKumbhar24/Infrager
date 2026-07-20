"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, AlertCircleIcon, SecurityCheckIcon } from "@hugeicons/core-free-icons";
import type { LintFinding } from "@/lib/lint";

export default function IssuesPanel({
  findings,
  onFocusNode,
}: {
  findings: LintFinding[];
  onFocusNode: (nodeId: string) => void;
}) {
  if (findings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <span className="text-signal-green">
          <HugeiconsIcon icon={SecurityCheckIcon} size={28} strokeWidth={1.5} />
        </span>
        <p className="text-sm font-medium">No security findings</p>
        <p className="text-xs text-muted">
          Rules run on every change: open security groups, public buckets, unencrypted storage,
          wildcard IAM, missing network attachments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto p-3">
      {findings.map((f, i) => (
        <button
          key={i}
          onClick={() => onFocusNode(f.nodeId)}
          className="w-full rounded-lg border border-sandstone p-3 text-left transition hover:border-cobalt"
        >
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-0.5 shrink-0 ${
                f.severity === "error" ? "text-destructive" : "text-signal-amber"
              }`}
            >
              <HugeiconsIcon
                icon={f.severity === "error" ? AlertCircleIcon : Alert01Icon}
                size={15}
                strokeWidth={2}
              />
            </span>
            <span>
              <span className="block text-[13px] leading-snug">{f.message}</span>
              {f.suggestion && (
                <span className="mt-1 block text-xs leading-snug text-muted">{f.suggestion}</span>
              )}
              <span className="mono mt-1.5 block text-[10px] text-muted">{f.ruleId}</span>
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
