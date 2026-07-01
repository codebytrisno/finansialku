"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  getCategories,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  filterTransactions,
  getSettings,
  addTransfer,
  getTransfers,
  deleteTransfer,
  getAccounts,
} from "@/lib/store";
import {
  type Transaction,
  type Category,
  type Account,
  type TransactionFilters,
  type AppSettings,
} from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import TransactionList from "@/components/TransactionList";
import TransactionForm from "@/components/TransactionForm";
import Modal from "@/components/Modal";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

const TRANSFER_CAT_ID = "__transfer__";
const TRANSFER_CAT: Category = {
  id: TRANSFER_CAT_ID,
  name: "Transfer",
  type: "expense",
  color: "#8b5cf6",
  icon: "swap_horiz",
  parentId: null,
  createdAt: "",
  updatedAt: "",
};

const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  categoryId: "",
  accountId: "",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDirection: "desc",
};

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", currency: "IDR", defaultCategoryId: "", language: "id" });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferItems, setTransferItems] = useState<Transaction[]>([]);

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setSettings(getSettings());
    setAccounts(getAccounts());
    setTransferItems(
      getTransfers().flatMap((t) => {
        const accounts = getAccounts();
        const fromAcc = accounts.find((a) => a.id === t.fromAccountId);
        const toAcc = accounts.find((a) => a.id === t.toAccountId);
        const label = `Transfer: ${fromAcc?.name || "?"} → ${toAcc?.name || "?"}`;
        return [
          {
            id: `transfer_out_${t.id}`,
            type: "expense" as const,
            amount: t.amount,
            categoryId: TRANSFER_CAT_ID,
            note: t.note || label,
            transactionDate: t.transactionDate,
            accountId: t.fromAccountId,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          },
          {
            id: `transfer_in_${t.id}`,
            type: "income" as const,
            amount: t.amount,
            categoryId: TRANSFER_CAT_ID,
            note: t.note || label,
            transactionDate: t.transactionDate,
            accountId: t.toAccountId,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
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
    const params = new URLSearchParams(window.location.search);
    const accountId = params.get("accountId");
    if (accountId) {
      setFilters((prev) => ({ ...prev, accountId }));
    }
  }, [loadData]);

  const allTransactions = [...transactions, ...transferItems];

  const allCategories = [...categories, TRANSFER_CAT];

  const filtered = filterTransactions(allTransactions, filters);

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const handleAdd = (data: {
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

  const handleEdit = (t: Transaction) => {
    if (t.id.startsWith("transfer_")) return;
    setEditTransaction(t);
    setShowForm(true);
  };

  const handleUpdate = (data: {
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

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  const cur = settings.currency;

  return (
    <div className="space-y-3 sm:space-y-stack-lg pb-24 lg:pb-8">
      {loading && (
        <>
          <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface">
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-stack-sm">
            <Skeleton className="h-[72px] sm:h-20" />
            <Skeleton className="h-[72px] sm:h-20" />
            <Skeleton className="h-[72px] sm:h-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px]" />
            ))}
          </div>
        </>
      )}
      {!loading && (<>
        <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between gap-2 border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface">
          <div className="min-w-0 flex-1">
            <h1 className="text-label-md sm:text-headline-md font-bold text-on-surface truncate">Transaksi</h1>
            <p className="text-[11px] sm:text-label-sm text-on-surface-variant">
              {allTransactions.length} total transaksi
            </p>
          </div>
          <button
            onClick={() => {
              setEditTransaction(null);
              setShowForm(true);
            }}
            className="flex items-center gap-1 sm:gap-2 rounded-xl bg-primary px-3 py-2 sm:px-5 sm:py-2.5 text-label-sm sm:text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container active:scale-95 transition-all shrink-0"
          >
            <MaterialSymbol icon="add" size={18} />
            <span className="hidden sm:inline">Tambah</span>
          </button>
        </div>

        {filters.accountId && (() => {
          const acc = accounts.find((a) => a.id === filters.accountId);
          return (
            <div className="flex items-center gap-2 rounded-xl bg-primary-container px-4 py-2.5 text-label-sm font-medium text-on-primary-container">
              <MaterialSymbol icon="account_balance_wallet" size={16} />
              <span className="flex-1">Transaksi: <strong>{acc?.name || "Unknown"}</strong></span>
              <button
                onClick={() => setFilters((prev) => ({ ...prev, accountId: "" }))}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
              >
                <MaterialSymbol icon="close" size={14} />
              </button>
            </div>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-stack-sm">
          <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                <MaterialSymbol icon="south_west" size={14} />
              </div>
              <p className="text-[11px] sm:text-label-sm font-bold text-on-surface-variant">Pemasukan</p>
            </div>
            <p className="mt-1 sm:mt-2 text-tabular-nums font-bold text-sm sm:text-base text-tertiary truncate">
              +{formatCurrency(totalIncome, cur)}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-error/10 text-error">
                <MaterialSymbol icon="north_east" size={14} />
              </div>
              <p className="text-[11px] sm:text-label-sm font-bold text-on-surface-variant">Pengeluaran</p>
            </div>
            <p className="mt-1 sm:mt-2 text-tabular-nums font-bold text-sm sm:text-base text-error truncate">
              -{formatCurrency(totalExpense, cur)}
            </p>
          </div>
          <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${balance >= 0 ? "bg-tertiary/10 text-tertiary" : "bg-error/10 text-error"}`}>
                <MaterialSymbol icon="balance" size={14} />
              </div>
              <p className="text-[11px] sm:text-label-sm font-bold text-on-surface-variant">Selisih</p>
            </div>
            <p className={`mt-1 sm:mt-2 text-tabular-nums font-bold text-sm sm:text-base truncate ${balance >= 0 ? "text-tertiary" : "text-error"}`}>
              {balance >= 0 ? "+" : "-"}{formatCurrency(Math.abs(balance), cur)}
            </p>
          </div>
        </div>

        <TransactionList
          transactions={filtered}
          categories={allCategories}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onAdd={() => {
            setEditTransaction(null);
            setShowForm(true);
          }}
        />

        <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low px-4 sm:px-gutter py-3 sm:py-4 text-center">
          <p className="text-label-xs sm:text-label-sm text-on-surface-variant">
            Menampilkan {filtered.length} dari {allTransactions.length} transaksi
          </p>
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
            onSubmit={editTransaction ? handleUpdate : handleAdd}
            onAddTransfer={handleAddTransfer}
            onCancel={() => {
              setShowForm(false);
              setEditTransaction(null);
            }}
          />
        </Modal>
      </>)}
    </div>
  );
}
