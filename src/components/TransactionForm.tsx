"use client";

import { useState, useEffect } from "react";
import { type Transaction, type Category, type TransactionType, type Account } from "@/lib/types";
import { getToday, formatCurrency } from "@/lib/utils";
import { getCategoryTree, getActiveAccounts, getSettings } from "@/lib/store";
import { Icon } from "@/lib/icons";
import { LuArrowDown, LuArrowUp, LuCalculator } from "react-icons/lu";
import Calculator from "./Calculator";

interface TransactionFormProps {
  categories: Category[];
  initialData?: Transaction | null;
  onSubmit: (data: {
    type: TransactionType;
    amount: number;
    categoryId: string;
    note: string;
    transactionDate: string;
    accountId?: string;
  }) => void;
  onCancel: () => void;
}

export default function TransactionForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initialData?.type || "expense");
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [note, setNote] = useState(initialData?.note || "");
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate || getToday()
  );
  const [accountId, setAccountId] = useState((initialData as any)?.accountId || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);

  const categoryTree = getCategoryTree(type);
  const accounts = getActiveAccounts();
  const settings = getSettings();

  // Auto-select first category when type changes
  useEffect(() => {
    const tree = categories.filter((c) => c.type === type);
    if (!categoryId || !tree.find((c) => c.id === categoryId)) {
      // Try to find the first category (including sub-categories)
      const firstTree = categoryTree.length > 0 ? categoryTree[0] : null;
      const firstId = firstTree?.subCategories[0]?.id || firstTree?.category.id || "";
      if (firstId) {
        setCategoryId(firstId);
      }
    }
  }, [type]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      newErrors.amount = "Nominal harus lebih dari 0";
    }
    if (!categoryId) {
      newErrors.categoryId = "Pilih kategori";
    }
    if (!transactionDate) {
      newErrors.transactionDate = "Pilih tanggal";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      type,
      amount: parseFloat(amount),
      categoryId,
      note,
      transactionDate,
      accountId,
    });
  };

  const handleCalculatorResult = (value: number) => {
    setAmount(value.toString());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Toggle */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tipe Transaksi
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
              type === "expense"
                ? "bg-red-500 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            <LuArrowDown size={16} />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all ${
              type === "income"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            <LuArrowUp size={16} />
            Pemasukan
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nominal
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-zinc-500">
            Rp
          </span>
          <input
            type="number"
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`w-full rounded-xl border bg-white py-3 pl-12 pr-12 text-lg font-bold text-zinc-900 transition-colors placeholder:text-zinc-300 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-600 ${
              errors.amount
                ? "border-red-400 focus:ring-red-400"
                : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700 dark:focus:ring-emerald-400"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowCalculator(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:bg-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-600"
            title="Buka Kalkulator"
          >
            <LuCalculator size={16} />
          </button>
        </div>
        {errors.amount && (
          <p className="mt-1 text-xs text-red-500">{errors.amount}</p>
        )}
      </div>

      {/* Category with Sub-Categories */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Kategori
        </label>
        <div className="space-y-1">
          {categoryTree.length === 0 ? (
            <p className="text-sm text-zinc-400">Belum ada kategori untuk tipe ini</p>
          ) : (
            categoryTree.map(({ category: cat, subCategories }) => (
              <div key={cat.id} className="space-y-1">
                {/* Main Category */}
                <button
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-all ${
                    categoryId === cat.id
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <Icon name={cat.icon} size={16} />
                  <span className="truncate font-medium">{cat.name}</span>
                </button>

                {/* Sub-Categories */}
                {subCategories.length > 0 && (
                  <div className="ml-3 space-y-1 border-l-2 border-zinc-100 pl-3 dark:border-zinc-800">
                    {subCategories.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setCategoryId(sub.id)}
                        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-all ${
                          categoryId === sub.id
                            ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "border-transparent text-zinc-500 hover:border-zinc-200 hover:text-zinc-700 dark:hover:border-zinc-700 dark:hover:text-zinc-300"
                        }`}
                      >
                        <Icon name={sub.icon} size={14} />
                        <span className="truncate">{sub.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {errors.categoryId && (
          <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>
        )}
      </div>

      {/* Account */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Dompet / Akun
        </label>
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Pilih akun</option>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.name} ({formatCurrency(acc.balance, settings.currency)})
            </option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tanggal
        </label>
        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
            errors.transactionDate
              ? "border-red-400 focus:ring-red-400"
              : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700 dark:focus:ring-emerald-400"
          }`}
        />
        {errors.transactionDate && (
          <p className="mt-1 text-xs text-red-500">{errors.transactionDate}</p>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Catatan <span className="text-zinc-400">(opsional)</span>
        </label>
        <textarea
          placeholder="Tambahkan catatan..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:ring-emerald-400"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
        >
          {initialData ? "Simpan" : "Tambah"}
        </button>
      </div>

      {/* Calculator Overlay */}
      <Calculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onResult={handleCalculatorResult}
        initialValue={amount}
      />
    </form>
  );
}
