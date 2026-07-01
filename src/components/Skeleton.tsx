import type { CSSProperties } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-high ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 sm:p-gutter ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 p-3 ${className}`}>
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-5 w-20" />
    </div>
  );
}

export function SkeletonChart({ className = "" }: { className?: string }) {
  const heights = [35, 55, 45, 70, 50, 80, 60, 90, 65, 40, 75, 55];
  return (
    <div className={`flex items-end justify-around gap-2 ${className}`}>
      {heights.map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}
