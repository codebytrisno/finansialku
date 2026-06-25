"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  getCategories,
  getSettings,
  getAccounts,
  getTotalIncome,
  getTotalExpense,
  getBalance,
  getCategoryById,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "@/lib/store";
import {
  formatCurrency,
  getToday,
  getCurrentMonth,
  formatDateShort,
  getMonthRange,
  calculateMonthlySummaries,
} from "@/lib/utils";
import { type Transaction, type Category, type AppSettings, type Account } from "@/lib/types";
import { Icon } from "@/lib/icons";
import SummaryCard from "@/components/SummaryCard";
import { BarChart } from "@/components/Charts";
import EmptyState from "@/components/EmptyState";
import TransactionForm from "@/components/TransactionForm";
import Modal from "@/components/Modal";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuList,
  LuPlus,
  LuArrowRight,
  LuBuilding2,
  LuPiggyBank,
  LuCreditCard,
  LuWallet,
  LuEye,
  LuEyeOff,
} from "react-icons/lu";

export default function DashboardPage() {
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

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setAccounts(getAccounts());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    loadData();
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
  };

  const handleOpenEdit = (t: Transaction) => {
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
    }
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    loadData();
  };

  const now = new Date();
  const currentMonth = getCurrentMonth();
  const monthRange = getMonthRange(6);
  const monthlySummaries = calculateMonthlySummaries(transactions, monthRange);

  const income = getTotalIncome(transactions);
  const expense = getTotalExpense(transactions);
  const balance = getBalance(transactions);

  // Recent transactions (last 5)
  const recentTransactions = [...transactions]
    .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => {
            setEditTransaction(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <LuPlus size={18} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-emerald-100">Total Kekayaan</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(balance, settings.currency)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-100">Pemasukan</p>
            <p className="text-base font-bold">
              +{formatCurrency(income, settings.currency)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-emerald-100">Pengeluaran</p>
            <p className="text-base font-bold">
              -{formatCurrency(expense, settings.currency)}
            </p>
          </div>
        </div>
        {/* Account tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {accounts.filter(a => a.isActive).map((acc) => (
            <span
              key={acc.id}
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm"
            >
              <Icon name={acc.icon} size={10} />
              {acc.name}: {formatCurrency(acc.balance, settings.currency)}
            </span>
          ))}
        </div>
      </div>

      {/* Multi-Account Cards */}
      {accounts.filter(a => a.isActive).length > 1 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {accounts.filter(a => a.isActive).map((acc) => (
            <div
              key={acc.id}
              className="rounded-xl border border-zinc-200 bg-white p-3 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: acc.color + "20", color: acc.color }}
                >
                  <Icon name={acc.icon} size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    {acc.name}
                  </p>
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {formatCurrency(acc.balance, settings.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          title="Pemasukan Bulan Ini"
          value={formatCurrency(
            monthlySummaries[monthlySummaries.length - 1]?.income || 0,
            settings.currency
          )}
          icon={<LuTrendingUp size={22} />}
          color="emerald"
        />
        <SummaryCard
          title="Pengeluaran Bulan Ini"
          value={formatCurrency(
            monthlySummaries[monthlySummaries.length - 1]?.expense || 0,
            settings.currency
          )}
          icon={<LuTrendingDown size={22} />}
          color="red"
        />
        <SummaryCard
          title="Total Transaksi"
          value={transactions.length.toString()}
          icon={<LuList size={22} />}
          color="blue"
          subtitle="Semua waktu"
        />
      </div>

      {/* Monthly Chart */}
      {monthlySummaries.some((m) => m.income > 0 || m.expense > 0) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Grafik 6 Bulan
          </h2>
          <div className="flex items-end gap-3" style={{ height: 130 }}>
            {monthlySummaries.map((m, i) => {
              const maxVal = Math.max(
                ...monthlySummaries.map((s) => Math.max(s.income, s.expense)),
                1
              );
              return (
                <div key={i} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 100 }}>
                    <div
                      className="w-2.5 rounded-t-sm bg-emerald-400 transition-all"
                      style={{
                        height: `${(m.income / maxVal) * 100}%`,
                      }}
                    />
                    <div
                      className="w-2.5 rounded-t-sm bg-red-400 transition-all"
                      style={{
                        height: `${(m.expense / maxVal) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="mt-1 text-[10px] text-zinc-400">
                    {m.month.slice(-2)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Pemasukan
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Pengeluaran
            </span>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Transaksi Terbaru
          </h2>
          <a
            href="/transactions"
            className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
          >
            Lihat Semua
            <LuArrowRight size={14} />
          </a>
        </div>
        {recentTransactions.length === 0 ? (
          <EmptyState
            title="Belum ada transaksi"
            description="Mulai catat keuanganmu sekarang"
            action={{
              label: "+ Tambah Transaksi",
              onClick: () => setShowForm(true),
            }}
          />
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((t) => {
              const cat = getCategoryById(t.categoryId);
              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <Icon name={cat?.icon || "folder"} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {cat?.name || "Tanpa Kategori"}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {formatDateShort(t.transactionDate)}
                        {t.note && ` · ${t.note}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-bold ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {formatCurrency(t.amount, settings.currency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Form Modal */}
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
          onCancel={() => {
            setShowForm(false);
            setEditTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
}
