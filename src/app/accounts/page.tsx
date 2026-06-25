"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
} from "@/lib/store";
import { type Account, type AccountType } from "@/lib/types";
import { getAccountTypeLabel, getAccountTypeColor, formatCurrency } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import Modal from "@/components/Modal";
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuCircleDollarSign,
} from "react-icons/lu";

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

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("cash");
  const [formBalance, setFormBalance] = useState("");
  const [formColor, setFormColor] = useState("#22c55e");
  const [formIcon, setFormIcon] = useState("wallet");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const COLORS = [
    "#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#ec4899", "#f97316", "#10b981", "#6366f1",
    "#6b7280",
  ];

  const ACCOUNT_ICONS = ["wallet", "bank", "credit-card", "piggy-bank", "landmark", "banknote", "trending-up", "folder"];

  const loadData = useCallback(() => {
    setAccounts(getAccounts());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormName("");
    setFormType("cash");
    setFormBalance("0");
    setFormColor("#22c55e");
    setFormIcon("wallet");
    setErrors({});
  };

  const openAddForm = () => {
    setEditAccount(null);
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (acc: Account) => {
    setEditAccount(acc);
    setFormName(acc.name);
    setFormType(acc.type);
    setFormBalance(acc.balance.toString());
    setFormColor(acc.color);
    setFormIcon(acc.icon);
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formName.trim()) newErrors.name = "Nama akun wajib diisi";
    const bal = parseFloat(formBalance);
    if (isNaN(bal) || bal < 0) newErrors.balance = "Saldo awal harus angka valid";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const data = {
      name: formName.trim(),
      type: formType,
      balance: parseFloat(formBalance) || 0,
      color: formColor,
      icon: formIcon,
      isActive: true,
    };

    if (editAccount) {
      updateAccount(editAccount.id, data);
    } else {
      addAccount(data);
    }

    setShowForm(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus akun ini?")) {
      deleteAccount(id);
      loadData();
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = "IDR";

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Dompet & Rekening
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {accounts.length} akun &middot; Total: {formatCurrency(totalBalance, currency)}
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <LuPlus size={18} />
          <span className="hidden sm:inline">Tambah Akun</span>
        </button>
      </div>

      {/* Total Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white shadow-lg">
        <p className="text-sm font-medium text-emerald-100">Total Kekayaan</p>
        <p className="mt-1 text-3xl font-bold tracking-tight">
          {formatCurrency(totalBalance, currency)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {accounts.map((acc) => (
            <span
              key={acc.id}
              className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm"
            >
              <Icon name={acc.icon} size={12} />
              {acc.name}
            </span>
          ))}
        </div>
      </div>

      {/* Account List */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            className="group relative rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white"
                  style={{ backgroundColor: acc.color }}
                >
                  <Icon name={acc.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {acc.name}
                  </h3>
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: getAccountTypeColor(acc.type) + "20",
                      color: getAccountTypeColor(acc.type),
                    }}
                  >
                    {getAccountTypeLabel(acc.type)}
                  </span>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => openEditForm(acc)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                >
                  <LuPencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  <LuTrash2 size={14} />
                </button>
              </div>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="text-xs text-zinc-400">Saldo</p>
                <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatCurrency(acc.balance, currency)}
                </p>
              </div>
              <div className="flex gap-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                  <LuCircleDollarSign size={14} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Account Card */}
        <button
          onClick={openAddForm}
          className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-zinc-300 p-5 text-zinc-400 transition-all hover:border-emerald-400 hover:text-emerald-500 dark:border-zinc-700 dark:hover:border-emerald-500"
        >
          <LuPlus size={24} />
          <span className="text-sm font-medium">Tambah Akun Baru</span>
        </button>
      </div>

      {/* Account Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditAccount(null);
        }}
        title={editAccount ? "Edit Akun" : "Tambah Akun"}
      >
        <div className="space-y-4">
          {/* Account Name */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Nama Akun
            </label>
            <input
              type="text"
              placeholder="e.g. Dompet Cash, BCA, GoPay, dll"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                errors.name
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Account Type */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tipe Akun
            </label>
            <div className="grid grid-cols-4 gap-2">
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
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {editAccount ? "Saldo Saat Ini" : "Saldo Awal"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={formBalance}
                onChange={(e) => setFormBalance(e.target.value)}
                className={`w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  errors.balance
                    ? "border-red-400 focus:ring-red-400"
                    : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
                }`}
              />
            </div>
            {errors.balance && <p className="mt-1 text-xs text-red-500">{errors.balance}</p>}
          </div>

          {/* Color */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`h-8 w-8 rounded-xl transition-all ${
                    formColor === c
                      ? "ring-2 ring-zinc-900 ring-offset-2 dark:ring-zinc-100 dark:ring-offset-zinc-900"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ikon
            </label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setFormIcon(iconName)}
                  className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${
                    formIcon === iconName
                      ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                  }`}
                >
                  <Icon name={iconName} size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditAccount(null);
              }}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              {editAccount ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
