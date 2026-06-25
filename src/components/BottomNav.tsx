"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LuLayoutDashboard,
  LuArrowLeftRight,
  LuTags,
  LuChartBar,
  LuSettings,
  LuWallet,
  LuTarget,
  LuRepeat2,
} from "react-icons/lu";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LuLayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: LuArrowLeftRight },
  { href: "/accounts", label: "Akun", icon: LuWallet },
  { href: "/budgets", label: "Anggaran", icon: LuTarget },
  { href: "/transfers", label: "Transfer", icon: LuRepeat2 },
  { href: "/reports", label: "Laporan", icon: LuChartBar },
  { href: "/categories", label: "Kategori", icon: LuTags },
  { href: "/settings", label: "Setelan", icon: LuSettings },
];

const MAX_VISIBLE = 5;

function getPriorityItems(pathname: string) {
  // Always show the active page and Dashboard
  const alwaysShow = ["/", "/accounts", "/budgets", "/reports", "/settings"];
  const priorityItems = NAV_ITEMS.filter(
    (item) => alwaysShow.includes(item.href) || item.href === pathname || pathname.startsWith(item.href)
  );
  // Deduplicate and limit
  const seen = new Set<string>();
  return priorityItems.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).slice(0, MAX_VISIBLE);
}

export default function BottomNav() {
  const pathname = usePathname();

  const visibleItems = getPriorityItems(pathname);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/95 dark:supports-[backdrop-filter]:bg-zinc-900/80 lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1">
        {visibleItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
