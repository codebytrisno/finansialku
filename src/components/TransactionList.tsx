"use client";

import { useState } from "react";
import {
  type Transaction,
  type Category,
  type TransactionFilters,
  type SortField,
  type SortDirection,
} from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import EmptyState from "./EmptyState";
import {
  LuSearch,
  LuSlidersHorizontal,
  LuPencil,
  LuTrash2,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const SORT_OPTIONS: { field: SortField; label: string }[] = [
  { field: "date", label: "Tanggal" },
  { field: "amount", label: "Jumlah" },
  { field: "category", label: "Kategori" },
];

export default function TransactionList({
  transactions,
  categories,
  filters,
  onFiltersChange,
  onEdit,
  onDelete,
  onAdd,
}: TransactionListProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const toggleSort = (field: SortField) => {
    if (filters.sortField === field) {
      onFiltersChange({
        ...filters,
        sortDirection: filters.sortDirection === "desc" ? "asc" : "desc",
      });
    } else {
      onFiltersChange({ ...filters, sortField: field, sortDirection: "desc" });
    }
  };

  const uniqueCategories = Array.from(
    new Map(categories.map((c) => [c.id, c])).values()
  );

  return (
    <div className="space-y-3">
      {/* Search & Filter Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <LuSearch size={16} />
          </div>
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-400"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-xl border p-2.5 text-sm transition-colors ${
            showFilters ||
            filters.type !== "all" ||
            filters.categoryId ||
            filters.dateFrom ||
            filters.dateTo
              ? "border-emerald-500 bg-emerald-50 text-emerald-600 dark:border-emerald-400 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-zinc-300 text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          }`}
        >
          <LuSlidersHorizontal size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-3">
            {/* Type Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Tipe
              </label>
              <select
                value={filters.type}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    type: e.target.value as "all" | "income" | "expense",
                  })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="all">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Kategori
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  onFiltersChange({ ...filters, categoryId: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value="">Semua</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value })
                }
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">
              Urutkan
            </label>
            <div className="flex gap-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => toggleSort(opt.field)}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    filters.sortField === opt.field
                      ? "bg-emerald-600 text-white"
                      : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {opt.label}
                  {filters.sortField === opt.field &&
                    (filters.sortDirection === "desc" ? (
                      <LuChevronDown size={14} />
                    ) : (
                      <LuChevronUp size={14} />
                    ))}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Tambahkan transaksi pertama kamu"
          action={{ label: "+ Tambah Transaksi", onClick: onAdd }}
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <div
                key={t.id}
                className="group relative rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      <Icon name={cat?.icon || "folder"} size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {cat?.name || "Tanpa Kategori"}
                      </p>
                      {t.note && (
                        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {t.note}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                        {formatDate(t.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                </div>

                {/* Action buttons - appear on hover/always visible on mobile */}
                <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                  <button
                    onClick={() => onEdit(t)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                    title="Edit"
                  >
                    <LuPencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(t.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                    title="Hapus"
                  >
                    <LuTrash2 size={14} />
                  </button>
                </div>

                {/* Delete confirmation */}
                {deleteConfirm === t.id && (
                  <div className="mt-3 flex items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <span className="text-xs text-zinc-500">Hapus?</span>
                    <button
                      onClick={() => {
                        onDelete(t.id);
                        setDeleteConfirm(null);
                      }}
                      className="rounded-lg bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded-lg bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300"
                    >
                      Tidak
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
