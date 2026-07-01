"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAccounts,
  addAccount,
  updateAccount,
  deleteAccount,
  getSettings,
} from "@/lib/store";
import { type Account, type AccountType } from "@/lib/types";
import { getAccountTypeLabel, getAccountTypeColor, formatCurrency, getCurrencySymbol, formatNumberInput, parseNumberInput } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

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
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState(getSettings());
  const [showForm, setShowForm] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<AccountType>("cash");
  const [formBalance, setFormBalance] = useState("");
  const [formColor, setFormColor] = useState("#22c55e");
  const [formIcon, setFormIcon] = useState("wallet");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const COLORS = [
    "#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6",
    "#06b6d4", "#ec4899", "#f97316", "#10b981", "#6366f1",
    "#6b7280",
  ];

  const ACCOUNT_ICONS = ["wallet", "bank", "credit-card", "piggy-bank", "landmark", "banknote", "trending-up", "folder"];

  const loadData = useCallback(() => {
    setAccounts(getAccounts());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      setLoading(false);
    });
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
      showToast("Akun berhasil diperbarui");
    } else {
      addAccount(data);
      showToast("Akun berhasil ditambahkan");
    }

    setShowForm(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const currency = settings.currency;

  return (
    <div className="mx-auto max-w-container-max space-y-stack-lg pb-24 lg:pb-0">
      {loading && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <Skeleton className="h-[160px] sm:h-[220px] rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-stack-lg">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[160px] sm:h-[200px]" />
            ))}
          </div>
        </>
      )}
      {!loading && (
        <>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-label-md sm:text-headline-lg font-bold text-on-surface truncate">
            Dompet & Rekening
          </h1>
          <p className="text-label-xs sm:text-body-md text-on-surface-variant truncate">
            {accounts.length} akun &middot; Total: <span className={totalBalance < 0 ? 'text-error' : ''}>{formatCurrency(totalBalance, currency)}</span>
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1 sm:gap-2 rounded-xl bg-primary px-3 py-2 sm:px-5 sm:py-2.5 text-label-xs sm:text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container shrink-0"
        >
          <MaterialSymbol icon="add" size={16} />
          <span className="hidden sm:inline">Tambah Akun</span>
        </button>
      </div>

      {/* Total Balance Hero */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-inverse-surface p-5 sm:p-8 text-on-primary-container flex flex-col justify-center min-h-[160px] sm:min-h-[220px]">
        <div className="relative z-10 space-y-3 sm:space-y-4">
          <div>
            <p className="text-label-xs sm:text-label-md font-bold opacity-80 mb-1">
              Total Saldo Seluruh Akun
            </p>
            <h2 className={`text-headline-md sm:text-display font-bold tabular-nums tracking-tighter break-all ${totalBalance < 0 ? 'text-error' : ''}`}>
              {formatCurrency(totalBalance, currency)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 pt-1 sm:pt-2">
            <button
              onClick={openAddForm}
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-on-primary rounded-xl font-bold text-label-xs sm:text-label-md shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
            >
              <MaterialSymbol icon="add_circle" size={16} />
              Tambah Akun
            </button>
          </div>
        </div>
      </section>

      {/* Account Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-stack-lg">
        {accounts.map((acc) => (
          <div
            key={acc.id}
            onClick={() => router.push(`/transactions?accountId=${acc.id}`)}
            className="rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col justify-between min-h-[160px] sm:min-h-[200px] group relative cursor-pointer"
            style={{ backgroundColor: acc.color + "0d", borderColor: acc.color + "30", borderWidth: 1 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div
                  className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: acc.color + "20", color: acc.color }}
                >
                  <Icon name={acc.icon} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-label-md sm:text-headline-md font-bold text-on-surface truncate">
                    {acc.name}
                  </h3>
                  <p className="text-label-xs sm:text-label-sm text-on-surface-variant truncate">
                    {getAccountTypeLabel(acc.type)}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => openEditForm(acc)}
                  className="p-1.5 sm:p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95"
                  aria-label="Edit akun"
                >
                  <MaterialSymbol icon="edit" size={18} />
                </button>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1.5 sm:p-2 text-error hover:bg-error-container rounded-lg transition-colors active:scale-95"
                  aria-label="Hapus akun"
                >
                  <MaterialSymbol icon="delete" size={18} />
                </button>
              </div>
            </div>
            <div className="mt-auto pt-3 sm:pt-0">
              <p className="text-label-xs sm:text-label-sm font-bold text-on-surface-variant mb-0.5 sm:mb-1">
                Saldo Tersedia
              </p>
              <p className={`text-tabular-nums font-bold text-label-md sm:text-headline-md truncate ${acc.balance < 0 ? 'text-error' : 'text-on-surface'}`}>
                {formatCurrency(acc.balance, currency)}
              </p>
            </div>
          </div>
        ))}

        {/* Add Account Card */}
        <button
          onClick={openAddForm}
          className="group border-2 border-dashed border-outline-variant rounded-xl sm:rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center gap-3 sm:gap-4 min-h-[140px] sm:min-h-[200px] hover:border-primary/50 hover:bg-surface-container-low transition-all"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
            <MaterialSymbol icon="add" size={20} />
          </div>
          <div className="text-center">
            <p className="text-label-sm sm:text-label-md font-bold text-on-surface">
              Tambah Akun Baru
            </p>
            <p className="text-label-xs sm:text-label-sm text-on-surface-variant">
              Hubungkan bank atau e-wallet
            </p>
          </div>
        </button>
      </section>

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
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              Nama Akun
            </label>
            <input
              type="text"
              placeholder="e.g. Dompet Cash, BCA, GoPay, dll"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
                errors.name
                  ? "border-error"
                  : "border-outline-variant"
              }`}
            />
            {errors.name && <p className="mt-1 text-label-sm text-error">{errors.name}</p>}
          </div>

          {/* Account Type */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              Tipe Akun
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                      ? "bg-primary text-on-primary shadow-sm"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              {editAccount ? "Saldo Saat Ini" : "Saldo Awal"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-label-md font-semibold text-on-surface-variant">
                {getCurrencySymbol(currency)}
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumberInput(formBalance)}
                onChange={(e) => setFormBalance(parseNumberInput(e.target.value))}
                className={`w-full bg-surface-container-low border rounded-xl py-3 pl-12 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.balance
                    ? "border-error"
                    : "border-outline-variant"
                }`}
              />
            </div>
            {errors.balance && <p className="mt-1 text-label-sm text-error">{errors.balance}</p>}
          </div>

          {/* Color */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              Warna
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`h-9 w-9 sm:h-8 sm:w-8 rounded-xl transition-all ${
                    formColor === c
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-container-low"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Icon */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
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
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
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
              className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
            >
              {editAccount ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Hapus Akun"
        message="Yakin ingin menghapus akun ini?"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteAccount(deleteConfirm);
            loadData();
            showToast("Akun berhasil dihapus");
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
        </>
      )}
    </div>
  );
}
