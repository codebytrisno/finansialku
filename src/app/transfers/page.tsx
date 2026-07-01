"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAccounts,
  getTransfers,
  addTransfer,
  deleteTransfer,
  getRecurringTransactions,
  getCategories,
  addTransaction,
  addRecurringTransaction,
  updateRecurringTransaction,
  deleteRecurringTransaction,
  getSettings,
} from "@/lib/store";
import {
  type Transfer,
  type Account,
  type RecurringTransaction,
  type RecurringFrequency,
  type RecurringType,
  type Category,
  type AppSettings,
} from "@/lib/types";
import {
  formatCurrency,
  formatDate,
  getToday,
  getCurrencySymbol,
  formatNumberInput,
  parseNumberInput,
  calculateNextDate,
  getRecurringLabel,
} from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

type Tab = "transfer" | "recurring";

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  daily: "Setiap Hari",
  weekly: "Setiap Minggu",
  monthly: "Setiap Bulan",
  yearly: "Setiap Tahun",
};

const RECURRING_LABELS = [
  { value: "salary", label: "Gaji" },
  { value: "insurance", label: "Asuransi" },
  { value: "deposit", label: "Deposito" },
  { value: "loan", label: "Pinjaman" },
  { value: "rent", label: "Sewa" },
  { value: "subscription", label: "Langganan" },
  { value: "savings", label: "Tabungan Rutin" },
  { value: "other", label: "Lainnya" },
];

