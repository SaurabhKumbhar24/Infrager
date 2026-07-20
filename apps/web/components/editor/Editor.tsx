"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Logo from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  fromDocument,
  resolveConnection,
  toDocument,
  type CanvasEdge,
  type CanvasNode,
} from "@/lib/editor/serialize";
import { generateTerraform } from "@/lib/codegen";
import { getService } from "@/lib/catalog";
import { createCatalogNode, createNode, RESOURCE_LABELS } from "@/lib/ir/defaults";
import type { IRNode } from "@/lib/ir/schema";
import { findingsByNode, runLint } from "@/lib/lint";
import { apiFetch } from "@/lib/api";
import type { ProjectDocument } from "@/lib/types/project";
import Inspector from "./Inspector";
import IssuesPanel from "./IssuesPanel";
import { LintContext } from "./LintContext";
import Palette, { PALETTE_MIME, type PalettePayload } from "./Palette";
import ResourceNode from "./ResourceNode";
import TerraformPanel from "./TerraformPanel";

const nodeTypes = { resource: ResourceNode };

type Tab = "inspect" | "terraform" | "issues";
type SaveState = "saved" | "saving" | "error";

function EditorInner({
  projectId,
  initialName,
  initialDocument,
}: {
  projectId: string;
  initialName: string;
  initialDocument: ProjectDocument;
}) {
  const initial = useMemo(() => fromDocument(initialDocument), [initialDocument]);
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>(initial.edges);
  const [name, setName] = useState(initialName);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("terraform");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const { screenToFlowPosition, setCenter } = useReactFlow();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ---- derived: IR -> terraform + lint (the whole point of the IR) ----
  const document = useMemo(() => toDocument(nodes, edges), [nodes, edges]);
  const tf = useMemo(() => generateTerraform(document.diagram), [document]);
  const findings = useMemo(() => runLint(document.diagram), [document]);
  const byNode = useMemo(() => findingsByNode(findings), [findings]);
  const errorCount = findings.filter((f) => f.severity === "error").length;

  // ---- persistence: debounced autosave + Ctrl/Cmd+S ----
  const skippedFirstSave = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    async (payload: { name: string; document: ProjectDocument }) => {
      setSaveState("saving");
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      setSaveState(res?.ok ? "saved" : "error");
    },
    [projectId]
  );

  useEffect(() => {
    if (!skippedFirstSave.current) {
      skippedFirstSave.current = true;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(() => save({ name, document }), 1000);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [name, document, save]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        save({ name, document });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [name, document, save]);

  // ---- canvas interactions ----
  const addNode = useCallback(
    (payload: PalettePayload, position: { x: number; y: number }) => {
      const service = payload.kind === "catalog" ? getService(payload.id) : undefined;
      if (payload.kind === "catalog" && !service) return;
      const baseLabel = payload.kind === "core" ? RESOURCE_LABELS[payload.type] : service!.label;
      setNodes((ns) => {
        const existing = new Set(ns.map((n) => n.data.ir.name));
        let i = 1;
        let nodeName = `${baseLabel} ${i}`;
        while (existing.has(nodeName)) nodeName = `${baseLabel} ${++i}`;
        const id = crypto.randomUUID();
        const ir: IRNode =
          payload.kind === "core"
            ? createNode(payload.type, id, nodeName)
            : createCatalogNode(service!, id, nodeName);
        return [...ns, { id: ir.id, type: "resource" as const, position, data: { ir } }];
      });
    },
    [setNodes]
  );

  const addNodeAtCenter = useCallback(
    (payload: PalettePayload) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      const point = rect
        ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 3 }
        : { x: 400, y: 300 };
      // Jitter so repeated clicks don't stack perfectly.
      addNode(payload, {
        ...screenToFlowPosition({ x: point.x + Math.random() * 60 - 30, y: point.y + Math.random() * 60 - 30 }),
      });
    },
    [addNode, screenToFlowPosition]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData(PALETTE_MIME);
      if (!raw) return;
      let payload: PalettePayload;
      try {
        payload = JSON.parse(raw) as PalettePayload;
      } catch {
        return;
      }
      addNode(payload, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
    },
    [addNode, screenToFlowPosition]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((es) => {
        const source = nodes.find((n) => n.id === connection.source);
        const target = nodes.find((n) => n.id === connection.target);
        if (!source || !target) return es;
        const resolved = resolveConnection(source.data.ir, target.data.ir);
        if (!resolved) return es;
        const duplicate = es.some(
          (e) =>
            e.source === resolved.sourceId &&
            e.target === resolved.targetId &&
            e.data?.relationship === resolved.relationship
        );
        if (duplicate) return es;
        return [
          ...es,
          {
            id: crypto.randomUUID(),
            source: resolved.sourceId,
            target: resolved.targetId,
            label: resolved.relationship,
            data: { relationship: resolved.relationship },
          },
        ];
      });
    },
    [nodes, setEdges]
  );

  const isValidConnection = useCallback(
    (edge: CanvasEdge | Connection) => {
      if (edge.source === edge.target) return false;
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      return !!source && !!target && resolveConnection(source.data.ir, target.data.ir) !== null;
    },
    [nodes]
  );

  const updateIr = useCallback(
    (ir: IRNode) => {
      setNodes((ns) => ns.map((n) => (n.id === ir.id ? { ...n, data: { ir } } : n)));
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((ns) => ns.filter((n) => n.id !== id));
      setEdges((es) => es.filter((e) => e.source !== id && e.target !== id));
      setSelectedId(null);
    },
    [setNodes, setEdges]
  );

  const focusNode = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      setCenter(node.position.x + 88, node.position.y + 30, { zoom: 1.2, duration: 400 });
      setSelectedId(id);
      setTab("inspect");
      setNodes((ns) => ns.map((n) => ({ ...n, selected: n.id === id })));
    },
    [nodes, setCenter, setNodes]
  );

  const handleNodesChange = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      onNodesChange(changes);
      for (const c of changes) {
        if (c.type === "select") {
          if (c.selected) {
            setSelectedId(c.id);
            setTab("inspect");
          } else {
            setSelectedId((cur) => (cur === c.id ? null : cur));
          }
        }
        if (c.type === "remove") setSelectedId((cur) => (cur === c.id ? null : cur));
      }
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange<CanvasEdge>[]) => onEdgesChange(changes),
    [onEdgesChange]
  );

  const selectedNode = selectedId ? nodes.find((n) => n.id === selectedId) : undefined;

  const saveLabel =
    saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed — retrying on next change" : "Saved";

  return (
    <LintContext.Provider value={byNode}>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-sandstone bg-paper px-4">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-sandstone text-muted hover:bg-sand hover:text-ink"
            title="Back to projects"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </Link>
          <Logo href={null} size={22} />
          <span className="h-5 w-px bg-sandstone" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-64 rounded-lg border border-transparent bg-transparent px-2 text-sm font-semibold tracking-tight hover:border-sandstone focus:border-cobalt focus:outline-none"
          />
          <span
            className={`mono text-[11px] ${saveState === "error" ? "text-destructive" : "text-muted"}`}
          >
            {saveLabel}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <span
              className={`mono rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                errorCount > 0
                  ? "bg-destructive/10 text-destructive"
                  : findings.length > 0
                    ? "bg-signal-amber/10 text-signal-amber"
                    : "bg-signal-green/10 text-signal-green"
              }`}
            >
              {findings.length === 0
                ? "secure"
                : `${errorCount} error${errorCount === 1 ? "" : "s"} · ${findings.length - errorCount} warn`}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <Palette onAdd={addNodeAtCenter} />

          {/* Canvas */}
          <div ref={wrapperRef} className="min-w-0 flex-1" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              isValidConnection={isValidConnection}
              fitView
              fitViewOptions={{ padding: 0.3, minZoom: 0.8, maxZoom: 1 }}
              proOptions={{ hideAttribution: true }}
              deleteKeyCode={["Backspace", "Delete"]}
            >
              <Background
                variant={BackgroundVariant.Dots}
                color="var(--color-sandstone-deep)"
                gap={22}
                size={1.5}
              />
              <Controls showInteractive={false} />
              <MiniMap
                nodeColor="var(--color-sand)"
                nodeStrokeColor="var(--color-sandstone-deep)"
                maskColor="var(--rf-mask)"
                className="!border !border-sandstone !bg-paper"
                pannable
              />
            </ReactFlow>
          </div>

          {/* Right panel */}
          <aside className="flex w-[380px] shrink-0 flex-col border-l border-sandstone bg-paper">
            <div className="flex shrink-0 border-b border-sandstone">
              {(
                [
                  ["inspect", "Inspect"],
                  ["terraform", "Terraform"],
                  ["issues", `Issues (${findings.length})`],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${
                    tab === key
                      ? "border-cobalt text-ink"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {tab === "inspect" &&
                (selectedNode ? (
                  <Inspector
                    ir={selectedNode.data.ir}
                    onChange={updateIr}
                    onDelete={() => deleteNode(selectedNode.id)}
                    findings={byNode.get(selectedNode.id) ?? []}
                  />
                ) : (
                  <p className="p-6 text-center text-sm text-muted">
                    Select a resource on the canvas to edit its properties.
                  </p>
                ))}
              {tab === "terraform" && <TerraformPanel tf={tf} projectName={name} />}
              {tab === "issues" && <IssuesPanel findings={findings} onFocusNode={focusNode} />}
            </div>
          </aside>
        </div>
      </div>
    </LintContext.Provider>
  );
}

export default function Editor(props: {
  projectId: string;
  initialName: string;
  initialDocument: ProjectDocument;
}) {
  return (
    <ReactFlowProvider>
      <EditorInner {...props} />
    </ReactFlowProvider>
  );
}
