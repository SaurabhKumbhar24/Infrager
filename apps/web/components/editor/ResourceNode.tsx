"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { CanvasNode } from "@/lib/editor/serialize";
import { providerOf } from "@/lib/ir/schema";
import { iconForNode, tagForNode } from "./icons";
import { useNodeFindings } from "./LintContext";

function ResourceNodeInner({ id, data, selected }: NodeProps<CanvasNode>) {
  const findings = useNodeFindings(id);
  const errors = findings.filter((f) => f.severity === "error").length;
  const warnings = findings.length - errors;

  return (
    <div
      className={`relative w-[176px] rounded-[10px] border bg-paper p-3 transition-shadow ${
        selected
          ? "border-cobalt shadow-[0_0_0_3px_rgba(24,96,211,0.15)]"
          : "border-sandstone hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
      }`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand text-cobalt">
          <HugeiconsIcon icon={iconForNode(data.ir)} size={17} strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold leading-tight tracking-tight">
            {data.ir.name}
          </div>
          <div className="mono truncate text-[10px] text-muted">
            <span className="uppercase">{providerOf(data.ir)}</span> · {tagForNode(data.ir)}
          </div>
        </div>
      </div>
      {findings.length > 0 && (
        <span
          title={findings.map((f) => f.message).join("\n")}
          className={`absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-paper ${
            errors > 0 ? "bg-destructive" : "bg-signal-amber"
          }`}
        >
          {findings.length}
        </span>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export default memo(ResourceNodeInner);
