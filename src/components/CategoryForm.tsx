"use client";

import { useState } from "react";
import { type Category, type TransactionType } from "@/lib/types";
import { Icon, CATEGORY_ICON_NAMES } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { getTopLevelCategories } from "@/lib/store";

const COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#22c55e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6", "#6366f1",
  "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e",
  "#6b7280",
];

interface CategoryFormProps {
  initialData?: Category | null;
  presetParentId?: string | null;
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
  presetParentId,
  onSubmit,
  onCancel,
}: CategoryFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<TransactionType>(initialData?.type || "expense");
  const [color, setColor] = useState(initialData?.color || "#22c55e");
  const [icon, setIcon] = useState(initialData?.icon || "wallet");
  const [parentId, setParentId] = useState<string | null>(
    initialData?.parentId || presetParentId || null
  );
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div className="space-y-1.5">
        <label className="text-label-md text-on-surface-variant">
          Jenis
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setParentId(presetParentId || null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${
              type === "expense"
                ? "border-2 border-primary bg-primary/5 text-primary"
                : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <MaterialSymbol icon="arrow_circle_down" />
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType("income");
              setParentId(presetParentId || null);
            }}
            className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition-all ${
              type === "income"
                ? "border-2 border-primary bg-primary/5 text-primary"
                : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <MaterialSymbol icon="arrow_circle_up" />
            Pemasukan
          </button>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-label-md text-on-surface-variant">
          Nama Kategori
        </label>
        <input
          type="text"
          placeholder="Contoh: Hiburan"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full bg-surface-container-low border rounded-xl px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
            errors.name
              ? "border-error"
              : "border-outline-variant"
          }`}
        />
        {errors.name && (
          <p className="mt-1 text-label-sm text-error">{errors.name}</p>
        )}
      </div>

      {!initialData && (
        <div className="space-y-1.5">
          <label className="text-label-md text-on-surface-variant">
            Kategori Induk <span className="text-on-surface-variant opacity-60">(opsional)</span>
          </label>
          <p className="text-label-sm text-on-surface-variant">
            Pilih kategori induk jika ini adalah sub-kategori
          </p>
          <select
            value={parentId || ""}
            onChange={(e) => setParentId(e.target.value || null)}
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-4 py-3 text-body-md text-on-surface outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Kategori Utama (bukan sub-kategori)</option>
            {topCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
          </select>
          {parentId && (
            <p className="mt-1 text-label-sm text-tertiary">
              Akan menjadi sub-kategori
            </p>
          )}
          {errors.parentId && (
            <p className="mt-1 text-label-sm text-error">{errors.parentId}</p>
          )}
        </div>
      )}

      {/* Color */}
      <div className="space-y-1.5">
        <label className="text-label-md text-on-surface-variant">
          Warna &amp; Ikon
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-10 w-10 rounded-full transition-all ${
                color === c
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-surface"
                  : ""
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
        {CATEGORY_ICON_NAMES.map((iconName) => (
          <button
            key={iconName}
            type="button"
            onClick={() => setIcon(iconName)}
            className={`flex items-center justify-center rounded-lg sm:rounded-xl p-2 sm:p-2.5 transition-all ${
              icon === iconName
                ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            }`}
          >
            <Icon name={iconName} size={16} />
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-outline-variant py-3 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-primary py-3 text-label-md font-semibold text-on-primary shadow-sm hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98]"
        >
          {initialData ? "Simpan" : "Tambah"}
        </button>
      </div>
    </form>
  );
}
