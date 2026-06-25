"use client";

import { type TransactionType } from "@/lib/types";

interface MiniChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export function BarChart({
  data,
  height = 120,
  color = "#10b981",
}: MiniChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / maxVal) * 100;
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-center justify-end"
          >
            <span className="mb-1 text-[10px] font-medium text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
              {d.value.toLocaleString()}
            </span>
            <div
              className="w-full rounded-t-md transition-all hover:opacity-80"
              style={{
                height: `${Math.max(h, 2)}%`,
                backgroundColor: color,
              }}
            />
            <span className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  totalLabel?: string;
}

export function DonutChart({
  data,
  size = 160,
  totalLabel,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div
        className="relative mx-auto flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <p className="text-sm font-bold text-zinc-400">0</p>
          {totalLabel && (
            <p className="text-xs text-zinc-400">{totalLabel}</p>
          )}
        </div>
      </div>
    );
  }

  // Precompute cumulative offsets for each segment
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;
  const segments = data.reduce<{ percentage: number; strokeLen: number; offset: number }[]>(
    (acc, d) => {
      const percentage = d.value / total;
      const strokeLen = percentage * circumference;
      const offset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].strokeLen : 0;
      acc.push({ percentage, strokeLen, offset });
      return acc;
    },
    []
  );

  return (
    <div
      className="relative mx-auto"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg, i) => {
          const rotation = (seg.offset / circumference) * 360;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={data[i].color}
              strokeWidth="14"
              strokeDasharray={`${seg.strokeLen} ${circumference - seg.strokeLen}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2}) rotate(${rotation} ${size / 2} ${size / 2})`}
              className="transition-all"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            {total.toLocaleString()}
          </p>
          {totalLabel && (
            <p className="text-xs text-zinc-500">{totalLabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface DonutLegendItem {
  categoryName: string;
  total: number;
  categoryColor: string;
  percentage: number;
  count: number;
}

interface DonutLegendProps {
  data: DonutLegendItem[];
  currencySymbol?: string;
}

export function DonutLegend({ data, currencySymbol = "Rp" }: DonutLegendProps) {
  if (data.length === 0) return null;

  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: d.categoryColor }}
          />
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {d.categoryName}
            </p>
            <p className="text-xs text-zinc-400">
              {d.count} transaksi
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {currencySymbol}
              {d.total.toLocaleString()}
            </p>
            <p className="text-xs text-zinc-400">{d.percentage}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
