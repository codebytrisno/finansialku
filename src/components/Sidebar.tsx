"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialSymbol } from "./MaterialSymbol";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/transactions", label: "Transaksi", icon: "receipt_long" },
  { href: "/accounts", label: "Dompet & Rekening", icon: "account_balance_wallet" },
  { href: "/budgets", label: "Anggaran", icon: "account_balance" },
  { href: "/transfers", label: "Transfer & Berulang", icon: "swap_horiz" },
  { href: "/categories", label: "Kategori", icon: "category" },
  { href: "/reports", label: "Laporan", icon: "analytics" },
  { href: "/settings", label: "Setelan", icon: "settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] flex-col overflow-y-auto border-r border-outline-variant bg-surface-container-low p-gutter dark:bg-inverse-surface lg:flex">
      <div className="mb-stack-lg flex items-center gap-stack-xs">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary text-on-tertiary">
          <MaterialSymbol icon="wallet" />
        </div>
        <h1 className="text-headline-md font-bold text-on-surface dark:text-primary-fixed">
          FinansialKu
        </h1>
      </div>
      <nav className="flex flex-1 flex-col gap-stack-xs">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-stack-xs rounded-xl px-4 py-3 text-label-md font-medium transition-colors ${
                isActive
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-highest dark:hover:bg-secondary-container"
              }`}
            >
              <MaterialSymbol
                icon={item.icon}
                fill={isActive}
                className={isActive ? "fill" : ""}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-stack-xs pt-stack-md">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-label-md font-semibold text-on-primary">
          TS
        </div>
        <div>
          <p className="text-label-md font-bold text-on-surface dark:text-primary-fixed">
            Trisno Sanjaya
          </p>
          <p className="text-label-sm text-outline">Akun Saya</p>
        </div>
      </div>
    </aside>
  );
}
