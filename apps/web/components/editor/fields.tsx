"use client";

/** Small form primitives for the inspector, styled per the design system. */

const inputClass =
  "h-8 w-full rounded-lg border border-sandstone bg-sand/60 px-2.5 text-[13px] text-ink focus:outline-none focus:border-cobalt focus:ring-[3px] focus:ring-cobalt/15";

export function TextField({
  label,
  value,
  onChange,
  mono = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        className={`${inputClass} ${mono ? "mono" : ""}`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <input
        className={`${inputClass} mono`}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ToggleField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between gap-3 py-0.5 text-left"
      title={hint}
    >
      <span className="text-[13px] font-medium">{label}</span>
      <span
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-cobalt" : "bg-sandstone-deep"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-paper transition-transform ${
            value ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function ListSection({
  title,
  onAdd,
  addLabel,
  children,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="label text-muted">{title}</span>
        <button
          type="button"
          onClick={onAdd}
          className="text-xs font-medium text-cobalt hover:underline"
        >
          + {addLabel}
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function ListItem({
  onRemove,
  children,
}: {
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-lg border border-sandstone p-3">
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 text-xs text-muted hover:text-destructive"
        title="Remove"
      >
        ✕
      </button>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
