"use client";

import type { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: "primary" | "tertiary" | "error" | "secondary";
  subtitle?: string;
}

const colorMap: Record<string, { iconBg: string; iconText: string; valueText: string }> = {
  primary: {
    iconBg: "bg-primary-container",
    iconText: "text-primary",
    valueText: "text-primary",
  },
  tertiary: {
    iconBg: "bg-tertiary-container",
    iconText: "text-tertiary",
    valueText: "text-tertiary",
  },
  error: {
    iconBg: "bg-error-container",
    iconText: "text-error",
    valueText: "text-error",
  },
  secondary: {
    iconBg: "bg-secondary-container",
    iconText: "text-secondary",
    valueText: "text-secondary",
  },
};

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: SummaryCardProps) {
  const colors = colorMap[color] || colorMap.primary;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.iconBg} ${colors.iconText}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label-sm font-bold text-on-surface-variant">{title}</p>
        <p className={`truncate text-tabular-nums font-bold ${colors.valueText}`}>
          {value}
        </p>
        {subtitle && (
          <p className="text-label-sm text-outline">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
