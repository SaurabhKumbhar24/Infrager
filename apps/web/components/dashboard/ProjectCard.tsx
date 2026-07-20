"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, PencilEdit01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { apiFetch } from "@/lib/api";
import type { ProjectSummary } from "@/lib/types/project";

/** Tiny Figma-style thumbnail: node positions drawn as rects. */
function Thumbnail({ project }: { project: ProjectSummary }) {
  const points = Object.values(project.layout);
  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-t-[10px] bg-tint">
        <span className="mono text-[11px] text-muted">empty canvas</span>
      </div>
    );
  }
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs) - 40;
  const minY = Math.min(...ys) - 40;
  const width = Math.max(...xs) - minX + 220;
  const height = Math.max(...ys) - minY + 120;
  return (
    <svg
      viewBox={`${minX} ${minY} ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      className="h-32 w-full rounded-t-[10px] bg-tint"
    >
      {points.map((p, i) => (
        <rect
          key={i}
          x={p.x}
          y={p.y}
          width={170}
          height={56}
          rx={10}
          fill="var(--color-paper)"
          stroke="var(--color-sandstone-deep)"
          strokeWidth={2}
        />
      ))}
    </svg>
  );
}

export default function ProjectCard({
  project,
  onRenamed,
  onDeleted,
}: {
  project: ProjectSummary;
  onRenamed: (name: string) => void;
  onDeleted: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [confirming, setConfirming] = useState(false);

  async function commitRename() {
    setRenaming(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setName(project.name);
      return;
    }
    const res = await apiFetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: trimmed }),
    });
    if (res?.ok) onRenamed(trimmed);
    else setName(project.name);
  }

  async function deleteProject() {
    setConfirming(false);
    const res = await apiFetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res?.ok) onDeleted();
  }

  return (
    <div className="group relative rounded-[10px] border border-sandstone bg-paper transition hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      <Link href={`/editor/${project.id}`} className="block">
        <Thumbnail project={project} />
        <div className="border-t border-sandstone p-4">
          {renaming ? (
            <input
              autoFocus
              className="w-full rounded border border-cobalt bg-paper px-1 text-[1.05rem] font-semibold tracking-tight focus:outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setName(project.name);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.preventDefault()}
            />
          ) : (
            <h2 className="truncate text-[1.05rem] font-semibold tracking-tight">{project.name}</h2>
          )}
          <p className="mono mt-1 text-[11px] text-muted">
            {project.nodeCount} {project.nodeCount === 1 ? "resource" : "resources"} · updated{" "}
            {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </Link>

      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <button
          title="Rename"
          onClick={() => setRenaming(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-sandstone bg-paper text-muted hover:text-ink"
        >
          <HugeiconsIcon icon={PencilEdit01Icon} size={14} />
        </button>
        <button
          title="Delete"
          onClick={() => setConfirming(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-sandstone bg-paper text-muted hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete "${project.name}"?`}
        body="The project and its diagram are removed permanently. Generated Terraform you have already exported is unaffected."
        confirmLabel="Delete project"
        onConfirm={deleteProject}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
