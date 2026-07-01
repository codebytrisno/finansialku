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
import { MaterialSymbol } from "@/components/MaterialSymbol";
import CategoryForm from "@/components/CategoryForm";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [formPresetParent, setFormPresetParent] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      setLoading(false);
    });
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
    setFormPresetParent(null);
    loadData();
    showToast("Kategori berhasil ditambahkan");
  };

  const handleEdit = (cat: Category) => {
    setEditCategory(cat);
    setFormPresetParent(null);
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
      setFormPresetParent(null);
      loadData();
      showToast("Kategori berhasil diperbarui");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const handleAddSub = (parentId: string) => {
    setEditCategory(null);
    setFormPresetParent(parentId);
    setShowForm(true);
  };

  const openAddForm = () => {
    setEditCategory(null);
    setFormPresetParent(null);
    setShowForm(true);
  };

  const parentCategories = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  const CategorySection = ({
    type,
    icon,
    title,
    titleColor,
    iconBgClass,
    dotColorClass,
  }: {
    type: "expense" | "income";
    icon: string;
    title: string;
    titleColor: string;
    iconBgClass: string;
    dotColorClass: string;
  }) => {
    const cats = parentCategories.filter((c) => c.type === type);

    return (
      <section className="space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 sm:gap-3 pb-2 border-b border-outline-variant">
          <MaterialSymbol icon={icon} fill className={titleColor} size={20} />
          <h2 className="text-label-md sm:text-headline-md font-bold text-on-surface">
            {title}
          </h2>
        </div>
        {cats.length === 0 ? (
          <p className="text-body-md text-on-surface-variant py-8 text-center">
            Belum ada kategori {title.toLowerCase()}
          </p>
        ) : (
          <div className="space-y-4">
            {cats.map((cat) => {
              const children = getChildren(cat.id);
              return (
                <div
                  key={cat.id}
                  className="bg-surface-container-lowest p-3 sm:p-4 rounded-xl shadow-sm border border-outline-variant/30 transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: cat.color + "20", color: cat.color }}
                      >
                        <Icon name={cat.icon} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-label-sm sm:text-body-md font-bold text-on-surface truncate">
                          {cat.name}
                        </h3>
                        <p className="text-label-xs sm:text-label-sm text-on-surface-variant truncate">
                          {children.length} Sub-kategori
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-1.5 sm:p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95"
                        title="Edit"
                      >
                        <MaterialSymbol icon="edit" size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 sm:p-2 text-error hover:bg-error-container rounded-lg transition-colors active:scale-95"
                        title="Hapus"
                      >
                        <MaterialSymbol icon="delete" size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2 pl-0 sm:pl-16">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="bg-surface p-1.5 sm:p-2 rounded-lg flex items-center gap-1 border border-outline-variant/20"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-label-xs sm:text-label-sm text-on-surface truncate flex-1">
                          {child.name}
                        </span>
                        <button
                          onClick={() => handleEdit(child)}
                          className="shrink-0 p-0.5 text-outline hover:text-on-surface-variant transition-colors"
                          title="Edit"
                        >
                          <MaterialSymbol icon="edit" size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(child.id)}
                          className="shrink-0 p-0.5 text-outline hover:text-error transition-colors"
                          title="Hapus"
                        >
                          <MaterialSymbol icon="delete" size={12} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddSub(cat.id)}
                      className="p-1.5 sm:p-2 rounded-lg border border-dashed border-outline-variant flex items-center justify-center gap-0.5 sm:gap-1 hover:bg-surface-container-low transition-colors"
                    >
                      <MaterialSymbol icon="add" size={12} />
                      <span className="text-label-xs sm:text-label-sm text-on-surface-variant">Sub</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-container-max space-y-stack-lg pb-24 lg:pb-0">
      {loading && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-stack-lg">
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <div className="space-y-3 sm:space-y-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          </div>
        </>
      )}
      {!loading && (
        <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-label-md sm:text-headline-lg font-bold text-on-surface truncate">
            Kelola Kategori
          </h1>
          <p className="text-label-xs sm:text-body-md text-on-surface-variant truncate">
            Atur kategori keuangan Anda untuk pelaporan yang lebih akurat.
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl bg-primary px-4 sm:px-6 py-2 sm:py-3 text-label-xs sm:text-label-md font-bold text-on-primary shadow-sm hover:brightness-110 active:scale-95 transition-all shrink-0"
        >
          <MaterialSymbol icon="add_circle" size={18} />
          <span>Tambah Kategori</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-stack-lg">
        <CategorySection
          type="expense"
          icon="arrow_circle_down"
          title="Pengeluaran"
          titleColor="text-error"
          iconBgClass="bg-error-container"
          dotColorClass="bg-error"
        />
        <CategorySection
          type="income"
          icon="arrow_circle_up"
          title="Pemasukan"
          titleColor="text-primary"
          iconBgClass="bg-primary-container/20"
          dotColorClass="bg-primary"
        />
      </div>

      {/* Category Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditCategory(null);
          setFormPresetParent(null);
        }}
        title={editCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
      >
        <CategoryForm
          initialData={editCategory}
          presetParentId={formPresetParent}
          onSubmit={editCategory ? handleUpdate : handleAdd}
          onCancel={() => {
            setShowForm(false);
            setEditCategory(null);
            setFormPresetParent(null);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Hapus Kategori"
        message="Yakin ingin menghapus kategori ini? Transaksi dengan kategori ini tidak akan terhapus."
        onConfirm={() => {
          if (deleteConfirm) {
            deleteCategory(deleteConfirm);
            loadData();
            showToast("Kategori berhasil dihapus");
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
