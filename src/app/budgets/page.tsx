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
import SummaryCard from "@/components/SummaryCard";
import Modal from "@/components/Modal";
import {
  LuPlus,
  LuPencil,
  LuTrash2,
  LuTarget,
  LuTrendingDown,
  LuCalendar,
  LuCalendarRange,
  LuCalendarDays,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";

type Tab = "monthly" | "weekly" | "yearly";

export default function BudgetsPage() {
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

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setBudgets(getBudgets());
    setSettings(getSettings());
  }, []);

  useEffect(() => {
    loadData();
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
    } else {
      addBudget(data);
    }
    setShowForm(false);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus budget ini?")) {
      deleteBudget(id);
      loadData();
    }
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

  const tabs: { id: Tab; label: string; icon: typeof LuCalendar }[] = [
    { id: "monthly", label: "Bulanan", icon: LuCalendar },
    { id: "weekly", label: "Mingguan", icon: LuCalendarDays },
    { id: "yearly", label: "Tahunan", icon: LuCalendarRange },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Anggaran (Budget)
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Atur batas pengeluaran per kategori
          </p>
        </div>
        <button
          onClick={openAddForm}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
        >
          <LuPlus size={18} />
          <span className="hidden sm:inline">Tambah Budget</span>
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.map((tab) => {
          const IconComp = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
              }`}
            >
              <IconComp size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Period Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigatePeriod(-1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LuChevronLeft size={18} />
        </button>
        <div className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50">
          {getPeriodLabel()}
        </div>
        <button
          onClick={() => navigatePeriod(1)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <LuChevronRight size={18} />
        </button>
      </div>

      {/* Budget Overview */}
      {currentBudgets.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Ringkasan Anggaran
          </h2>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Anggaran</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatCurrency(totalBudget, settings.currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total Pengeluaran (terbudget)</span>
              <span className="font-bold text-red-600 dark:text-red-400">
                {formatCurrency(totalSpent, settings.currency)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Sisa</span>
              <span className={`font-bold ${remainingBudget >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {formatCurrency(remainingBudget, settings.currency)}
              </span>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
            <span>Progress</span>
            <span>{budgetPercentage}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${
                budgetPercentage >= 100
                  ? "bg-red-500"
                  : budgetPercentage >= 80
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Budget List */}
      {currentBudgets.length === 0 && budgetProgress.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
            <LuTarget size={32} />
          </div>
          <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
            Belum ada anggaran
          </h3>
          <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            Buat anggaran untuk mengontrol pengeluaranmu per kategori
          </p>
          <button
            onClick={openAddForm}
            className="mt-4 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-95"
          >
            + Buat Anggaran
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgetProgress.length === 0 ? (
            // No budgets tracked for this period, show raw budgets
            currentBudgets.map((b) => {
              const cat = categories.find((c) => c.id === b.categoryId);
              return (
                <div
                  key={b.id}
                  className="group relative rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: (cat?.color || "#6b7280") + "20" }}
                      >
                        <Icon name={cat?.icon || "folder"} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {cat?.name || "Tanpa Kategori"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Budget: {formatCurrency(b.amount, settings.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => openEditForm(b)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                      >
                        <LuPencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500 hover:bg-red-100 dark:bg-red-950/30"
                      >
                        <LuTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Show budget with progress
            budgetProgress.map((bp) => {
              const isOverBudget = bp.percentage >= 100;
              const isWarning = bp.percentage >= 80 && bp.percentage < 100;
              const iconName = categories.find((c) => c.id === bp.categoryId)?.icon || "folder";

              return (
                <div
                  key={bp.budgetId}
                  className="group relative rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: bp.categoryColor + "20" }}
                      >
                        <Icon name={iconName} size={20} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {bp.categoryName}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {formatCurrency(bp.spentAmount, settings.currency)} / {formatCurrency(bp.budgetAmount, settings.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            const b = currentBudgets.find((b) => b.id === bp.budgetId);
                            if (b) openEditForm(b);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-xs text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                        >
                          <LuPencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(bp.budgetId)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-xs text-red-500 hover:bg-red-100 dark:bg-red-950/30"
                        >
                          <LuTrash2 size={14} />
                        </button>
                      </div>
                      {isOverBudget ? (
                        <span className="text-xs font-semibold text-red-500">
                          Over Budget! ({bp.percentage}%)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-500">
                          Sisa {formatCurrency(bp.remainingAmount, settings.currency)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                      <span>{bp.percentage}%</span>
                      <span>{formatCurrency(bp.remainingAmount, settings.currency)} tersisa</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOverBudget
                            ? "bg-red-500"
                            : isWarning
                            ? "bg-amber-500"
                            : "bg-emerald-500"
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
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Kategori Pengeluaran
            </label>
            <select
              value={formCategoryId}
              onChange={(e) => setFormCategoryId(e.target.value)}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                errors.categoryId
                  ? "border-red-400 focus:ring-red-400"
                  : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
              }`}
            >
              <option value="">Pilih kategori</option>
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId}</p>}
          </div>

          {/* Budget Amount */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Jumlah Anggaran
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500">
                Rp
              </span>
              <input
                type="number"
                placeholder="0"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className={`w-full rounded-xl border bg-white py-3 pl-12 pr-4 text-sm font-bold text-zinc-900 focus:outline-none focus:ring-2 dark:bg-zinc-800 dark:text-zinc-50 ${
                  errors.amount
                    ? "border-red-400 focus:ring-red-400"
                    : "border-zinc-300 focus:ring-emerald-500 dark:border-zinc-700"
                }`}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs text-red-500">{errors.amount}</p>}
          </div>

          {/* Period info */}
          <div className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
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
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              {editBudget ? "Simpan" : "Tambah"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
