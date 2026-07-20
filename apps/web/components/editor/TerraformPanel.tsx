"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Download01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";

export default function TerraformPanel({ tf, projectName }: { tf: string; projectName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(tf).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function download() {
    const blob = new Blob([tf], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "main"}.tf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-sandstone px-4 py-2">
        <span className="mono text-[11px] text-muted">main.tf</span>
        <div className="flex gap-1.5">
          <button
            onClick={copy}
            className="flex h-7 items-center gap-1.5 rounded-lg border border-sandstone px-2.5 text-xs font-medium hover:bg-sand"
          >
            <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={12} />
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            className="flex h-7 items-center gap-1.5 rounded-lg bg-ink px-2.5 text-xs font-semibold text-paper hover:bg-night"
          >
            <HugeiconsIcon icon={Download01Icon} size={12} />
            .tf
          </button>
        </div>
      </div>
      <pre className="mono flex-1 overflow-auto p-4 text-[11px] leading-relaxed text-ink">{tf}</pre>
    </div>
  );
}
