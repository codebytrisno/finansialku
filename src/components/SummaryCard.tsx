"use client";

import { type ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: "emerald" | "red" | "blue" | "amber" | "purple";
  subtitle?: string;
}

const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-100 dark:bg-emerald-900/50",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    text: "text-red-700 dark:text-red-300",
    iconBg: "bg-red-100 dark:bg-red-900/50",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    text: "text-blue-700 dark:text-blue-300",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
  purple: {
    bg: "bg-purple-50 dark:bg-purple-950/30",
    text: "text-purple-700 dark:text-purple-300",
    iconBg: "bg-purple-100 dark:bg-purple-900/50",
  },
};

export default function SummaryCard({
  title,
  value,
  icon,
  color,
  subtitle,
}: SummaryCardProps) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 ${colors.bg}`}
    >
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${colors.iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </p>
        <p className={`truncate text-lg font-bold ${colors.text}`}>{value}</p>
        {subtitle && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
