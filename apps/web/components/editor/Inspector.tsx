"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import type {
  AlbNode,
  Ec2InstanceNode,
  GenericNode,
  IamRoleNode,
  IRNode,
  RdsInstanceNode,
  S3BucketNode,
  SecurityGroupNode,
  SubnetNode,
  VpcNode,
} from "@/lib/ir/schema";
import type { LintFinding } from "@/lib/lint";
import { getService } from "@/lib/catalog";
import { RESOURCE_LABELS } from "@/lib/ir/defaults";
import {
  ListItem,
  ListSection,
  NumberField,
  SelectField,
  TextField,
  ToggleField,
} from "./fields";

const csv = (items: string[]) => items.join(", ");
const uncsv = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

export default function Inspector({
  ir,
  onChange,
  onDelete,
  findings,
}: {
  ir: IRNode;
  onChange: (ir: IRNode) => void;
  onDelete: () => void;
  findings: LintFinding[];
}) {
  return (
    <div className="space-y-5 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="label text-muted">
            {ir.type === "generic"
              ? (getService(ir.properties.serviceId)?.label ?? ir.properties.tfType)
              : RESOURCE_LABELS[ir.type]}
          </div>
          <TextField label="" value={ir.name} onChange={(name) => onChange({ ...ir, name })} />
        </div>
        <button
          onClick={onDelete}
          title="Delete resource"
          className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sandstone text-muted hover:text-destructive"
        >
          <HugeiconsIcon icon={Delete02Icon} size={14} />
        </button>
      </div>

      <PropertiesForm ir={ir} onChange={onChange} />

      {findings.length > 0 && (
        <div className="space-y-2 border-t border-sandstone pt-4">
          <span className="label text-muted">Findings</span>
          {findings.map((f, i) => (
            <div
              key={i}
              className={`rounded-lg border p-2.5 text-xs leading-relaxed ${
                f.severity === "error"
                  ? "border-destructive/30 bg-destructive/5 text-destructive"
                  : "border-signal-amber/30 bg-signal-amber/5 text-signal-amber"
              }`}
            >
              {f.message}
              {f.suggestion && <div className="mt-1 text-muted">{f.suggestion}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertiesForm({ ir, onChange }: { ir: IRNode; onChange: (ir: IRNode) => void }) {
  switch (ir.type) {
    case "vpc":
      return <VpcForm node={ir} onChange={onChange} />;
    case "subnet":
      return <SubnetForm node={ir} onChange={onChange} />;
    case "security_group":
      return <SgForm node={ir} onChange={onChange} />;
    case "ec2_instance":
      return <Ec2Form node={ir} onChange={onChange} />;
    case "alb":
      return <AlbForm node={ir} onChange={onChange} />;
    case "rds_instance":
      return <RdsForm node={ir} onChange={onChange} />;
    case "s3_bucket":
      return <S3Form node={ir} onChange={onChange} />;
    case "iam_role":
      return <IamForm node={ir} onChange={onChange} />;
    case "generic":
      return <GenericForm node={ir} onChange={onChange} />;
  }
}

/** Coerce an attribute input back to a typed value ("true" -> true, "8" -> 8). */
function coerce(raw: string): string | number | boolean {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  return raw;
}

function GenericForm({ node, onChange }: { node: GenericNode; onChange: (ir: IRNode) => void }) {
  const p = node.properties;
  const entries = Object.entries(p.attributes);
  const setAttributes = (attributes: GenericNode["properties"]["attributes"]) =>
    onChange({ ...node, properties: { ...p, attributes } });

  return (
    <div className="space-y-4">
      <div className="mono rounded-lg bg-sand/60 px-2.5 py-1.5 text-[11px] text-muted">
        {p.provider.toUpperCase()} · {p.tfType}
      </div>
      <ListSection
        title="Attributes"
        addLabel="attribute"
        onAdd={() => {
          let key = "attribute";
          let i = 1;
          while (key in p.attributes) key = `attribute_${++i}`;
          setAttributes({ ...p.attributes, [key]: "" });
        }}
      >
        {entries.length === 0 && (
          <p className="text-xs text-muted">
            No attributes yet. Add the arguments this Terraform resource requires; values are
            emitted verbatim (true/false and numbers are unquoted).
          </p>
        )}
        {entries.map(([key, value]) => (
          <ListItem
            key={key}
            onRemove={() => {
              const next = { ...p.attributes };
              delete next[key];
              setAttributes(next);
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {/* Key commits on blur: committing per keystroke would remount the row. */}
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">Attribute</span>
                <input
                  className="mono h-8 w-full rounded-lg border border-sandstone bg-sand/60 px-2.5 text-[13px] text-ink focus:outline-none focus:border-cobalt focus:ring-[3px] focus:ring-cobalt/15"
                  defaultValue={key}
                  onBlur={(e) => {
                    const newKey = e.target.value.trim();
                    if (!newKey || newKey === key || newKey in p.attributes) {
                      e.target.value = key;
                      return;
                    }
                    const next: GenericNode["properties"]["attributes"] = {};
                    for (const [k, v] of Object.entries(p.attributes)) {
                      next[k === key ? newKey : k] = v;
                    }
                    setAttributes(next);
                  }}
                />
              </label>
              <TextField
                label="Value"
                mono
                value={String(value)}
                onChange={(v) => setAttributes({ ...p.attributes, [key]: coerce(v) })}
              />
            </div>
          </ListItem>
        ))}
      </ListSection>
    </div>
  );
}

function VpcForm({ node, onChange }: { node: VpcNode; onChange: (ir: IRNode) => void }) {
  const set = (p: Partial<VpcNode["properties"]>) =>
    onChange({ ...node, properties: { ...node.properties, ...p } });
  return (
    <div className="space-y-3">
      <TextField label="CIDR block" mono value={node.properties.cidrBlock} onChange={(v) => set({ cidrBlock: v })} />
      <ToggleField label="DNS support" value={node.properties.enableDnsSupport} onChange={(v) => set({ enableDnsSupport: v })} />
      <ToggleField label="DNS hostnames" value={node.properties.enableDnsHostnames} onChange={(v) => set({ enableDnsHostnames: v })} />
    </div>
  );
}

function SubnetForm({ node, onChange }: { node: SubnetNode; onChange: (ir: IRNode) => void }) {
  const set = (p: Partial<SubnetNode["properties"]>) =>
    onChange({ ...node, properties: { ...node.properties, ...p } });
  return (
    <div className="space-y-3">
      <TextField label="CIDR block" mono value={node.properties.cidrBlock} onChange={(v) => set({ cidrBlock: v })} />
      <TextField label="Availability zone" mono value={node.properties.availabilityZone} onChange={(v) => set({ availabilityZone: v })} />
      <ToggleField
        label="Auto-assign public IPs"
        hint="map_public_ip_on_launch"
        value={node.properties.mapPublicIpOnLaunch}
        onChange={(v) => set({ mapPublicIpOnLaunch: v })}
      />
    </div>
  );
}

const PROTOCOLS = ["tcp", "udp", "icmp", "all"] as const;

function SgForm({ node, onChange }: { node: SecurityGroupNode; onChange: (ir: IRNode) => void }) {
  const p = node.properties;
  const set = (patch: Partial<SecurityGroupNode["properties"]>) =>
    onChange({ ...node, properties: { ...p, ...patch } });

  const editRules = (kind: "ingress" | "egress") => ({
    add: () =>
      set({
        [kind]: [
          ...p[kind],
          { protocol: "tcp" as const, fromPort: 443, toPort: 443, cidrBlocks: ["10.0.0.0/16"] },
        ],
      }),
    remove: (i: number) => set({ [kind]: p[kind].filter((_, idx) => idx !== i) }),
    update: (i: number, patch: Partial<(typeof p.ingress)[number]>) =>
      set({ [kind]: p[kind].map((r, idx) => (idx === i ? { ...r, ...patch } : r)) }),
  });

  const renderRules = (kind: "ingress" | "egress") => {
    const ops = editRules(kind);
    return (
      <ListSection title={kind} onAdd={ops.add} addLabel="rule">
        {p[kind].map((rule, i) => (
          <ListItem key={i} onRemove={() => ops.remove(i)}>
            <div className="grid grid-cols-3 gap-2">
              <SelectField label="Protocol" value={rule.protocol} options={PROTOCOLS} onChange={(v) => ops.update(i, { protocol: v as (typeof PROTOCOLS)[number] })} />
              <NumberField label="From" value={rule.fromPort} min={0} onChange={(v) => ops.update(i, { fromPort: v })} />
              <NumberField label="To" value={rule.toPort} min={0} onChange={(v) => ops.update(i, { toPort: v })} />
            </div>
            <TextField label="Source CIDRs (comma-separated)" mono value={csv(rule.cidrBlocks)} onChange={(v) => ops.update(i, { cidrBlocks: uncsv(v) })} />
          </ListItem>
        ))}
      </ListSection>
    );
  };

  return (
    <div className="space-y-4">
      <TextField label="Description" value={p.description} onChange={(v) => set({ description: v })} />
      {renderRules("ingress")}
      {renderRules("egress")}
    </div>
  );
}

function Ec2Form({ node, onChange }: { node: Ec2InstanceNode; onChange: (ir: IRNode) => void }) {
  const set = (p: Partial<Ec2InstanceNode["properties"]>) =>
    onChange({ ...node, properties: { ...node.properties, ...p } });
  return (
    <div className="space-y-3">
      <TextField label="AMI" mono value={node.properties.ami} onChange={(v) => set({ ami: v })} />
      <TextField label="Instance type" mono value={node.properties.instanceType} onChange={(v) => set({ instanceType: v })} />
      <NumberField label="Root volume (GB)" min={8} value={node.properties.rootVolumeSizeGb} onChange={(v) => set({ rootVolumeSizeGb: v })} />
      <ToggleField label="Public IP address" value={node.properties.associatePublicIpAddress} onChange={(v) => set({ associatePublicIpAddress: v })} />
    </div>
  );
}

function AlbForm({ node, onChange }: { node: AlbNode; onChange: (ir: IRNode) => void }) {
  const p = node.properties;
  const set = (patch: Partial<AlbNode["properties"]>) =>
    onChange({ ...node, properties: { ...p, ...patch } });
  return (
    <div className="space-y-4">
      <ToggleField label="Internal (not internet-facing)" value={p.internal} onChange={(v) => set({ internal: v })} />
      <ListSection
        title="Listeners"
        addLabel="listener"
        onAdd={() => set({ listeners: [...p.listeners, { port: 80, protocol: "HTTP" }] })}
      >
        {p.listeners.map((l, i) => (
          <ListItem key={i} onRemove={() => set({ listeners: p.listeners.filter((_, idx) => idx !== i) })}>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Port" min={1} value={l.port} onChange={(v) => set({ listeners: p.listeners.map((x, idx) => (idx === i ? { ...x, port: v } : x)) })} />
              <SelectField label="Protocol" value={l.protocol} options={["HTTP", "HTTPS"]} onChange={(v) => set({ listeners: p.listeners.map((x, idx) => (idx === i ? { ...x, protocol: v as "HTTP" | "HTTPS" } : x)) })} />
            </div>
          </ListItem>
        ))}
      </ListSection>
    </div>
  );
}

function RdsForm({ node, onChange }: { node: RdsInstanceNode; onChange: (ir: IRNode) => void }) {
  const set = (p: Partial<RdsInstanceNode["properties"]>) =>
    onChange({ ...node, properties: { ...node.properties, ...p } });
  const p = node.properties;
  return (
    <div className="space-y-3">
      <SelectField label="Engine" value={p.engine} options={["postgres", "mysql", "mariadb"]} onChange={(v) => set({ engine: v as RdsInstanceNode["properties"]["engine"] })} />
      <TextField label="Engine version" mono value={p.engineVersion} onChange={(v) => set({ engineVersion: v })} />
      <TextField label="Instance class" mono value={p.instanceClass} onChange={(v) => set({ instanceClass: v })} />
      <NumberField label="Storage (GB)" min={20} value={p.allocatedStorageGb} onChange={(v) => set({ allocatedStorageGb: v })} />
      <ToggleField label="Storage encrypted" value={p.storageEncrypted} onChange={(v) => set({ storageEncrypted: v })} />
      <ToggleField label="Publicly accessible" value={p.publiclyAccessible} onChange={(v) => set({ publiclyAccessible: v })} />
      <ToggleField label="Multi-AZ" value={p.multiAz} onChange={(v) => set({ multiAz: v })} />
    </div>
  );
}

function S3Form({ node, onChange }: { node: S3BucketNode; onChange: (ir: IRNode) => void }) {
  const set = (p: Partial<S3BucketNode["properties"]>) =>
    onChange({ ...node, properties: { ...node.properties, ...p } });
  const p = node.properties;
  return (
    <div className="space-y-3">
      <SelectField label="Encryption" value={p.encryption} options={["AES256", "aws:kms", "none"]} onChange={(v) => set({ encryption: v as S3BucketNode["properties"]["encryption"] })} />
      <ToggleField label="Versioning" value={p.versioningEnabled} onChange={(v) => set({ versioningEnabled: v })} />
      <ToggleField label="Block public access" value={p.blockPublicAccess} onChange={(v) => set({ blockPublicAccess: v })} />
    </div>
  );
}

function IamForm({ node, onChange }: { node: IamRoleNode; onChange: (ir: IRNode) => void }) {
  const p = node.properties;
  const set = (patch: Partial<IamRoleNode["properties"]>) =>
    onChange({ ...node, properties: { ...p, ...patch } });
  return (
    <div className="space-y-4">
      <TextField label="Assume-role service" mono value={p.assumeRoleService} onChange={(v) => set({ assumeRoleService: v })} />
      <ListSection
        title="Policy statements"
        addLabel="statement"
        onAdd={() =>
          set({
            statements: [
              ...p.statements,
              { effect: "Allow", actions: ["s3:GetObject"], resources: ["arn:aws:s3:::my-bucket/*"] },
            ],
          })
        }
      >
        {p.statements.map((s, i) => (
          <ListItem key={i} onRemove={() => set({ statements: p.statements.filter((_, idx) => idx !== i) })}>
            <SelectField label="Effect" value={s.effect} options={["Allow", "Deny"]} onChange={(v) => set({ statements: p.statements.map((x, idx) => (idx === i ? { ...x, effect: v as "Allow" | "Deny" } : x)) })} />
            <TextField label="Actions (comma-separated)" mono value={csv(s.actions)} onChange={(v) => set({ statements: p.statements.map((x, idx) => (idx === i ? { ...x, actions: uncsv(v) } : x)) })} />
            <TextField label="Resources (comma-separated)" mono value={csv(s.resources)} onChange={(v) => set({ statements: p.statements.map((x, idx) => (idx === i ? { ...x, resources: uncsv(v) } : x)) })} />
          </ListItem>
        ))}
      </ListSection>
    </div>
  );
}
