"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getTransactions,
  getCategories,
  getBudgets,
  addBudget,
  updateBudget,
  deleteBudget,
  getSettings,
} from "@/lib/store";
import {
  type Budget,
  type BudgetPeriod,
  type Transaction,
  type Category,
  type AppSettings,
} from "@/lib/types";
import {
  formatCurrency,
  getCurrencySymbol,
  formatNumberInput,
  parseNumberInput,
  getCurrentMonth,
  getCurrentYear,
  getMonthLabel,
  getMonthRange,
  getWeekStart,
  getWeekLabel,
  calculateBudgetProgress,
  getTotalBudget,
  getTotalSpent,
} from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import SummaryCard from "@/components/SummaryCard";
import Modal from "@/components/Modal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/components/Toast";
import { Skeleton } from "@/components/Skeleton";

type Tab = "monthly" | "weekly" | "yearly";

export default function BudgetsPage() {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ theme: "system", currency: "IDR", defaultCategoryId: "", language: "id" });

  const [activeTab, setActiveTab] = useState<Tab>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());

  const [showForm, setShowForm] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formPeriod, setFormPeriod] = useState<BudgetPeriod>("monthly");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setBudgets(getBudgets());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      setLoading(false);
    });
  }, [loadData]);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  const getReference = (): string => {
    if (activeTab === "weekly") return selectedWeek;
    if (activeTab === "yearly") return selectedYear;
    return selectedMonth;
  };

  const reference = getReference();
  const budgetProgress = useMemo(
    () => calculateBudgetProgress(budgets, transactions, categories, activeTab, reference),
    [budgets, transactions, categories, activeTab, reference]
  );

  const totalBudget = getTotalBudget(budgets, activeTab, reference);
  const totalSpent = getTotalSpent(budgets, transactions, activeTab, reference);
  const remainingBudget = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  const currentBudgets = budgets.filter((b) => b.period === activeTab && b.month === reference);

  const openAddForm = () => {
    setEditBudget(null);
    setFormCategoryId(expenseCategories[0]?.id || "");
    setFormAmount("");
    setFormPeriod(activeTab);
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (b: Budget) => {
    setEditBudget(b);
    setFormCategoryId(b.categoryId);
    setFormAmount(b.amount.toString());
    setFormPeriod(b.period);
    setErrors({});
    setShowForm(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formCategoryId) newErrors.categoryId = "Pilih kategori";
    if (!formAmount || parseFloat(formAmount) <= 0) newErrors.amount = "Nominal harus lebih dari 0";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const data = {
      categoryId: formCategoryId,
      period: formPeriod,
      amount: parseFloat(formAmount),
      month: reference,
    };
    if (editBudget) {
      updateBudget(editBudget.id, data);
      showToast("Anggaran berhasil diperbarui");
    } else {
      addBudget(data);
      showToast("Anggaran berhasil ditambahkan");
    }
    setShowForm(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const navigatePeriod = (direction: -1 | 1) => {
    if (activeTab === "monthly") {
      const [y, m] = selectedMonth.split("-").map(Number);
      const d = new Date(y, m - 1 + direction, 1);
      setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    } else if (activeTab === "weekly") {
      const d = new Date(selectedWeek + "T00:00:00");
      d.setDate(d.getDate() + 7 * direction);
      setSelectedWeek(d.toISOString().split("T")[0]);
    } else {
      setSelectedYear((parseInt(selectedYear) + direction).toString());
    }
  };

  const getPeriodLabel = (): string => {
    if (activeTab === "monthly") return getMonthLabel(selectedMonth);
    if (activeTab === "weekly") return getWeekLabel(selectedWeek);
    return selectedYear;
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "monthly", label: "Bulanan", icon: "calendar_month" },
    { id: "weekly", label: "Mingguan", icon: "date_range" },
    { id: "yearly", label: "Tahunan", icon: "calendar_view_week" },
  ];

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
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
          <div className="space-y-stack-sm">
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </>
      )}
      {!loading && (<>
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-label-md sm:text-headline-lg font-bold text-on-surface truncate">
            Anggaran (Budget)
          </h1>
          <p className="text-label-xs sm:text-body-md text-on-surface-variant truncate">
            Atur batas pengeluaran per kategori
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-1 sm:gap-2 rounded-xl bg-primary px-3 py-2 sm:px-5 sm:py-2.5 text-label-xs sm:text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container shrink-0"
        >
          <MaterialSymbol icon="add" size={16} />
          <span className="hidden sm:inline">Tambah Budget</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 bg-surface-container rounded-xl sm:rounded-2xl p-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl py-2 text-[11px] sm:text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-surface-container-low text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            <MaterialSymbol icon={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Period Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigatePeriod(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <MaterialSymbol icon="chevron_left" />
        </button>
        <div className="flex-1 rounded-xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-center text-label-md font-semibold text-on-surface">
          {getPeriodLabel()}
        </div>
        <button
          onClick={() => navigatePeriod(1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant text-on-surface-variant transition-colors hover:bg-surface-container-low"
        >
          <MaterialSymbol icon="chevron_right" />
        </button>
      </div>

      {/* Budget Overview */}
      {currentBudgets.length > 0 && (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl sm:rounded-2xl p-4 sm:p-gutter">
          <h2 className="mb-3 sm:mb-4 text-label-xs sm:text-label-md font-semibold text-on-surface-variant">
            Ringkasan Anggaran
          </h2>
          <div className="mb-4">
            <div className="flex items-center justify-between text-body-md">
              <span className="font-bold text-on-surface-variant">Total Anggaran</span>
              <span className="font-bold text-on-surface">
                {formatCurrency(totalBudget, settings.currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-body-md">
              <span className="font-bold text-on-surface-variant">Total Pengeluaran (terbudget)</span>
              <span className="font-bold text-error">
                {formatCurrency(totalSpent, settings.currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-body-md">
              <span className="font-bold text-on-surface-variant">Sisa</span>
              <span className={`font-bold ${remainingBudget >= 0 ? "text-tertiary" : "text-error"}`}>
                {formatCurrency(remainingBudget, settings.currency)}
              </span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-1 flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>Progress</span>
            <span>{budgetPercentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPercentage >= 100
                  ? "bg-error"
                  : budgetPercentage >= 80
                  ? "bg-tertiary"
                  : "bg-primary"
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget List */}
      {currentBudgets.length === 0 && budgetProgress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center px-4">
          <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant">
            <MaterialSymbol icon="track_changes" size={28} />
          </div>
          <h3 className="text-label-md sm:text-headline-md font-bold text-on-surface">
            Belum ada anggaran
          </h3>
          <p className="mt-1 max-w-xs text-label-sm sm:text-body-md text-on-surface-variant">
            Buat anggaran untuk mengontrol pengeluaranmu per kategori
          </p>
          <button
            onClick={openAddForm}
            className="mt-4 rounded-xl bg-primary px-4 sm:px-5 py-2 sm:py-2.5 text-label-sm sm:text-label-md font-medium text-on-primary hover:bg-primary-container hover:text-on-primary-container"
          >
            + Buat Anggaran
          </button>
        </div>
      ) : (
        <div className="space-y-stack-sm">
          {budgetProgress.length === 0 ? (
            currentBudgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              return (
                <div
                  key={b.id}
                  className="bg-surface-container-low border border-outline-variant rounded-xl sm:rounded-2xl p-4 sm:p-gutter"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: (cat?.color || "#6b7280") + "20", color: cat?.color || "#6b7280" }}
                      >
                        <Icon name={cat?.icon || "folder"} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-label-xs sm:text-label-md font-bold text-on-surface">
                          {cat?.name || "Tanpa Kategori"}
                        </p>
                        <p className="text-label-xs sm:text-label-sm text-on-surface-variant">
                          Budget: {formatCurrency(b.amount, settings.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => openEditForm(b)}
                        className="p-1.5 sm:p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95"
                        aria-label="Edit budget"
                      >
                        <MaterialSymbol icon="edit" size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-1.5 sm:p-2 text-error hover:bg-error-container rounded-lg transition-colors active:scale-95"
                        aria-label="Hapus budget"
                      >
                        <MaterialSymbol icon="delete" size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            budgetProgress.map((bp) => {
              const isOverBudget = bp.percentage >= 100;
              const isWarning = bp.percentage >= 80 && bp.percentage < 100;
              const iconName = categories.find((c) => c.id === bp.categoryId)?.icon || "folder";

              return (
                <div
                  key={bp.budgetId}
                  className="bg-surface-container-low border border-outline-variant rounded-xl sm:rounded-2xl p-4 sm:p-gutter"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: bp.categoryColor + "20", color: bp.categoryColor }}
                      >
                        <Icon name={iconName} size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-label-xs sm:text-label-md font-bold text-on-surface">
                          {bp.categoryName}
                        </p>
                        <p className="text-label-xs sm:text-label-sm text-on-surface-variant">
                          {formatCurrency(bp.spentAmount, settings.currency)} / {formatCurrency(bp.budgetAmount, settings.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => {
                            const b = currentBudgets.find((b) => b.id === bp.budgetId);
                            if (b) openEditForm(b);
                          }}
                          className="p-1.5 sm:p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors active:scale-95"
                          aria-label="Edit budget"
                        >
                          <MaterialSymbol icon="edit" size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(bp.budgetId)}
                          className="p-1.5 sm:p-2 text-error hover:bg-error-container rounded-lg transition-colors active:scale-95"
                          aria-label="Hapus budget"
                        >
                          <MaterialSymbol icon="delete" size={18} />
                        </button>
                      </div>
                      {isOverBudget ? (
                        <span className="text-label-sm font-semibold text-error">
                          Over Budget! ({bp.percentage}%)
                        </span>
                      ) : (
                        <span className="text-label-sm font-semibold text-tertiary">
                          Sisa {formatCurrency(bp.remainingAmount, settings.currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-stack-sm">
                    <div className="mb-1 flex items-center justify-between text-label-sm text-on-surface-variant">
                      <span>{bp.percentage}%</span>
                      <span>{formatCurrency(bp.remainingAmount, settings.currency)} tersisa</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget
                            ? "bg-error"
                            : isWarning
                            ? "bg-tertiary"
                            : "bg-primary"
                        }`}
                        style={{ width: `${bp.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Budget Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditBudget(null);
        }}
        title={editBudget ? "Edit Anggaran" : "Tambah Anggaran"}
      >
        <div className="space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              Kategori Pengeluaran
            </label>
            <div className={`grid grid-cols-2 gap-2 ${errors.categoryId ? "ring-2 ring-error rounded-xl p-1" : ""}`}>
              {expenseCategories.length === 0 ? (
                <p className="col-span-2 text-body-md text-on-surface-variant py-2">
                  Belum ada kategori pengeluaran
                </p>
              ) : (
                expenseCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setFormCategoryId(cat.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                      formCategoryId === cat.id
                        ? "border-primary bg-primary-container text-on-primary-container shadow-sm"
                        : "border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: formCategoryId === cat.id ? cat.color + "30" : cat.color + "20",
                        color: cat.color,
                      }}
                    >
                      <Icon name={cat.icon} size={18} />
                    </div>
                    <span className="text-label-md font-medium truncate">{cat.name}</span>
                  </button>
                ))
              )}
            </div>
            {errors.categoryId && <p className="mt-1 text-label-sm text-error">{errors.categoryId}</p>}
          </div>

          {/* Budget Amount */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">
              Jumlah Anggaran
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-label-md font-semibold text-on-surface-variant">
                {getCurrencySymbol(settings.currency)}
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={formatNumberInput(formAmount)}
                onChange={(e) => setFormAmount(parseNumberInput(e.target.value))}
                className={`w-full bg-surface-container-low border rounded-xl py-3 pl-12 pr-4 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-colors focus:ring-2 focus:ring-primary focus:border-primary ${
                  errors.amount
                    ? "border-error"
                    : "border-outline-variant"
                }`}
              />
            </div>
            {errors.amount && <p className="mt-1 text-label-sm text-error">{errors.amount}</p>}
          </div>

          {/* Period info */}
          <div className="rounded-xl bg-surface-container-high p-3">
            <p className="text-label-sm text-on-surface-variant">
              Budget akan berlaku untuk periode <strong>{getPeriodLabel().toLowerCase()}</strong>
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditBudget(null);
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
              {editBudget ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Hapus Anggaran"
        message="Yakin ingin menghapus budget ini?"
        onConfirm={() => {
          if (deleteConfirm) {
            deleteBudget(deleteConfirm);
            loadData();
            showToast("Anggaran berhasil dihapus");
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
      </>)}
    </div>
  );
}
