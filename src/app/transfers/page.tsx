"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  getCurrentMonth,
  calculateNextDate,
  getRecurringLabel,
  getAccountTypeLabel,
} from "@/lib/utils";
import { Icon } from "@/lib/icons";
import Modal from "@/components/Modal";
import {
  LuArrowRightLeft,
  LuPlus,
  LuTrash2,
  LuRepeat2,
  LuCalendarClock,
  LuChevronLeft,
  LuChevronRight,
  LuArrowUp,
  LuArrowDown,
  LuClock,
} from "react-icons/lu";

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
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [recurrings, setRecurrings] = useState<RecurringTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", currency: "IDR", defaultCategoryId: "", language: "id" });
  const [activeTab, setActiveTab] = useState<Tab>("transfer");
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editRecurring, setEditRecurring] = useState<RecurringTransaction | null>(null);

  // Transfer form
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [transferDate, setTransferDate] = useState(getToday());
  const [transferErrors, setTransferErrors] = useState<Record<string, string>>({});

  // Recurring form
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

  const loadData = useCallback(() => {
    setAccounts(getAccounts());
    setTransfers(getTransfers());
    setRecurrings(getRecurringTransactions());
    setCategories(getCategories());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeAccounts = accounts.filter((a) => a.isActive);

  // ─── Transfer ─────────────────────────────────────────────────

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
  };

  const handleDeleteTransfer = (id: string) => {
    if (confirm("Yakin ingin menghapus transfer ini?")) {
      deleteTransfer(id);
      loadData();
    }
  };

  // ─── Recurring ────────────────────────────────────────────────

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
    } else {
      addRecurringTransaction(data);
    }
    setShowRecurringForm(false);
    loadData();
  };

  const handleToggleRecurring = (r: RecurringTransaction) => {
    updateRecurringTransaction(r.id, { active: !r.active });
    loadData();
  };

  const handleDeleteRecurring = (id: string) => {
    if (confirm("Yakin ingin menghapus transaksi berulang ini?")) {
      deleteRecurringTransaction(id);
      loadData();
    }
  };

  // Sort transfers by date desc
  const sortedTransfers = [...transfers].sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
  const sortedRecurrings = [...recurrings].sort((a, b) => b.nextDate.localeCompare(a.nextDate));

  const getAccountName = (id: string) => accounts.find((a) => a.id === id)?.name || "Akun tidak ditemukan";

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Transfer & Berulang
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Transfer antar akun & transaksi otomatis
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        <button
          onClick={() => setActiveTab("transfer")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
            activeTab === "transfer"
              ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <LuArrowRightLeft size={16} />
          <span>Transfer</span>
        </button>
        <button
          onClick={() => setActiveTab("recurring")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
            activeTab === "recurring"
              ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300"
              : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
          }`}
        >
          <LuRepeat2 size={16} />
          <span>Berulang</span>
        </button>
      </div>

      {/* ─── TRANSFER TAB ─────────────────────────────────────── */}
      {activeTab === "transfer" && (
        <>
          <button
            onClick={() => {
              resetTransferForm();
              setShowTransferForm(true);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-4 text-sm font-medium text-zinc-400 transition-all hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:hover:border-emerald-500"
          >
            <LuPlus size={20} />
            Transfer Antar Akun
          </button>

          {/* Transfer List */}
          {sortedTransfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <LuArrowRightLeft size={32} />
              </div>
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                Belum ada transfer
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Pindahkan uang antar akun dengan mudah
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedTransfers.map((tr) => {
                const fromAcc = accounts.find((a) => a.id === tr.fromAccountId);
                const toAcc = accounts.find((a) => a.id === tr.toAccountId);
                return (
                  <div
                    key={tr.id}
                    className="group relative rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex items-center gap-1 text-zinc-400">
                          <Icon name={fromAcc?.icon || "wallet"} size={16} />
                          <LuArrowRightLeft size={14} className="text-emerald-500" />
                          <Icon name={toAcc?.icon || "wallet"} size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {fromAcc?.name || "?"} → {toAcc?.name || "?"}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {formatDate(tr.transactionDate)}
                            {tr.note && ` · ${tr.note}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tr.amount, settings.currency)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransfer(tr.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500 opacity-0 transition-opacity hover:bg-red-100 group-hover:opacity-100 dark:bg-red-950/30 dark:text-red-400"
                        >
                          <LuTrash2 size={14} />
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

      {/* ─── RECURRING TAB ────────────────────────────────────── */}
      {activeTab === "recurring" && (
        <>
          {/* Quick Add */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => openAddRecurring("income")}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-emerald-300 py-4 text-emerald-600 transition-all hover:border-emerald-400 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              <LuArrowUp size={20} />
              <span className="text-xs font-semibold">Gaji</span>
            </button>
            <button
              onClick={() => openAddRecurring("expense")}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-red-300 py-4 text-red-600 transition-all hover:border-red-400 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
            >
              <LuArrowDown size={20} />
              <span className="text-xs font-semibold">Tagihan</span>
            </button>
            <button
              onClick={() => openAddRecurring("transfer")}
              className="flex flex-col items-center gap-1 rounded-xl border-2 border-dashed border-blue-300 py-4 text-blue-600 transition-all hover:border-blue-400 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30"
            >
              <LuArrowRightLeft size={20} />
              <span className="text-xs font-semibold">Transfer Rutin</span>
            </button>
          </div>

          {/* Recurring List */}
          {sortedRecurrings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                <LuRepeat2 size={32} />
              </div>
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                Belum ada transaksi berulang
              </h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Atur pembayaran rutin seperti gaji, asuransi, pinjaman, dll
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedRecurrings.map((r) => {
                const isDue = r.nextDate <= getToday();
                const cat = categories.find((c) => c.id === r.categoryId);
                const acc = accounts.find((a) => a.id === (r.type === "transfer" ? r.fromAccountId : r.accountId));
                return (
                  <div
                    key={r.id}
                    className={`group relative rounded-xl border p-4 transition-all dark:bg-zinc-900 ${
                      !r.active
                        ? "border-zinc-200 opacity-50 dark:border-zinc-800"
                        : isDue
                        ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
                        : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                            r.type === "income"
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                              : r.type === "expense"
                              ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
                          }`}
                        >
                          {r.type === "income" ? <LuArrowUp size={20} /> : r.type === "expense" ? <LuArrowDown size={20} /> : <LuArrowRightLeft size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                            {getRecurringLabel(r.label)}
                          </p>
                          <p className="text-xs text-zinc-400">
                            {FREQUENCY_LABELS[r.frequency]} {r.interval > 1 ? `(${r.interval}x)` : ""}
                            {r.note && ` · ${r.note}`}
                          </p>
                          {isDue && r.active && (
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                              🕐 Jatuh tempo! ({formatDate(r.nextDate)})
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-sm font-bold ${
                            r.type === "income"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : r.type === "expense"
                              ? "text-red-600 dark:text-red-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        >
                          {r.type === "income" ? "+" : r.type === "expense" ? "-" : ""}
                          {formatCurrency(r.amount, settings.currency)}
                        </span>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleToggleRecurring(r)}
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition-colors ${
                              r.active
                                ? "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800"
                                : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400"
                            }`}
                          >
                            {r.active ? "Nonaktifkan" : "Aktifkan"}
                          </button>
                          <button
                            onClick={() => openEditRecurring(r)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400 hover:bg-zinc-200 dark:bg-zinc-800"
                          >
                            <LuCalendarClock size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteRecurring(r.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-100 dark:bg-red-950/30"
                          >
                            <LuTrash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {/* Progress info */}
                    <div className="mt-2 flex gap-2 text-[10px] text-zinc-400">
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

      {/* ─── TRANSFER FORM MODAL ────────────────────────────────── */}
      <Modal
        isOpen={showTransferForm}
        onClose={() => setShowTransferForm(false)}
        title="Transfer Antar Akun"
      >
        <div className="space-y-4">
          {/* From Account */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Dari Akun
            </label>
            <select
              value={transferFrom}
              onChange={(e) => setTransferFrom(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                transferErrors.from
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
              }`}
            >
              <option value="">Pilih akun asal</option>          {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance, settings.currency)})
                  </option>
                ))}
            </select>
          </div>

          {/* To Account */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ke Akun
            </label>
            <select
              value={transferTo}
              onChange={(e) => setTransferTo(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                transferErrors.to
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
              }`}
            >
              <option value="">Pilih akun tujuan</option>
              {activeAccounts
                .filter((a) => a.id !== transferFrom)
                .map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </option>
                ))}
            </select>
            {transferErrors.to && <p className="mt-1 text-xs text-red-500">{transferErrors.to}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nominal
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className={`w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  transferErrors.amount
                    ? "border-red-400 focus:ring-red-400"
                    : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
                }`}
              />
            </div>
            {transferErrors.amount && <p className="mt-1 text-xs text-red-500">{transferErrors.amount}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tanggal</label>
            <input
              type="date"
              value={transferDate}
              onChange={(e) => setTransferDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Catatan <span className="text-zinc-400">(opsional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Transfer bulanan"
              value={transferNote}
              onChange={(e) => setTransferNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowTransferForm(false)}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Batal
            </button>
            <button
              onClick={handleAddTransfer}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              Transfer
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── RECURRING FORM MODAL ──────────────────────────────── */}
      <Modal
        isOpen={showRecurringForm}
        onClose={() => {
          setShowRecurringForm(false);
          setEditRecurring(null);
        }}
        title={editRecurring ? "Edit Transaksi Berulang" : "Transaksi Berulang"}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Tipe</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecType("income")}
                className={`rounded-xl py-2.5 text-xs font-medium transition-all ${
                  recType === "income"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <LuArrowUp size={14} className="mx-auto mb-0.5" />
                Gaji/Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setRecType("expense")}
                className={`rounded-xl py-2.5 text-xs font-medium transition-all ${
                  recType === "expense"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <LuArrowDown size={14} className="mx-auto mb-0.5" />
                Tagihan
              </button>
              <button
                type="button"
                onClick={() => setRecType("transfer")}
                className={`rounded-xl py-2.5 text-xs font-medium transition-all ${
                  recType === "transfer"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800"
                }`}
              >
                <LuArrowRightLeft size={14} className="mx-auto mb-0.5" />
                Transfer
              </button>
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Label</label>
            <select
              value={recLabel}
              onChange={(e) => setRecLabel(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {RECURRING_LABELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">Rp</span>
              <input
                type="number"
                placeholder="0"
                value={recAmount}
                onChange={(e) => setRecAmount(e.target.value)}
                className={`w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  recErrors.amount
                    ? "border-red-400 focus:ring-red-400"
                    : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
                }`}
              />
            </div>
            {recErrors.amount && <p className="mt-1 text-xs text-red-500">{recErrors.amount}</p>}
          </div>

          {/* Category (for income/expense) */}
          {recType !== "transfer" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Kategori</label>
              <select
                value={recCategoryId}
                onChange={(e) => setRecCategoryId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {(recType === "income" ? incomeCategories : expenseCategories).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Account selection */}
          {recType === "transfer" ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Dari Akun</label>
                <select
                  value={recFromAccount}
                  onChange={(e) => setRecFromAccount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  {activeAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Ke Akun</label>
                <select
                  value={recToAccount}
                  onChange={(e) => setRecToAccount(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  {activeAccounts.filter((a) => a.id !== recFromAccount).map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Akun</label>
              <select
                value={recAccountId}
                onChange={(e) => setRecAccountId(e.target.value)}
                className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  recErrors.account
                    ? "border-red-400 focus:ring-red-400"
                    : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
                }`}
              >
                {activeAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Frekuensi</label>
              <select
                value={recFrequency}
                onChange={(e) => setRecFrequency(e.target.value as RecurringFrequency)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="daily">Setiap Hari</option>
                <option value="weekly">Setiap Minggu</option>
                <option value="monthly">Setiap Bulan</option>
                <option value="yearly">Setiap Tahun</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Interval</label>
              <input
                type="number"
                min={1}
                value={recInterval}
                onChange={(e) => setRecInterval(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mulai Tanggal</label>
            <input
              type="date"
              value={recStartDate}
              onChange={(e) => setRecStartDate(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Catatan <span className="text-zinc-400">(opsional)</span></label>
            <input
              type="text"
              placeholder="e.g. Gaji bulanan"
              value={recNote}
              onChange={(e) => setRecNote(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setShowRecurringForm(false);
                setEditRecurring(null);
              }}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Batal
            </button>
            <button
              onClick={handleAddRecurring}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              {editRecurring ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
