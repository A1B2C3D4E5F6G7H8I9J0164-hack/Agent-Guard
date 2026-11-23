"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, AlertOctagon, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  warningNote?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  warningNote,
  confirmLabel = "Confirm change",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md bg-[#0F1622] border border-[#1E293B] rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150"
      >
        {/* Header with icon */}
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center border ${
              isDanger
                ? "bg-red-500/15 border-red-500/30 text-red-400"
                : "bg-amber-500/15 border-amber-500/30 text-amber-400"
            }`}
          >
            {isDanger ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-bold text-white font-sans"
            >
              {title}
            </h2>
            <p className="text-sm text-slate-300 font-sans leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Warning callout note */}
        {warningNote && (
          <div
            className={`p-3 rounded-lg text-xs font-sans leading-relaxed border ${
              isDanger
                ? "bg-red-500/10 border-red-500/25 text-red-300"
                : "bg-amber-500/10 border-amber-500/25 text-amber-300"
            }`}
          >
            {warningNote}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-[#182335] hover:bg-[#1E293B] text-slate-300 text-sm font-sans transition-colors focus-ring"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-semibold font-sans transition-all focus-ring ${
              isDanger
                ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40"
                : "bg-amber-600 hover:bg-amber-500 text-black font-bold"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