export default function TransfersPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", currency: "IDR", defaultCategoryId: "", language: "id" });
  const [activeTab, setActiveTab] = useState<Tab>("transfer");
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringTransaction | null>(null);

  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(getToday());
  const [transferErrors, setTransferErrors] = useState<Record<string, string>>({});

  const [recType, setRecType] = useState<RecurringType>("expense");
  const [recLabel, setRecLabel] = useState("other");
  const [recAmount, setRecAmount] = useState("");
  const [recCategoryId, setRecCategoryId] = useState("");
  const [recAccountId, setRecAccountId] = useState("");
  const [recFromAccount, setRecFromAccount] = useState("");
  const [recToAccount, setRecToAccount] = useState("");
  const [recFrequency, setRecFrequency] = useState<RecurringFrequency>("monthly");
  const [recInterval, setRecInterval] = useState(1);
  const [recStartDate, setRecStartDate] = useState(getToday());
  const [recNote, setRecNote] = useState("");
  const [recErrors, setRecErrors] = useState<Record<string, string>>({});
  const [deleteTransferId, setDeleteTransferId] = useState<string | null>(null);
  const [deleteRecurringId, setDeleteRecurringId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setAccounts(getAccounts());
    setTransfers(getTransfers());
    setRecurrings(getRecurringTransactions());
    setCategories(getCategories());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      setLoading(false);
    });
  }, [loadData]);

  const activeAccounts = accounts.filter((a) => a.isActive);

  const resetTransferForm = () => {
    const accs = activeAccounts;
    setTransferFrom(accs[0]?.id || "");
    setTransferTo(accs[1]?.id || accs[0]?.id || "");
    setTransferAmount("");
    setTransferNote("");
    setTransferDate(getToday());
    setTransferErrors({});
  };

  const validateTransfer = (): boolean => {
    const errs: Record<string, string> = {};
    if (!transferFrom) errs.from = "Pilih akun asal";
    if (!transferTo) errs.to = "Pilih akun tujuan";
    if (transferFrom === transferTo) errs.to = "Akun asal & tujuan harus berbeda";
    if (!transferAmount || parseFloat(transferAmount) <= 0) errs.amount = "Nominal harus valid";
    setTransferErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddTransfer = () => {
    if (!validateTransfer()) return;
    addTransfer({
      fromAccountId: transferFrom,
      toAccountId: transferTo,
      amount: parseFloat(transferAmount),
      note: transferNote,
      transactionDate: transferDate,
    });
    setShowTransferForm(false);
    loadData();
    showToast("Transfer berhasil ditambahkan");
  };

  const handleDeleteTransfer = (id: string) => {
    setDeleteTransferId(id);
  };

  const resetRecurringForm = (type?: RecurringType) => {
    const t = type || recType;
    setRecType(t);
    setRecLabel("other");
    setRecAmount("");
    setRecCategoryId(categories.find((c) => c.type === "expense")?.id || "");
    setRecAccountId(activeAccounts[0]?.id || "");
    setRecFromAccount(activeAccounts[0]?.id || "");
    setRecToAccount(activeAccounts[1]?.id || activeAccounts[0]?.id || "");
    setRecFrequency("monthly");
    setRecInterval(1);
    setRecStartDate(getToday());
    setRecNote("");
    setRecErrors({});
  };

  const openAddRecurring = (type?: RecurringType) => {
    setEditRecurring(null);
    resetRecurringForm(type);
    setShowRecurringForm(true);
  };

  const openEditRecurring = (r: RecurringTransaction) => {
    setEditRecurring(r);
    setRecType(r.type);
    setRecLabel(r.label);
    setRecAmount(r.amount.toString());
    setRecCategoryId(r.categoryId);
    setRecAccountId(r.accountId);
    setRecFromAccount(r.fromAccountId);
    setRecToAccount(r.toAccountId);
    setRecFrequency(r.frequency);
    setRecInterval(r.interval);
    setRecStartDate(r.startDate);
    setRecNote(r.note || "");
    setRecErrors({});
    setShowRecurringForm(true);
  };

  const validateRecurring = (): boolean => {
    const errs: Record<string, string> = {};
    if (!recAmount || parseFloat(recAmount) <= 0) errs.amount = "Nominal harus valid";
    if (recType === "transfer") {
      if (!recFromAccount) errs.from = "Pilih akun asal";
      if (!recToAccount) errs.to = "Pilih akun tujuan";
      if (recFromAccount === recToAccount) errs.to = "Akun harus berbeda";
    } else {
      if (!recAccountId) errs.account = "Pilih akun";
    }
    setRecErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddRecurring = () => {
    if (!validateRecurring()) return;
    const data = {
      type: recType,
      amount: parseFloat(recAmount),
      categoryId: recCategoryId,
      fromAccountId: recType === "transfer" ? recFromAccount : recAccountId,
      toAccountId: recType === "transfer" ? recToAccount : recAccountId,
      accountId: recType !== "transfer" ? recAccountId : "",
      frequency: recFrequency,
      interval: recInterval,
      startDate: recStartDate,
      nextDate: recStartDate,
      note: recNote,
      label: recLabel,
      active: true,
    };
    if (editRecurring) {
      updateRecurringTransaction(editRecurring.id, data);
      showToast("Transaksi berulang berhasil diperbarui");
    } else {
      addRecurringTransaction(data);
      showToast("Transaksi berulang berhasil ditambahkan");
    }
    setShowRecurringForm(false);
    loadData();
  };

  const handleToggleRecurring = (r: RecurringTransaction) => {
    updateRecurringTransaction(r.id, { active: !r.active });
    loadData();
    showToast(r.active ? "Transaksi berulang dinonaktifkan" : "Transaksi berulang diaktifkan");
  };

  const handleDeleteRecurring = (id: string) => {
    setDeleteRecurringId(id);
  };

  const sortedTransfers = [...transfers].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  const sortedRecurrings = [...recurrings].sort((a, b) => b.nextDate.localeCompare(a.nextDate));

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "Akun tidak ditemukan";

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const cur = settings.currency;

  return (
    <div className="space-y-stack-lg pb-24 lg:pb-8">
      {loading && (
        <>
          <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </>
      )}
      {!loading && (<>
      <div className="sticky top-0 z-30 -mx-gutter flex min-h-[56px] items-center justify-between border-b border-outline-variant bg-surface-container-low px-gutter dark:bg-inverse-surface">
        <div className="min-w-0 flex-1">
          <h1 className="text-label-md sm:text-headline-md font-bold text-on-surface truncate">Transfer & Berulang</h1>
          <p className="text-[11px] sm:text-label-sm text-on-surface-variant truncate">
            Transfer antar akun & transaksi otomatis
          </p>
        </div>
      </div>

      <div className="flex gap-stack-xs rounded-xl bg-surface-container p-1">
        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-label-md font-medium transition-all ${
            activeTab === "transfer"
              ? "bg-surface-container-low text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <MaterialSymbol icon="swap_horiz" size={18} fill={activeTab === "transfer"} />
          <span>Transfer</span>
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2.5 text-label-md font-medium transition-all ${
            activeTab === "recurring"
              ? "bg-surface-container-low text-primary shadow-sm"
              : "text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <MaterialSymbol icon="repeat" size={18} fill={activeTab === "recurring"} />
          <span>Berulang</span>
        </button>
      </div>

      {activeTab === "transfer" && (
        <>
          <button
            onClick={() => {
              resetTransferForm();
              setShowTransferForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant py-4 text-label-md font-medium text-on-surface-variant transition-all hover:border-primary hover:text-primary hover:bg-surface-container-low"
          >
            <MaterialSymbol icon="add" size={20} />
            Transfer Antar Akun
          </button>

          {sortedTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-outline">
                <MaterialSymbol icon="swap_horiz" size={28} />
              </div>
              <h3 className="text-headline-md text-on-surface">Belum ada transfer</h3>
              <p className="mt-stack-xs text-body-md text-on-surface-variant">
                Pindahkan uang antar akun dengan mudah
              </p>
            </div>
          ) : (
            <div className="space-y-stack-xs">
              {sortedTransfers.map((tr) => {
                const fromAcc = accounts.find((a) => a.id === tr.fromAccountId);
                const toAcc = accounts.find((a) => a.id === tr.toAccountId);
                return (
                  <div
                    key={tr.id}
                    className="rounded-xl sm:rounded-2xl border border-outline-variant bg-surface-container-low p-4 sm:p-gutter transition-all hover:bg-surface-container"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-outline shrink-0">
                          <Icon name={fromAcc?.icon || "wallet"} size={16} />
                          <MaterialSymbol icon="swap_horiz" size={14} className="text-primary" />
                          <Icon name={toAcc?.icon || "wallet"} size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-label-xs sm:text-label-md text-on-surface">
                            {fromAcc?.name || "?"} → {toAcc?.name || "?"}
                          </p>
                          <p className="text-label-xs sm:text-label-sm text-on-surface-variant truncate">
                            {formatDate(tr.transactionDate)}
                            {tr.note && ` · ${tr.note}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <span className="text-tabular-nums font-bold text-label-sm sm:text-base text-primary">
                          {formatCurrency(tr.amount, cur)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransfer(tr.id)}
                          className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-error-container text-error transition-colors hover:bg-error-container active:scale-95"
                          aria-label="Hapus transfer"
                        >
                          <MaterialSymbol icon="delete" size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {activeTab === "recurring" && (
        <>
          <div className="grid grid-cols-3 gap-2 sm:gap-stack-xs">
            <button
              onClick={() => openAddRecurring("income")}
              className="flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border-2 border-dashed border-tertiary py-3 sm:py-4 text-tertiary transition-all hover:bg-tertiary-container/30 active:scale-95"
            >
              <MaterialSymbol icon="arrow_upward" size={18} />
              <span className="text-label-xs sm:text-label-sm font-semibold">Gaji</span>
            </button>
            <button
              onClick={() => openAddRecurring("expense")}
              className="flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border-2 border-dashed border-error py-3 sm:py-4 text-error transition-all hover:bg-error-container/30 active:scale-95"
            >
              <MaterialSymbol icon="arrow_downward" size={18} />
              <span className="text-label-xs sm:text-label-sm font-semibold">Tagihan</span>
            </button>
            <button
              onClick={() => openAddRecurring("transfer")}
              className="flex flex-col items-center gap-1 rounded-xl sm:rounded-2xl border-2 border-dashed border-primary py-3 sm:py-4 text-primary transition-all hover:bg-primary-container/30 active:scale-95"
            >
              <MaterialSymbol icon="swap_horiz" size={18} />
              <span className="text-label-xs sm:text-label-sm font-semibold">Transfer Rutin</span>
            </button>
          </div>

          {sortedRecurrings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-container text-outline">
                <MaterialSymbol icon="repeat" size={28} />
              </div>
              <h3 className="text-headline-md text-on-surface">Belum ada transaksi berulang</h3>
              <p className="mt-stack-xs text-body-md text-on-surface-variant">
                Atur pembayaran rutin seperti gaji, asuransi, pinjaman, dll
              </p>
            </div>
          ) : (
            <div className="space-y-stack-xs">
              {sortedRecurrings.map((r) => {
                const isDue = r.nextDate <= getToday();
                const cat = categories.find((c) => c.id === r.categoryId);
                const acc = accounts.find((a) => a.id === (r.type === "transfer" ? r.fromAccountId : r.accountId));
                return (
                  <div
                    key={r.id}
                    className={`rounded-xl sm:rounded-2xl border p-4 sm:p-gutter transition-all bg-surface-container-low ${
                      !r.active
                        ? "border-outline-variant opacity-50"
                        : isDue
                        ? "border-[#b38f00] bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-outline-variant hover:bg-surface-container"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div
                          className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${
                            r.type === "income"
                              ? "bg-tertiary-container text-tertiary"
                              : r.type === "expense"
                              ? "bg-error-container text-error"
                              : "bg-secondary-container text-secondary"
                          }`}
                        >
                          {r.type === "income" ? <MaterialSymbol icon="arrow_upward" size={18} /> : r.type === "expense" ? <MaterialSymbol icon="arrow_downward" size={18} /> : <MaterialSymbol icon="swap_horiz" size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-label-xs sm:text-label-md font-semibold text-on-surface">
                            {getRecurringLabel(r.label)}
                          </p>
                          <p className="text-label-xs sm:text-label-sm text-on-surface-variant truncate">
                            {FREQUENCY_LABELS[r.frequency]} {r.interval > 1 ? `(${r.interval}x)` : ""}
                            {r.note && ` · ${r.note}`}
                          </p>
                          {isDue && r.active && (
                            <p className="text-label-xs sm:text-label-sm font-medium text-[#b38f00]">
                              <MaterialSymbol icon="schedule" size={12} className="inline align-text-bottom" /> Jatuh tempo! ({formatDate(r.nextDate)})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-tabular-nums font-bold text-label-sm sm:text-base ${
                            r.type === "income"
                              ? "text-tertiary"
                              : r.type === "expense"
                              ? "text-error"
                              : "text-secondary"
                          }`}
                        >
                          {r.type === "income" ? "+" : r.type === "expense" ? "-" : ""}
                          {formatCurrency(r.amount, cur)}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleToggleRecurring(r)}
                            className={`rounded-lg px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-label-sm font-medium transition-colors active:scale-95 ${
                              r.active
                                ? "border border-outline-variant text-on-surface-variant hover:bg-surface-container-highest"
                                : "bg-primary-container text-on-primary-container"
                            }`}
                          >
                            {r.active ? "Nonaktif" : "Aktif"}
                          </button>
                          <button
                            onClick={() => openEditRecurring(r)}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest active:scale-95"
                            aria-label="Edit recurring"
                          >
                            <MaterialSymbol icon="calendar_clock" size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(r.id)}
                            className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-lg bg-error-container text-error hover:bg-error-container active:scale-95"
                            aria-label="Hapus recurring"
                          >
                            <MaterialSymbol icon="delete" size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 sm:mt-stack-xs flex flex-wrap gap-x-3 sm:gap-stack-sm text-label-xs sm:text-label-sm text-on-surface-variant">
                      <span>Akun: {acc?.name || "?"}</span>
                      {r.type === "transfer" && (
                        <span>→ {getAccountName(r.toAccountId)}</span>
                      )}
                      <span>Berikutnya: {formatDate(r.nextDate)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        title="Transfer Antar Akun"
      >
        <div className="space-y-stack-md">
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Dari Akun
            </label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface ${
                transferErrors.from
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            >
              <option value="">Pilih akun asal</option>
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({formatCurrency(acc.balance, cur)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Ke Akun
            </label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface ${
                transferErrors.to
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            >
              <option value="">Pilih akun tujuan</option>
              {activeAccounts
                .filter((a) => a.id !== transferFrom)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, cur)})
                  </option>
                ))}
            </select>
            {transferErrors.to && <p className="mt-stack-xs text-label-sm text-error">{transferErrors.to}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-semibold text-on-surface-variant">{getCurrencySymbol(cur)}</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumberInput(transferAmount)}
                onChange={(e) => setTransferAmount(parseNumberInput(e.target.value))}
                className={`w-full rounded-xl border bg-surface-container-low py-3 pl-12 pr-4 text-body-md font-semibold text-on-surface ${
                  transferErrors.amount
                    ? "border-error"
                    : "border-outline-variant"
                }`}
              />
            </div>
            {transferErrors.amount && <p className="mt-stack-xs text-label-sm text-error">{transferErrors.amount}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Tanggal</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">
              Catatan <span className="text-outline">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Transfer bulanan"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant"
            />
          </div>

          <div className="flex gap-stack-sm pt-2">
            <button
              onClick={() => setShowTransferForm(false)}
              className="flex-1 rounded-xl border border-outline-variant px-5 py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddTransfer}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              Transfer
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showRecurringForm}
        onClose={() => {
          setShowRecurringForm(false);
          setEditRecurring(null);
        }}
        title={editRecurring ? "Edit Transaksi Berulang" : "Transaksi Berulang"}
      >
        <div className="space-y-stack-md max-h-[65vh] overflow-y-auto">
          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Tipe</label>
            <div className="grid grid-cols-3 gap-2 sm:gap-stack-xs">
              <button
                type="button"
                onClick={() => setRecType("income")}
                className={`rounded-xl py-2.5 sm:py-3 text-label-xs sm:text-label-sm font-medium transition-all ${
                  recType === "income"
                    ? "bg-tertiary text-on-tertiary shadow-sm"
                    : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                <MaterialSymbol icon="arrow_upward" size={14} className="mx-auto mb-0.5" fill={recType === "income"} />
                Gaji/Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setRecType("expense")}
                className={`rounded-xl py-2.5 sm:py-3 text-label-xs sm:text-label-sm font-medium transition-all ${
                  recType === "expense"
                    ? "bg-error text-on-error shadow-sm"
                    : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                <MaterialSymbol icon="arrow_downward" size={14} className="mx-auto mb-0.5" fill={recType === "expense"} />
                Tagihan
              </button>
              <button
                type="button"
                onClick={() => setRecType("transfer")}
                className={`rounded-xl py-2.5 sm:py-3 text-label-xs sm:text-label-sm font-medium transition-all ${
                  recType === "transfer"
                    ? "bg-primary text-on-primary shadow-sm"
                    : "border border-outline-variant bg-surface text-on-surface-variant hover:bg-surface-container-highest"
                }`}
              >
                <MaterialSymbol icon="swap_horiz" size={14} className="mx-auto mb-0.5" fill={recType === "transfer"} />
                Transfer
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Label</label>
            <select
              value={recLabel}
              onChange={(e) => setRecLabel(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
            >
              {RECURRING_LABELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-body-md font-semibold text-on-surface-variant">{getCurrencySymbol(cur)}</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumberInput(recAmount)}
                onChange={(e) => setRecAmount(parseNumberInput(e.target.value))}
                className={`w-full rounded-xl border bg-surface-container-low py-3 pl-12 pr-4 text-body-md font-semibold text-on-surface ${
                  recErrors.amount
                    ? "border-error"
                    : "border-outline-variant"
                }`}
              />
            </div>
            {recErrors.amount && <p className="mt-stack-xs text-label-sm text-error">{recErrors.amount}</p>}
          </div>

          {recType !== "transfer" && (
            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">Kategori</label>
              <select
                value={recCategoryId}
                onChange={(e) => setRecCategoryId(e.target.value)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
              >
                {(recType === "income" ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {recType === "transfer" ? (
            <>
              <div>
                <label className="mb-1.5 block text-label-sm text-on-surface-variant">Dari Akun</label>
                <select
                  value={recFromAccount}
                  onChange={(e) => setRecFromAccount(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-label-sm text-on-surface-variant">Ke Akun</label>
                <select
                  value={recToAccount}
                  onChange={(e) => setRecToAccount(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
                >
                  {activeAccounts.filter((a) => a.id !== recFromAccount).map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">Akun</label>
              <select
                value={recAccountId}
                onChange={(e) => setRecAccountId(e.target.value)}
                className={`w-full rounded-xl border bg-surface-container-low px-4 py-3 text-body-md text-on-surface ${
                  recErrors.account
                    ? "border-error"
                    : "border-outline-variant"
                }`}
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-stack-sm">
            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">Frekuensi</label>
              <select
                value={recFrequency}
                onChange={(e) => setRecFrequency(e.target.value as RecurringFrequency)}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
              >
                <option value="daily">Setiap Hari</option>
                <option value="weekly">Setiap Minggu</option>
                <option value="monthly">Setiap Bulan</option>
                <option value="yearly">Setiap Tahun</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-label-sm text-on-surface-variant">Interval</label>
              <input
                type="number"
                min={1}
                value={recInterval}
                onChange={(e) => setRecInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Mulai Tanggal</label>
            <input
              type="date"
              value={recStartDate}
              onChange={(e) => setRecStartDate(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-label-sm text-on-surface-variant">Catatan <span className="text-outline">(opsional)</span></label>
            <input
              type="text"
              placeholder="e.g. Gaji bulanan"
              value={recNote}
              onChange={(e) => setRecNote(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant"
            />
          </div>

          <div className="flex gap-stack-sm pt-2">
            <button
              onClick={() => {
                setShowRecurringForm(false);
                setEditRecurring(null);
              }}
              className="flex-1 rounded-xl border border-outline-variant px-5 py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-highest transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddRecurring}
              className="flex-1 rounded-xl bg-primary px-5 py-3 text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              {editRecurring ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteTransferId !== null}
        title="Hapus Transfer"
        message="Yakin ingin menghapus transfer ini?"
        onConfirm={() => {
          if (deleteTransferId) {
            deleteTransfer(deleteTransferId);
            loadData();
            showToast("Transfer berhasil dihapus");
          }
          setDeleteTransferId(null);
        }}
        onCancel={() => setDeleteTransferId(null)}
      />

      <ConfirmDialog
        isOpen={deleteRecurringId !== null}
        title="Hapus Transaksi Berulang"
        message="Yakin ingin menghapus transaksi berulang ini?"
        onConfirm={() => {
          if (deleteRecurringId) {
            deleteRecurringTransaction(deleteRecurringId);
            loadData();
            showToast("Transaksi berulang berhasil dihapus");
          }
          setDeleteRecurringId(null);
        }}
        onCancel={() => setDeleteRecurringId(null)}
      />
    </>)}
    </div>
  );
}
