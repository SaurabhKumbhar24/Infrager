"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  // Portal target only exists client-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  // Portaled to <body>: an ancestor with a CSS transform (e.g. a card's
  // hover lift) would otherwise become the containing block for
  // position:fixed and trap the overlay inside it.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-xl border border-sandstone bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-muted">{body}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="h-9 rounded-lg border border-sandstone px-4 text-sm font-medium hover:bg-sand"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="h-9 rounded-lg bg-destructive px-4 text-sm font-semibold text-paper hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
