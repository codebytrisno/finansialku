"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  getCategories,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  filterTransactions,
} from "@/lib/store";
import {
  type Transaction,
  type Category,
  type TransactionFilters,
} from "@/lib/types";
import TransactionList from "@/components/TransactionList";
import TransactionForm from "@/components/TransactionForm";
import Modal from "@/components/Modal";

const DEFAULT_FILTERS: TransactionFilters = {
  search: "",
  type: "all",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
  sortField: "date",
  sortDirection: "desc",
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>(DEFAULT_FILTERS);
  const [showForm, setShowForm] = useState(false);
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(null);

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = filterTransactions(transactions, filters);

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
  };

  const handleEdit = (t: Transaction) => {
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
    }
  };

  const handleDelete = (id: string) => {
    deleteTransaction(id);
    loadData();
  };

  const handleFiltersChange = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Transaksi
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {transactions.length} total transaksi
          </p>
        </div>
        <button
          onClick={() => {
            setEditTransaction(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <span className="text-lg">+</span>
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Transaction List */}
      <TransactionList
        transactions={filtered}
        categories={categories}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={() => {
          setEditTransaction(null);
          setShowForm(true);
        }}
      />

      {/* Summary */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Menampilkan {filtered.length} dari {transactions.length} transaksi
        </p>
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
          onSubmit={editTransaction ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditTransaction(null);
          }}
        />
      </Modal>
    </div>
  );
}
