"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "./MaterialSymbol";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transaksi", icon: "receipt_long" },
  { href: "/accounts", label: "Akun", icon: "account_balance_wallet" },
  { href: "/budgets", label: "Anggaran", icon: "account_balance" },
  { href: "/transfers", label: "Transfer", icon: "swap_horiz" },
  { href: "/reports", label: "Laporan", icon: "analytics" },
  { href: "/categories", label: "Kategori", icon: "category" },
  { href: "/settings", label: "Setelan", icon: "settings" },
];

const MAX_VISIBLE = 4;

function isActiveItem(href: string, pathname: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function getPriorityOrder(pathname: string) {
  const alwaysShow = ["/", "/accounts", "/budgets", "/reports", "/settings"];
  const scored = NAV_ITEMS.map((item) => {
    let score = 0;
    if (alwaysShow.includes(item.href)) score += 10;
    if (isActiveItem(item.href, pathname)) score += 5;
    return { ...item, score };
  });
  return scored.sort((a, b) => b.score - a.score);
}

export default function BottomNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  const ordered = getPriorityOrder(pathname);
  const visibleItems = ordered.slice(0, MAX_VISIBLE);
  const moreItems = ordered.filter(
    (item) => !visibleItems.some((v) => v.href === item.href)
  );

  useEffect(() => {
    if (!showMore) return;
    const handleClick = (e: MouseEvent) => {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMore]);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  return (
    <>
      <nav className="fixed bottom-0 left-0 z-40 flex h-[60px] w-full items-center justify-around border-t border-outline-variant bg-surface-container-low px-1 lg:hidden safe-area-bottom">
        {visibleItems.map((item) => {
          const active = isActiveItem(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[11px] leading-tight transition-colors active:scale-95 ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <MaterialSymbol icon={item.icon} fill={active} size={22} />
              <span className="truncate max-w-full text-center">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setShowMore(true)}
          className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-1.5 text-[11px] leading-tight transition-colors active:scale-95 ${
            showMore ? "text-primary" : "text-on-surface-variant"
          }`}
        >
          <MaterialSymbol icon={showMore ? "close" : "more_horiz"} size={22} />
          <span className="truncate max-w-full text-center">Lainnya</span>
        </button>
      </nav>

      {showMore && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm lg:hidden">
          <div
            ref={sheetRef}
            className="w-full max-w-md rounded-t-2xl bg-surface-container-low px-4 pb-8 pt-4 shadow-xl animate-slide-up"
          >
            <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-outline-variant" />
            <p className="mb-4 text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider px-2">
              Menu Lainnya
            </p>
            <div className="grid grid-cols-4 gap-3">
              {ordered.map((item) => {
                const active = isActiveItem(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMore(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-[11px] leading-tight transition-colors active:scale-95 ${
                      active
                        ? "bg-primary-container text-on-primary-container"
                        : "text-on-surface-variant hover:bg-surface-container-highest"
                    }`}
                  >
                    <MaterialSymbol icon={item.icon} fill={active} size={24} />
                    <span className="truncate max-w-full">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
