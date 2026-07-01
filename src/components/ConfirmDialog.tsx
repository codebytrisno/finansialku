"use client";

import { useEffect, useRef } from "react";
import { MaterialSymbol } from "./MaterialSymbol";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Hapus",
  cancelLabel = "Batal",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
    >
      <div
        className="w-full max-w-sm animate-pop-up rounded-2xl bg-surface-container-low p-6 shadow-xl dark:bg-inverse-surface"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-container text-error">
            <MaterialSymbol icon="delete" size={24} />
          </div>
          <h3 className="text-headline-md font-bold text-on-surface dark:text-primary-fixed">
            {title}
          </h3>
          <p className="text-body-md text-on-surface-variant">
            {message}
          </p>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-error py-3 text-label-md font-semibold text-on-error shadow-sm hover:bg-error/90 transition-all active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
