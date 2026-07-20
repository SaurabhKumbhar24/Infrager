"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { useMemo, useState } from "react";
import { CATALOG, type CatalogService } from "@/lib/catalog";
import { RESOURCE_LABELS } from "@/lib/ir/defaults";
import { RESOURCE_TYPES, type CloudProvider, type ResourceType } from "@/lib/ir/schema";
import { CATEGORY_ICONS, RESOURCE_ICONS } from "./icons";

export const PALETTE_MIME = "application/infrager-resource";

/** Drag payload: rich core type or catalog service id. */
export type PalettePayload = { kind: "core"; type: ResourceType } | { kind: "catalog"; id: string };

export default function Palette({ onAdd }: { onAdd: (payload: PalettePayload) => void }) {
  const [provider, setProvider] = useState<CloudProvider>("aws");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const services = useMemo(
    () =>
      CATALOG.filter(
        (s) => s.provider === provider && (!q || s.label.toLowerCase().includes(q) || s.tfType.includes(q))
      ),
    [provider, q]
  );
  const coreMatches: ResourceType[] =
    provider === "aws"
      ? RESOURCE_TYPES.filter((t) => !q || RESOURCE_LABELS[t].toLowerCase().includes(q))
      : [];

  const byCategory = useMemo(() => {
    const map = new Map<string, CatalogService[]>();
    for (const s of services) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return map;
  }, [services]);

  const item = (
    key: string,
    label: string,
    icon: (typeof CATEGORY_ICONS)[keyof typeof CATEGORY_ICONS],
    payload: PalettePayload,
    core = false
  ) => (
    <div
      key={key}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(PALETTE_MIME, JSON.stringify(payload));
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onAdd(payload)}
      className="flex cursor-grab items-center gap-2.5 rounded-lg border border-sandstone bg-paper px-2.5 py-2 transition hover:border-cobalt hover:bg-sand/50 active:cursor-grabbing"
      title={core ? "Core resource: full codegen + security linting" : "Drag onto the canvas (or click to add)"}
    >
      <span className="shrink-0 text-cobalt">
        <HugeiconsIcon icon={icon} size={15} strokeWidth={1.8} />
      </span>
      <span className="truncate text-[12.5px] font-medium">{label}</span>
      {core && <span className="mono ml-auto shrink-0 text-[9px] font-semibold text-signal-green">LINTED</span>}
    </div>
  );

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-sandstone bg-paper">
      <div className="flex shrink-0 border-b border-sandstone">
        {(["aws", "gcp"] as CloudProvider[]).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`flex-1 border-b-2 px-3 py-2.5 text-[12px] font-semibold uppercase tracking-wide transition ${
              provider === p ? "border-cobalt text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {p === "aws" ? "AWS" : "Google Cloud"}
          </button>
        ))}
      </div>
      <div className="shrink-0 border-b border-sandstone p-2.5">
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted">
            <HugeiconsIcon icon={Search01Icon} size={13} />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${provider === "aws" ? "AWS" : "GCP"} services…`}
            className="h-8 w-full rounded-lg border border-sandstone bg-sand/60 pl-8 pr-2.5 text-[12.5px] focus:border-cobalt focus:outline-none focus:ring-[3px] focus:ring-cobalt/15"
          />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-2.5">
        {coreMatches.length > 0 && (
          <div>
            <div className="label mb-1.5 px-1 text-muted">Core</div>
            <div className="space-y-1">
              {coreMatches.map((type) =>
                item(type, RESOURCE_LABELS[type], RESOURCE_ICONS[type], { kind: "core", type }, true)
              )}
            </div>
          </div>
        )}
        {[...byCategory.entries()].map(([category, items]) => (
          <div key={category}>
            <div className="label mb-1.5 px-1 text-muted">{category}</div>
            <div className="space-y-1">
              {items.map((s) =>
                item(
                  s.id,
                  s.label,
                  CATEGORY_ICONS[s.category],
                  { kind: "catalog", id: s.id }
                )
              )}
            </div>
          </div>
        ))}
        {coreMatches.length === 0 && services.length === 0 && (
          <p className="px-1 pt-4 text-center text-xs text-muted">No services match “{query}”.</p>
        )}
      </div>

      <p className="shrink-0 border-t border-sandstone p-3 text-[10.5px] leading-relaxed text-muted">
        Core resources get typed properties and security linting. Catalog services emit real
        Terraform with freeform attributes; connect any two nodes to add a depends_on.
      </p>
    </aside>
  );
}
