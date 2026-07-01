"use client";

import { useState, useEffect } from "react";
import { type Transaction, type Category, type TransactionType, type Account, type Transfer } from "@/lib/types";
import { getToday, formatCurrency, getCurrencySymbol, formatNumberInput, parseNumberInput } from "@/lib/utils";
import { getCategoryTree, getActiveAccounts, getSettings } from "@/lib/store";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "./MaterialSymbol";
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
  onAddTransfer?: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    note: string;
    transactionDate: string;
  }) => void;
}

export default function TransactionForm({
  categories,
  initialData,
  onSubmit,
  onCancel,
  onAddTransfer,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType | "transfer">(initialData?.type || "expense");
  const [amount, setAmount] = useState(initialData?.amount.toString() || "");
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "");
  const [note, setNote] = useState(initialData?.note || "");
  const [transactionDate, setTransactionDate] = useState(
    initialData?.transactionDate || getToday()
  );
  const [accountId, setAccountId] = useState((initialData as any)?.accountId || "");
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculator, setShowCalculator] = useState(false);
  const [expandedParent, setExpandedParent] = useState<string | null>(null);

  const categoryTree = type !== "transfer" ? getCategoryTree(type) : [];
  const accounts = getActiveAccounts();
  const settings = getSettings();

  useEffect(() => {
    if (type === "transfer") return;
    const tree = categories.filter((c) => c.type === type);
    if (!categoryId || !tree.find((c) => c.id === categoryId)) {
      const firstTree = categoryTree.length > 0 ? categoryTree[0] : null;
      const firstId = firstTree?.subCategories[0]?.id || firstTree?.category.id || "";
      if (firstId) {
        setCategoryId(firstId);
        const parent = categoryTree.find(
          (g) => g.subCategories.some((s) => s.id === firstId)
        );
        setExpandedParent(parent?.category.id || (firstTree?.subCategories.length ? firstTree.category.id : null));
      }
    }
  }, [type]);

  useEffect(() => {
    if (type === "transfer" && accounts.length > 0) {
      if (!transferFrom) setTransferFrom(accounts[0].id);
      if (accounts.length > 1 && !transferTo) setTransferTo(accounts[1].id);
      if (accounts.length === 1 && !transferTo) setTransferTo(accounts[0].id);
    }
  }, [type, accounts]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      newErrors.amount = "Nominal harus lebih dari 0";
    }
    if (type === "transfer") {
      if (!transferFrom) newErrors.transferFrom = "Pilih akun asal";
      if (!transferTo) newErrors.transferTo = "Pilih akun tujuan";
      if (transferFrom && transferTo && transferFrom === transferTo) {
        newErrors.transferTo = "Akun asal & tujuan harus berbeda";
      }
    } else {
      if (!categoryId) {
        newErrors.categoryId = "Pilih kategori";
      }
      if (!accountId) {
        newErrors.accountId = "Pilih akun";
      }
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
    if (type === "transfer") {
      onAddTransfer?.({
        fromAccountId: transferFrom,
        toAccountId: transferTo,
        amount: parseFloat(amount),
        note,
        transactionDate,
      });
      return;
    }
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
    <form onSubmit={handleSubmit} className="space-y-stack-md">
      <div>
        <label className="mb-1.5 block text-label-sm text-on-surface-variant">
          Tipe Transaksi
        </label>
        <div className="grid grid-cols-3 gap-stack-xs">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex items-center justify-center gap-1 rounded-xl py-3 text-label-sm font-medium transition-all ${
              type === "expense"
                ? "bg-error text-on-error shadow-sm"
                : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <MaterialSymbol icon="arrow_downward" size={16} fill={type === "expense"} />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex items-center justify-center gap-1 rounded-xl py-3 text-label-sm font-medium transition-all ${
              type === "income"
                ? "bg-tertiary text-on-tertiary shadow-sm"
                : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <MaterialSymbol icon="arrow_upward" size={16} fill={type === "income"} />
            Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType("transfer")}
            className={`flex items-center justify-center gap-1 rounded-xl py-3 text-label-sm font-medium transition-all ${
              type === "transfer"
                ? "bg-secondary text-on-secondary shadow-sm"
                : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <MaterialSymbol icon="swap_horiz" size={16} fill={type === "transfer"} />
            Transfer
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-label-sm text-on-surface-variant">
          Nominal
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-semibold text-on-surface-variant">
            {getCurrencySymbol(settings.currency)}
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={formatNumberInput(amount)}
            onChange={(e) => setAmount(parseNumberInput(e.target.value))}
            className={`w-full rounded-xl border bg-surface-container-low px-12 py-3 pl-12 text-body-md font-semibold text-on-surface placeholder:text-on-surface-variant transition-colors ${
              errors.amount
                ? "border-error"
                : "border-outline-variant focus:border-primary"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowCalculator(true)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant transition-colors hover:bg-surface-container-highest"
            title="Buka Kalkulator"
          >
            <MaterialSymbol icon="calculate" size={18} />
          </button>
        </div>
        {errors.amount && (
          <p className="mt-stack-xs text-label-sm text-error">{errors.amount}</p>
        )}
      </div>

      {type === "transfer" ? (
        <>
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Dari Akun
            </label>
            <select
              value={transferFrom}
              onChange={(e) => {
                setTransferFrom(e.target.value);
                if (e.target.value === transferTo) setTransferTo("");
              }}
              className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition-colors ${
                errors.transferFrom
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            >
              <option value="">Pilih akun asal</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance, settings.currency)})
                </option>
              ))}
            </select>
            {errors.transferFrom && (
              <p className="mt-stack-xs text-label-sm text-error">{errors.transferFrom}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Ke Akun
            </label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition-colors ${
                errors.transferTo
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            >
              <option value="">Pilih akun tujuan</option>
              {accounts
                .filter((a) => a.id !== transferFrom)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, settings.currency)})
                  </option>
                ))}
            </select>
            {errors.transferTo && (
              <p className="mt-stack-xs text-label-sm text-error">{errors.transferTo}</p>
            )}
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Kategori
            </label>
            <div className="space-y-stack-xs">
              {categoryTree.length === 0 ? (
                <p className="text-body-md text-on-surface-variant">Belum ada kategori untuk tipe ini</p>
              ) : (
                categoryTree.map(({ category: cat, subCategories }) => (
                  <div key={cat.id} className="space-y-stack-xs">
                    <button
                      type="button"
                      onClick={() => {
                        if (subCategories.length > 0) {
                          setExpandedParent(expandedParent === cat.id ? null : cat.id);
                        } else {
                          setCategoryId(cat.id);
                        }
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-body-md transition-all ${
                        categoryId === cat.id
                          ? "border-primary bg-primary-container text-on-primary-container"
                          : "border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
                      }`}
                    >
                      <Icon name={cat.icon} size={18} />
                      <span className="truncate font-medium">{cat.name}</span>
                      {subCategories.length > 0 && (
                        <MaterialSymbol
                          icon={expandedParent === cat.id ? "expand_less" : "expand_more"}
                          size={18}
                          className="ml-auto shrink-0 text-on-surface-variant"
                        />
                      )}
                    </button>

                    {subCategories.length > 0 && expandedParent === cat.id && (
                      <div className="ml-3 space-y-stack-xs border-l-2 border-outline-variant pl-3">
                        {subCategories.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setCategoryId(sub.id)}
                            className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-label-md transition-all ${
                              categoryId === sub.id
                                ? "border-primary bg-primary-container text-on-primary-container"
                                : "border-transparent text-on-surface-variant hover:border-outline-variant"
                            }`}
                          >
                            <Icon name={sub.icon} size={16} />
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
              <p className="mt-stack-xs text-label-sm text-error">{errors.categoryId}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Dompet / Akun
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition-colors ${
                errors.accountId
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            >
              <option value="">Pilih akun</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance, settings.currency)})
                </option>
              ))}
            </select>
            {errors.accountId && (
              <p className="mt-stack-xs text-label-sm text-error">{errors.accountId}</p>
            )}
          </div>
        </>
      )}

      <div>
        <label className="mb-1.5 block text-label-sm text-on-surface-variant">
          Tanggal
        </label>
        <input
          type="date"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
          className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface transition-colors ${
            errors.transactionDate
              ? "border-error"
              : "border-outline-variant"
          }`}
        />
        {errors.transactionDate && (
          <p className="mt-stack-xs text-label-sm text-error">{errors.transactionDate}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-label-sm text-on-surface-variant">
          Catatan <span className="text-outline">(opsional)</span>
        </label>
        <textarea
          placeholder="Tambahkan catatan..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant"
        />
      </div>

      <div className="flex gap-stack-sm pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-outline-variant px-5 py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-primary px-5 py-3 text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
        >
          {initialData ? "Simpan" : "Tambah"}
        </button>
      </div>

      <Calculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onResult={handleCalculatorResult}
        initialValue={amount}
      />
    </form>
  );
}
