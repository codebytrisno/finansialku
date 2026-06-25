"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
} from "@/lib/store";
import { type Category, type TransactionType } from "@/lib/types";
import { Icon } from "@/lib/icons";
import CategoryForm from "@/components/CategoryForm";
import Modal from "@/components/Modal";
import { LuPencil, LuTrash2, LuPlus, LuArrowDown, LuArrowUp } from "react-icons/lu";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const loadData = useCallback(() => {
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = (data: {
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
    parentId: string | null;
  }) => {
    addCategory(data);
    setShowForm(false);
    loadData();
  };

  const handleEdit = (cat: Category) => {
    setEditCategory(cat);
    setShowForm(true);
  };

  const handleUpdate = (data: {
    name: string;
    type: TransactionType;
    color: string;
    icon: string;
    parentId: string | null;
  }) => {
    if (editCategory) {
      updateCategory(editCategory.id, data);
      setEditCategory(null);
      setShowForm(false);
      loadData();
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus kategori ini? Transaksi dengan kategori ini tidak akan terhapus.")) {
      deleteCategory(id);
      loadData();
    }
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const CategoryGrid = ({ cats }: { cats: Category[] }) => (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {cats.map((cat) => (
        <div
          key={cat.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: cat.color + "20" }}
            >
              <Icon name={cat.icon} size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {cat.name}
              </p>
              <p className="text-xs text-zinc-400">{cat.type === "income" ? "Pemasukan" : "Pengeluaran"}</p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => handleEdit(cat)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              title="Edit"
            >
              <LuPencil size={16} />
            </button>
            <button
              onClick={() => handleDelete(cat.id)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
              title="Hapus"
            >
              <LuTrash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Kategori
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {categories.length} kategori
          </p>
        </div>
        <button
          onClick={() => {
            setEditCategory(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <LuPlus size={18} />
          <span className="hidden sm:inline">Tambah</span>
        </button>
      </div>

      {/* Expense Categories */}
      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
          <LuArrowDown size={16} />
          Pengeluaran
        </h2>
        {expenseCategories.length === 0 ? (
          <p className="text-sm text-zinc-400">Belum ada kategori pengeluaran</p>
        ) : (
          <CategoryGrid cats={expenseCategories} />
        )}
      </div>

      {/* Income Categories */}
      <div>
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <LuArrowUp size={16} />
          Pemasukan
        </h2>
        {incomeCategories.length === 0 ? (
          <p className="text-sm text-zinc-400">Belum ada kategori pemasukan</p>
        ) : (
          <CategoryGrid cats={incomeCategories} />
        )}
      </div>

      {/* Category Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditCategory(null);
        }}
        title={editCategory ? "Edit Kategori" : "Tambah Kategori"}
      >
        <CategoryForm
          initialData={editCategory}
          onSubmit={editCategory ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditCategory(null);
          }}
        />
      </Modal>
    </div>
  );
}
