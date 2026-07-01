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
import { MaterialSymbol } from "./MaterialSymbol";
import EmptyState from "./EmptyState";

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
    <div className="space-y-stack-sm">
      <div className="flex items-center gap-stack-xs">
        <div className="relative flex-1">
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
            <MaterialSymbol icon="search" size={16} />
          </div>
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2.5 pl-9 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`rounded-xl border p-2.5 transition-colors ${
            showFilters ||
            filters.type !== "all" ||
            filters.categoryId ||
            filters.dateFrom ||
            filters.dateTo
              ? "border-primary bg-primary-container text-primary"
              : "border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
          }`}
        >
          <MaterialSymbol icon="filter_list" size={18} />
        </button>
      </div>

      {showFilters && (
        <div className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-gutter space-y-3 sm:space-y-stack-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-stack-sm">
            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">
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
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface appearance-none"
              >
                <option value="all">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">
                Kategori
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) =>
                  onFiltersChange({ ...filters, categoryId: e.target.value })
                }
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface appearance-none"
              >
                <option value="">Semua</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateFrom: e.target.value })
                }
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  onFiltersChange({ ...filters, dateTo: e.target.value })
                }
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-body-md text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Urutkan
            </label>
            <div className="flex gap-2 sm:gap-stack-xs">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.field}
                  onClick={() => toggleSort(opt.field)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 text-[11px] sm:text-label-md font-medium transition-colors ${
                    filters.sortField === opt.field
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {opt.label}
                  {filters.sortField === opt.field &&
                    (filters.sortDirection === "desc" ? (
                      <MaterialSymbol icon="expand_more" size={16} />
                    ) : (
                      <MaterialSymbol icon="expand_less" size={16} />
                    ))}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Tambahkan transaksi pertama kamu"
          action={{ label: "+ Tambah Transaksi", onClick: onAdd }}
        />
      ) : (
        <div className="space-y-stack-xs">
          {transactions.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <div
                key={t.id}
                className="relative rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-3 sm:p-4 transition-all hover:bg-surface-container"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-stack-sm">
                  <div className="flex items-start gap-2 sm:gap-stack-sm min-w-0 flex-1">
                    <div
                      className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
                        t.type === "income"
                          ? "bg-tertiary/10 text-tertiary"
                          : "bg-error/10 text-error"
                      }`}
                    >
                      <Icon name={cat?.icon || (t.type === "income" ? "south_west" : "north_east")} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-label-xs sm:text-label-md font-bold text-on-surface">
                        {cat?.name || "Tanpa Kategori"}
                      </p>
                      {t.note && (
                        <p className="truncate text-label-xs sm:text-label-sm text-on-surface-variant">
                          {t.note}
                        </p>
                      )}
                      <p className="mt-0.5 text-label-xs sm:text-label-sm text-outline">
                        {formatDate(t.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={`text-tabular-nums font-bold text-label-sm sm:text-base ${
                        t.type === "income"
                          ? "text-tertiary"
                          : "text-error"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => onEdit(t)}
                        className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high active:scale-95"
                        title="Edit"
                      >
                        <MaterialSymbol icon="edit" size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(t.id)}
                        className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-error-container text-error hover:bg-error-container active:scale-95"
                        title="Hapus"
                      >
                        <MaterialSymbol icon="delete" size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {deleteConfirm === t.id && (
                  <div className="mt-2 sm:mt-stack-sm flex items-center justify-end gap-2 sm:gap-stack-xs border-t border-outline-variant pt-2 sm:pt-stack-sm">
                    <span className="text-label-xs sm:text-label-sm text-on-surface-variant">Hapus?</span>
                    <button
                      onClick={() => {
                        onDelete(t.id);
                        setDeleteConfirm(null);
                      }}
                      className="rounded-lg sm:rounded-xl bg-error px-3 sm:px-4 py-1.5 sm:py-2 text-label-xs sm:text-label-sm font-medium text-on-error hover:bg-error active:scale-95"
                    >
                      Ya
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="rounded-lg sm:rounded-xl border border-outline-variant px-3 sm:px-4 py-1.5 sm:py-2 text-label-xs sm:text-label-sm font-medium text-on-surface-variant hover:bg-surface-container-highest active:scale-95"
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
