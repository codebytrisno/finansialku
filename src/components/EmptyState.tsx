"use client";

import { MaterialSymbol } from "./MaterialSymbol";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-highest text-on-surface-variant">
        <MaterialSymbol icon="inbox" size={32} />
      </div>
      <h3 className="text-body-md font-semibold text-on-surface">{title}</h3>
      {description && (
        <p className="mt-1 max-w-xs text-label-md text-on-surface-variant">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-label-md font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:text-on-primary-container active:scale-95"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
