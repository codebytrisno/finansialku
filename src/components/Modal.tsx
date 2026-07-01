"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MaterialSymbol } from "./MaterialSymbol";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-surface-container-low shadow-xl dark:bg-inverse-surface sm:mx-4 sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3 sm:px-5 sm:py-4">
          <h2 className="text-label-md sm:text-headline-md font-bold text-on-surface dark:text-primary-fixed truncate pr-2">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container-highest dark:hover:bg-[#3D4947]"
          >
            <MaterialSymbol icon="close" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">{children}</div>
      </div>
    </div>
  );
}
