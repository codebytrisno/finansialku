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
  { href: "/accounts", label: "Dompet & Rekening", icon: LuWallet },
  { href: "/transactions", label: "Transaksi", icon: LuArrowLeftRight },
  { href: "/budgets", label: "Anggaran", icon: LuTarget },
  { href: "/transfers", label: "Transfer & Berulang", icon: LuRepeat2 },
  { href: "/categories", label: "Kategori", icon: LuTags },
  { href: "/reports", label: "Laporan", icon: LuChartBar },
  { href: "/settings", label: "Setelan", icon: LuSettings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <LuWallet size={20} />
        </div>
        <div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-zinc-50">
            FinansialKu
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Catatan Keuangan Pribadi
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          v1.0.0 &middot; Offline
        </p>
      </div>
    </aside>
  );
}
