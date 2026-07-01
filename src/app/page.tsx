"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getTransactions,
  getCategories,
  getSettings,
  getAccounts,
  getCategoryById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  addTransfer,
  getTransfers,
  deleteTransfer,
  updateAccount,
  deleteAccount,
} from "@/lib/store";
import {
  formatCurrency,
  getCurrentMonth,
  formatDateShort,
  getMonthRange,
  calculateMonthlySummaries,
  getCurrencySymbol,
  formatNumberInput,
  parseNumberInput,
  getAccountTypeLabel,
  getAccountTypeColor,
} from "@/lib/utils";
import { type Transaction, type Category, type AppSettings, type Account, type AccountType } from "@/lib/types";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import EmptyState from "@/components/EmptyState";
import TransactionForm from "@/components/TransactionForm";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

function formatShortCurrency(value: number): string {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}M`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
  return value.toString();
}

function getMonthLabel(month: string): string {
  const date = new Date(month + "-01");
  return date.toLocaleDateString("id-ID", { month: "short" }).toUpperCase();
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: "system",
    currency: "IDR",
    defaultCategoryId: "",
    language: "id",
  });
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [transferDisplayItems, setTransferDisplayItems] = useState<Transaction[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [recentSort, setRecentSort] = useState<string>("date_desc");
  const [hideBalances, setHideBalances] = useState(false);
  const [loading, setLoading] = useState(true);

  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteAccountName, setDeleteAccountName] = useState("");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editAccountData, setEditAccountData] = useState<Account | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("cash");
  const [formBalance, setFormBalance] = useState("");
  const [formColor, setFormColor] = useState("#22c55e");
  const [formIcon, setFormIcon] = useState("wallet");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const COLORS = [
    "#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#ec4899", "#f97316", "#10b981", "#6366f1",
    "#6b7280",
  ];

  const ACCOUNT_ICONS = ["wallet", "bank", "credit-card", "piggy-bank", "landmark", "banknote", "trending-up", "folder"];
  const ACCOUNT_TYPE_ICONS: Record<string, string> = {
    cash: "wallet",
    bank: "bank",
    card: "credit-card",
    "e-wallet": "smartphone",
    investment: "trending-up",
    savings: "piggy-bank",
    other: "folder",
  };
  const ACCOUNT_TYPES: { value: AccountType; label: string }[] = [
    { value: "cash", label: "Tunai" },
    { value: "bank", label: "Bank" },
    { value: "card", label: "Kartu" },
    { value: "e-wallet", label: "E-Wallet" },
    { value: "investment", label: "Investasi" },
    { value: "savings", label: "Tabungan" },
    { value: "other", label: "Lainnya" },
  ];

  useEffect(() => {
    setHideBalances(localStorage.getItem("hideBalances") === "true");
  }, []);

  useEffect(() => {
    if (!openMenuId) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openMenuId]);

  const toggleHideBalances = () => {
    setHideBalances((prev) => {
      const next = !prev;
      localStorage.setItem("hideBalances", String(next));
      return next;
    });
  };

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setAccounts(getAccounts());
    setSettings(getSettings());
    setTransferDisplayItems(
      getTransfers().flatMap((t) => {
        const accList = getAccounts();
        const fromAcc = accList.find((a) => a.id === t.fromAccountId);
        const toAcc = accList.find((a) => a.id === t.toAccountId);
        const label = `Transfer: ${fromAcc?.name || "?"} → ${toAcc?.name || "?"}`;
        return [
          {
            id: `transfer_out_${t.id}`, type: "expense" as const, amount: t.amount,
            categoryId: "__transfer__", note: t.note || label,
            transactionDate: t.transactionDate, accountId: t.fromAccountId,
            createdAt: t.createdAt, updatedAt: t.updatedAt,
          },
          {
            id: `transfer_in_${t.id}`, type: "income" as const, amount: t.amount,
            categoryId: "__transfer__", note: t.note || label,
            transactionDate: t.transactionDate, accountId: t.toAccountId,
            createdAt: t.createdAt, updatedAt: t.updatedAt,
          },
        ];
      })
    );
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      setLoading(false);
    });
  }, [loadData]);

  const handleAddTransaction = (data: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    note: string;
    transactionDate: string;
    accountId?: string;
  }) => {
    addTransaction(data);
    setShowForm(false);
    loadData();
    showToast("Transaksi berhasil ditambahkan");
  };

  const handleOpenEdit = (t: Transaction) => {
    if (t.id.startsWith("transfer_")) return;
    setEditTransaction(t);
    setShowForm(true);
  };

  const handleUpdateTransaction = (data: {
    type: "income" | "expense";
    amount: number;
    categoryId: string;
    note: string;
    transactionDate: string;
    accountId?: string;
  }) => {
    if (editTransaction) {
      updateTransaction(editTransaction.id, data);
      setEditTransaction(null);
      setShowForm(false);
      loadData();
      showToast("Transaksi berhasil diperbarui");
    }
  };

  const handleDelete = (id: string) => {
    if (id.startsWith("transfer_")) {
      const transferId = id.replace(/^transfer_(out|in)_/, "");
      deleteTransfer(transferId);
      showToast("Transfer berhasil dihapus");
    } else {
      deleteTransaction(id);
      showToast("Transaksi berhasil dihapus");
    }
    loadData();
  };

  const openEditAccount = (acc: Account) => {
    setEditAccountData(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(acc.balance.toString());
    setFormColor(acc.color);
    setFormIcon(acc.icon);
    setFormErrors({});
    setShowAccountForm(true);
    setOpenMenuId(null);
  };

  const handleAccountSubmit = () => {
    const errs: Record<string, string> = {};
    if (!formName.trim()) errs.name = "Nama akun wajib diisi";
    const bal = parseFloat(formBalance);
    if (isNaN(bal) || bal < 0) errs.balance = "Saldo harus angka valid";
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (editAccountData) {
      updateAccount(editAccountData.id, {
        name: formName.trim(),
        type: formType,
        balance: parseFloat(formBalance) || 0,
        color: formColor,
        icon: formIcon,
        isActive: true,
      });
      showToast("Akun berhasil diperbarui");
    }

    setShowAccountForm(false);
    setEditAccountData(null);
    loadData();
  };

  const handleAddTransfer = (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note: string;
    transactionDate: string;
  }) => {
    addTransfer(data);
    setShowForm(false);
    loadData();
    showToast("Transfer berhasil ditambahkan");
  };

  const now = new Date();
  const currentMonth = getCurrentMonth();
  const monthRange = getMonthRange(6);
  const monthlySummaries = calculateMonthlySummaries(transactions, monthRange);

  const totalWealth = accounts.reduce((sum, a) => sum + a.balance, 0);

  const lastSummary = monthlySummaries[monthlySummaries.length - 1];
  const monthlyIncome = lastSummary?.income || 0;
  const monthlyExpense = lastSummary?.expense || 0;

  const sortedAll = [...transactions, ...transferDisplayItems].sort((a, b) => {
    let cmp: number;
    switch (recentSort) {
      case "date_asc":
        cmp = a.transactionDate.localeCompare(b.transactionDate);
        break;
      case "amount_desc":
        cmp = b.amount - a.amount;
        break;
      case "amount_asc":
        cmp = a.amount - b.amount;
        break;
      default:
        cmp = b.transactionDate.localeCompare(a.transactionDate);
    }
    if (cmp === 0) cmp = b.createdAt.localeCompare(a.createdAt);
    return cmp;
  });
  const recentTransactions = sortedAll.slice(0, 5);

  const maxChartVal = Math.max(
    ...monthlySummaries.map((s) => Math.max(s.income, s.expense)),
    1
  );
  const yTicks = 4;
  const tickStep = Math.max(Math.ceil(maxChartVal / yTicks / 1000000), 1) * 1000000;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => i * tickStep);

  const maxIncomeInRange = Math.max(...monthlySummaries.map((s) => s.income), 1);
  const incomeBarPct = maxIncomeInRange > 0 ? (monthlyIncome / maxIncomeInRange) * 100 : 0;
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : 0;

  const activeAccounts = accounts.filter((a) => a.isActive);
  const inactiveAccounts = accounts.filter((a) => !a.isActive);
  const allAccounts = [...activeAccounts, ...inactiveAccounts];

  return (
    <div className="mx-auto w-full max-w-container-max space-y-stack-lg">
      {loading && (
        <div className="space-y-stack-lg pb-24">
          <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-20 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-stack-md">
            <Skeleton className="h-[160px] md:col-span-1" />
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
              <Skeleton className="h-[140px]" />
              <Skeleton className="h-[140px]" />
            </div>
          </div>
          <Skeleton className="h-12" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[130px]" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64 lg:col-span-1" />
          </div>
        </div>
      )}
      {!loading && (<>
      <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface lg:bg-surface-container-lowest lg:dark:bg-inverse-surface">
        <div className="min-w-0 flex-1">
          <h1 className="text-label-md sm:text-headline-md font-bold text-on-surface dark:text-primary-fixed truncate">
            Dashboard
          </h1>
          <p className="text-[11px] sm:text-label-sm text-on-surface-variant truncate">
            {now.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleHideBalances}
            className="flex items-center justify-center rounded-xl border border-outline-variant p-2 sm:px-3 sm:py-2.5 text-on-surface-variant hover:bg-surface-container-highest transition-all active:scale-95"
            title={hideBalances ? "Tampilkan Saldo" : "Sembunyikan Saldo"}
          >
            <MaterialSymbol icon={hideBalances ? "visibility_off" : "visibility"} size={20} />
          </button>
          <button
            onClick={() => {
              setEditTransaction(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 sm:px-5 sm:py-2.5 text-label-sm sm:text-label-md font-medium text-on-primary shadow-sm transition-all hover:bg-primary-container hover:text-on-primary-container active:scale-95"
          >
            <MaterialSymbol icon="add" size={18} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-stack-md">
        <div className="md:col-span-1 bg-primary-container p-4 sm:p-gutter rounded-xl text-on-primary-container flex flex-col justify-between relative overflow-hidden shadow-sm min-h-[160px] sm:min-h-0">
          <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-10 pointer-events-none">
            <MaterialSymbol icon="account_balance_wallet" size={60} />
          </div>
          <div>
            <p className="text-[11px] sm:text-label-sm font-bold opacity-80 uppercase tracking-wider">
              Total Kekayaan
            </p>
            <p className={`text-headline-md sm:text-headline-lg text-tabular-nums font-bold mt-1 ${totalWealth < 0 ? 'text-error' : ''}`}>
              {hideBalances ? "****" : formatCurrency(totalWealth, settings.currency)}
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-1.5 pt-4 sm:pt-8">
            {activeAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => router.push(`/transactions?accountId=${acc.id}`)}
                className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-label-sm font-medium backdrop-blur-sm hover:bg-white/40 transition-all"
              >
                <Icon name={acc.icon} size={10} />
                {acc.name}: <span className={acc.balance < 0 ? 'text-error' : ''}>{hideBalances ? "****" : formatCurrency(acc.balance, settings.currency)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-stack-md">
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-gutter rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-stack-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                <MaterialSymbol icon="south_west" />
              </div>
              <div>
                <p className="text-label-sm font-bold text-on-surface-variant uppercase">
                  Pemasukan Bulan Ini
                </p>
                <p className="text-headline-md text-tabular-nums text-tertiary">
                  {hideBalances ? "****" : formatCurrency(monthlyIncome, settings.currency)}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(incomeBarPct, 100)}%` }}
              />
            </div>
            <p className="text-label-sm text-on-surface-variant mt-2">
              {Math.round(Math.min(incomeBarPct, 100))}% dari pemasukan rata-rata
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant/30 p-gutter rounded-xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-stack-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error">
                <MaterialSymbol icon="north_east" />
              </div>
              <div>
                <p className="text-label-sm font-bold text-on-surface-variant uppercase">
                  Pengeluaran Bulan Ini
                </p>
                <p className="text-headline-md text-tabular-nums text-error">
                  {hideBalances ? "****" : formatCurrency(monthlyExpense, settings.currency)}
                </p>
              </div>
            </div>
            <div className="mt-4 w-full bg-surface-container-low h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-error h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(expenseRatio, 100)}%` }}
              />
            </div>
            <p className="text-label-sm text-on-surface-variant mt-2">
              {Math.round(Math.min(expenseRatio, 100))}% dari pemasukan bulan ini
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-4 sm:px-5 py-3 shadow-sm">
        <span className="text-label-sm font-bold text-on-surface-variant">Total Transaksi</span>
        <span className="text-tabular-nums font-bold text-on-surface">{transactions.length}</span>
      </div>

      <section>
        <div className="flex items-end justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-label-md sm:text-headline-md font-bold text-on-surface">Akun Saya</h2>
            <p className="text-label-sm sm:text-body-md text-on-surface-variant truncate">
              Kelola dana di berbagai platform
            </p>
          </div>
          <a
            href="/accounts"
            className="text-primary text-label-xs sm:text-label-md hover:underline shrink-0 ml-2"
          >
            Lihat Semua
          </a>
        </div>
        {allAccounts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-stack-md">
            {allAccounts.map((acc) => (
              <div
                key={acc.id}
                onClick={() => router.push(`/transactions?accountId=${acc.id}`)}
                className={`rounded-xl border p-4 transition-shadow hover:shadow-md cursor-pointer ${
                  acc.isActive ? "" : "border-dashed opacity-50"
                }`}
                style={{
                  backgroundColor: acc.color + "0d",
                  borderColor: acc.color + "30",
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: acc.color + "20", color: acc.color }}
                  >
                    <Icon name={acc.icon} size={20} />
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === acc.id ? null : acc.id);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-outline hover:bg-surface-container-higher hover:text-on-surface-variant transition-colors"
                    >
                      <MaterialSymbol icon="more_vert" size={18} />
                    </button>
                    {openMenuId === acc.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest py-1 shadow-lg"
                      >
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEditAccount(acc); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container-higher transition-colors"
                        >
                          <MaterialSymbol icon="edit" size={16} />
                          Edit Akun
                        </button>
                        <button
                          type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAccount(acc.id, { isActive: !acc.isActive });
                              loadData();
                              setOpenMenuId(null);
                              showToast(acc.isActive ? "Akun dinonaktifkan" : "Akun diaktifkan");
                            }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-label-md text-on-surface hover:bg-surface-container-higher transition-colors"
                        >
                          <MaterialSymbol icon={acc.isActive ? "visibility_off" : "visibility"} size={16} />
                          {acc.isActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteAccountId(acc.id);
                            setDeleteAccountName(acc.name);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-label-md text-error hover:bg-error/10 transition-colors"
                        >
                          <MaterialSymbol icon="delete" size={16} />
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-label-sm font-bold text-on-surface-variant">
                  {acc.name}
                </p>
                <p className={`text-tabular-nums font-bold text-lg ${acc.balance < 0 ? 'text-error' : 'text-on-surface'}`}>
                  {hideBalances ? "****" : formatCurrency(acc.balance, settings.currency)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-body-md text-on-surface-variant">Belum ada akun</p>
        )}
        {inactiveAccounts.length > 0 && (
          <p className="mt-2 text-label-sm text-on-surface-variant">
            {inactiveAccounts.length} akun nonaktif
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
        {monthlySummaries.some((m) => m.income > 0 || m.expense > 0) && (
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/30 p-4 sm:p-gutter rounded-xl shadow-sm overflow-x-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-8">
              <h3 className="text-label-md sm:text-headline-md font-bold text-on-surface">
                Trend Keuangan
              </h3>
              <div className="flex items-center gap-3 sm:gap-4 text-label-xs sm:text-label-sm uppercase tracking-wide">
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-primary" />
                  Pemasukan
                </span>
                <span className="flex items-center gap-1 sm:gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-error" />
                  Pengeluaran
                </span>
              </div>
            </div>
            <div className="h-48 sm:h-64 relative flex items-end justify-between px-2 gap-2 sm:gap-4">
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[9px] sm:text-[10px] text-outline pointer-events-none pb-4 sm:pb-6">
                {yLabels
                  .slice()
                  .reverse()
                  .map((val, i) => (
                    <span key={i}>{formatShortCurrency(val)}</span>
                  ))}
              </div>
              <div className="flex-1 h-full ml-8 sm:ml-10 flex justify-around items-end">
                {monthlySummaries.map((m, i) => {
                  const incomeH = maxChartVal > 0 ? (m.income / maxChartVal) * 100 : 0;
                  const expenseH = maxChartVal > 0 ? (m.expense / maxChartVal) * 100 : 0;
                  const isCurrent = i === monthlySummaries.length - 1;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1 w-full max-w-[28px] sm:max-w-[40px]"
                    >
                      <div className="flex gap-0.5 sm:gap-1 items-end h-36 sm:h-48 w-full">
                        <div
                          className="bg-primary/80 rounded-t w-1/2 transition-all duration-700 hover:bg-primary cursor-help"
                          style={{ height: `${Math.max(incomeH, 1)}%` }}
                          title={`Pemasukan: ${hideBalances ? "****" : formatCurrency(m.income, settings.currency)}`}
                        />
                        <div
                          className="bg-error/80 rounded-t w-1/2 transition-all duration-700 hover:bg-error cursor-help"
                          style={{ height: `${Math.max(expenseH, 1)}%` }}
                          title={`Pengeluaran: ${hideBalances ? "****" : formatCurrency(m.expense, settings.currency)}`}
                        />
                      </div>
                      <span
                        className={`text-[9px] sm:text-[10px] text-outline mt-1 sm:mt-2 ${
                          isCurrent ? "font-bold text-primary" : ""
                        }`}
                      >
                        {getMonthLabel(m.month)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="lg:col-span-1 bg-surface-container-lowest border border-outline-variant/30 p-4 sm:p-gutter rounded-xl shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
            <h3 className="text-label-md sm:text-headline-md font-bold text-on-surface truncate">
              Transaksi Terakhir
            </h3>
            <select
              value={recentSort}
              onChange={(e) => setRecentSort(e.target.value)}
              className="rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1.5 text-[11px] sm:text-label-sm text-on-surface-variant outline-none focus:border-primary shrink-0"
            >
              <option value="date_desc">Terbaru</option>
              <option value="date_asc">Terlama</option>
              <option value="amount_desc">Tertinggi</option>
              <option value="amount_asc">Terendah</option>
            </select>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="flex-1">
              <EmptyState
                title="Belum ada transaksi"
                description="Mulai catat keuanganmu sekarang"
                action={{
                  label: "+ Tambah Transaksi",
                  onClick: () => setShowForm(true),
                }}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-1">
                {recentTransactions.map((t) => {
                  const cat = getCategoryById(t.categoryId);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-4 group cursor-pointer hover:bg-surface-container-low p-2 -mx-2 rounded-lg transition-colors"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                          t.type === "income"
                            ? "bg-tertiary/10 text-tertiary"
                            : "bg-error/10 text-error"
                        }`}
                      >
                        <Icon name={cat?.icon || (t.type === "income" ? "south_west" : "north_east")} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md font-medium truncate text-on-surface">
                          {t.note || cat?.name || "Tanpa Kategori"}
                        </p>
                        <p className="text-label-sm text-on-surface-variant">
                          {cat?.name || "Tanpa Kategori"} &bull; {formatDateShort(t.transactionDate)}
                        </p>
                      </div>
                      <p
                        className={`text-tabular-nums font-bold whitespace-nowrap text-right ${
                          t.type === "income" ? "text-tertiary" : "text-error"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {hideBalances ? "****" : formatCurrency(t.amount, settings.currency)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <a
                href="/transactions"
                className="mt-6 w-full block text-center py-3 border border-outline-variant text-primary rounded-xl text-label-md font-medium hover:bg-surface-container-low transition-colors"
              >
                Lihat Semua Riwayat
              </a>
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditTransaction(null);
        }}
        title={editTransaction ? "Edit Transaksi" : "Tambah Transaksi"}
      >
        <TransactionForm
          categories={categories}
          initialData={editTransaction}
          onSubmit={editTransaction ? handleUpdateTransaction : handleAddTransaction}
          onAddTransfer={handleAddTransfer}
          onCancel={() => {
            setShowForm(false);
            setEditTransaction(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteAccountId !== null}
        title="Hapus Akun"
        message={`Hapus akun "${deleteAccountName}"? Semua data terkait akan dihapus.`}
        onConfirm={() => {
          if (deleteAccountId) {
            deleteAccount(deleteAccountId);
            loadData();
            showToast("Akun berhasil dihapus");
          }
          setDeleteAccountId(null);
          setDeleteAccountName("");
        }}
        onCancel={() => {
          setDeleteAccountId(null);
          setDeleteAccountName("");
        }}
      />

      <Modal
        isOpen={showAccountForm}
        onClose={() => {
          setShowAccountForm(false);
          setEditAccountData(null);
        }}
        title="Edit Akun"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Nama Akun</label>
            <input
              type="text"
              placeholder="Nama akun"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
                formErrors.name ? "border-error" : "border-outline-variant"
              }`}
            />
            {formErrors.name && <p className="mt-1 text-label-sm text-error">{formErrors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Tipe Akun</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setFormType(t.value);
                    setFormIcon(ACCOUNT_TYPE_ICONS[t.value] || "folder");
                    setFormColor(getAccountTypeColor(t.value));
                  }}
                  className={`rounded-xl py-2.5 text-xs font-medium transition-all ${
                    formType === t.value
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Saldo Saat Ini</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-label-md font-semibold text-on-surface-variant">
                {getCurrencySymbol(settings.currency)}
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumberInput(formBalance)}
                onChange={(e) => setFormBalance(parseNumberInput(e.target.value))}
                className={`w-full bg-surface-container-low border rounded-xl py-3 pl-12 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
                  formErrors.balance ? "border-error" : "border-outline-variant"
                }`}
              />
            </div>
            {formErrors.balance && <p className="mt-1 text-label-sm text-error">{formErrors.balance}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Warna</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`h-9 w-9 sm:h-8 sm:w-8 rounded-xl transition-all ${
                    formColor === c
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Ikon</label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormIcon(iconName)}
                  className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${
                    formIcon === iconName
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  <Icon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAccountForm(false);
                setEditAccountData(null);
              }}
              className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleAccountSubmit}
              className="flex-1 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              Simpan
            </button>
          </div>
        </div>
      </Modal>
      </>)}
    </div>
  );
}
