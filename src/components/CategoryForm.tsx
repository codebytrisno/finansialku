"use client";

import { useState } from "react";
import { type Category, type TransactionType } from "@/lib/types";
import { Icon, CATEGORY_ICON_NAMES } from "@/lib/icons";
import { getTopLevelCategories } from "@/lib/store";
import { LuArrowDown, LuArrowUp } from "react-icons/lu";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#6b7280",
];

interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: {
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
    parentId: string | null;
  }) => void;
  onCancel: () => void;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<TransactionType>(initialData?.type || "expense");
  const [color, setColor] = useState(initialData?.color || "#22c55e");
  const [icon, setIcon] = useState(initialData?.icon || "wallet");
  const [parentId, setParentId] = useState<string | null>(initialData?.parentId || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topCategories = getTopLevelCategories(type);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = "Nama kategori wajib diisi";
    }
    if (parentId && parentId === initialData?.id) {
      newErrors.parentId = "Kategori tidak bisa menjadi sub-kategori dari dirinya sendiri";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      type,
      color,
      icon,
      parentId,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type Toggle */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tipe Kategori
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setParentId(null);
            }}
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
            onClick={() => {
              setType("income");
              setParentId(null);
            }}
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

      {/* Name */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Nama Kategori
        </label>
        <input
          type="text"
          placeholder="Nama kategori..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 transition-colors focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
            errors.name
              ? "border-red-400 focus:ring-red-400"
              : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700 dark:focus:ring-emerald-400"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      {/* Parent Category (Sub-Category) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Kategori Induk <span className="text-zinc-400">(opsional)</span>
        </label>
        <p className="mb-2 text-xs text-zinc-400">
          Pilih kategori induk jika ini adalah sub-kategori
        </p>
        <select
          value={parentId || ""}
          onChange={(e) => setParentId(e.target.value || null)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Kategori Utama (bukan sub-kategori)</option>
          {topCategories
            .filter((c) => c.id !== initialData?.id)
            .map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
        </select>
        {parentId && (
          <p className="mt-1 text-xs text-emerald-500">
            Akan menjadi sub-kategori
          </p>
        )}
        {errors.parentId && (
          <p className="mt-1 text-xs text-red-500">{errors.parentId}</p>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Warna
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-xl transition-all ${
                color === c
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
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Ikon
        </label>
        <div className="grid grid-cols-7 gap-2">
          {CATEGORY_ICON_NAMES.map((iconName) => (
            <button
              key={iconName}
              type="button"
              onClick={() => setIcon(iconName)}
              className={`flex items-center justify-center rounded-xl p-2.5 transition-all ${
                icon === iconName
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
    </form>
  );
}
