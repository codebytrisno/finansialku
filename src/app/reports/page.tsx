"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getTransactions,
  getCategories,
  getSettings,
  getBudgets,
} from "@/lib/store";
import {
  formatCurrency,
  getCurrentMonth,
  getMonthRange,
  calculateMonthlySummaries,
  calculateCategoryBreakdown,
  calculateWeeklySummary,
  calculateYearlySummary,
  calculateAssetTrend,
  getWeekStart,
  getWeekLabel,
  getCurrentYear,
  getYearMonths,
  getMonthLabel,
  getWeeksInMonth,
  calculateBudgetProgress,
  getTotalBudget,
  getTotalSpent,
} from "@/lib/utils";
import {
  type Transaction,
  type Category,
  type AppSettings,
  type Budget,
  type BudgetProgress,
  CURRENCY_OPTIONS,
} from "@/lib/types";
import SummaryCard from "@/components/SummaryCard";
import { Icon } from "@/lib/icons";
import { BarChart, DonutChart, DonutLegend } from "@/components/Charts";
import CalendarView from "@/components/CalendarView";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuScale,
  LuArrowDown,
  LuArrowUp,
  LuCalendar,
  LuCalendarDays,
  LuCalendarRange,
  LuChartLine,
  LuChevronLeft,
  LuChevronRight,
  LuTarget,
} from "react-icons/lu";

type Tab = "monthly" | "weekly" | "yearly" | "calendar";

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    theme: "system",
    currency: "IDR",
    defaultCategoryId: "",
    language: "id",
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("monthly");
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [selectedYear, setSelectedYear] = useState(getCurrentYear());
  const [selectedWeek, setSelectedWeek] = useState(getWeekStart());

  const loadData = useCallback(() => {
    setTransactions(getTransactions());
    setCategories(getCategories());
    setSettings(getSettings());
    setBudgets(getBudgets());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currencySymbol = useMemo(() => {
    const opt = CURRENCY_OPTIONS.find((c) => c.code === settings.currency);
    return opt?.symbol || "Rp";
  }, [settings.currency]);

  // ─── Monthly ─────────────────────────────────────────────────
  const monthRange = useMemo(() => getMonthRange(12), []);
  const monthlySummaries = useMemo(
    () => calculateMonthlySummaries(transactions, monthRange),
    [transactions, monthRange]
  );
  const selectedSummary = useMemo(
    () => monthlySummaries.find((m) => m.month === selectedMonth),
    [monthlySummaries, selectedMonth]
  );

  const incomeBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, selectedMonth, "income"),
    [transactions, categories, selectedMonth]
  );
  const expenseBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, selectedMonth, "expense"),
    [transactions, categories, selectedMonth]
  );

  // ─── Weekly ──────────────────────────────────────────────────
  const weeksInMonth = useMemo(
    () => getWeeksInMonth(selectedMonth),
    [selectedMonth]
  );
  const weeklySummary = useMemo(
    () => calculateWeeklySummary(transactions, selectedWeek),
    [transactions, selectedWeek]
  );

  const weeklyBreakdown = useMemo(() => {
    const weekEnd = new Date(selectedWeek + "T00:00:00");
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split("T")[0];
    const weekTx = transactions.filter(
      (t) => t.transactionDate >= selectedWeek && t.transactionDate <= weekEndStr
    );
    // Compute breakdown directly from weekTx (don't use month-filtered function)
    const computeBreakdown = (type: "income" | "expense") => {
      const filtered = weekTx.filter((t) => t.type === type);
      const total = filtered.reduce((sum, t) => sum + t.amount, 0);
      if (total === 0) return [];
      const grouped: Record<string, { categoryName: string; categoryColor: string; total: number; count: number }> = {};
      for (const t of filtered) {
        const cat = categories.find((c) => c.id === t.categoryId);
        const catId = t.categoryId;
        if (!grouped[catId]) {
          grouped[catId] = { categoryName: cat?.name || "Tanpa Kategori", categoryColor: cat?.color || "#6b7280", total: 0, count: 0 };
        }
        grouped[catId].total += t.amount;
        grouped[catId].count += 1;
      }
      return Object.entries(grouped)
        .map(([categoryId, d]) => ({
          categoryId,
          ...d,
          type,
          percentage: Math.round((d.total / total) * 100),
        }))
        .sort((a, b) => b.total - a.total);
    };
    return {
      income: computeBreakdown("income"),
      expense: computeBreakdown("expense"),
    };
  }, [transactions, categories, selectedWeek]);

  // ─── Yearly ──────────────────────────────────────────────────
  const yearlySummary = useMemo(
    () => calculateYearlySummary(transactions, selectedYear),
    [transactions, selectedYear]
  );

  const yearlyIncomeBreakdown = useMemo(
    () => {
      const yearMonths = getYearMonths(selectedYear);
      let totalIncome = 0;
      const incomeByCat: Record<string, { name: string; color: string; total: number }> = {};
      for (const m of yearMonths) {
        const breakdown = calculateCategoryBreakdown(transactions, categories, m, "income");
        for (const b of breakdown) {
          if (!incomeByCat[b.categoryId]) {
            incomeByCat[b.categoryId] = { name: b.categoryName, color: b.categoryColor, total: 0 };
          }
          incomeByCat[b.categoryId].total += b.total;
          totalIncome += b.total;
        }
      }
      return Object.entries(incomeByCat)
        .map(([id, d]) => ({
          categoryId: id,
          categoryName: d.name,
          categoryColor: d.color,
          total: d.total,
          percentage: totalIncome > 0 ? Math.round((d.total / totalIncome) * 100) : 0,
          count: 0,
          type: "income" as const,
        }))
        .sort((a, b) => b.total - a.total);
    },
    [transactions, categories, selectedYear]
  );

  const yearlyExpenseBreakdown = useMemo(
    () => {
      const yearMonths = getYearMonths(selectedYear);
      let totalExpense = 0;
      const expenseByCat: Record<string, { name: string; color: string; total: number }> = {};
      for (const m of yearMonths) {
        const breakdown = calculateCategoryBreakdown(transactions, categories, m, "expense");
        for (const b of breakdown) {
          if (!expenseByCat[b.categoryId]) {
            expenseByCat[b.categoryId] = { name: b.categoryName, color: b.categoryColor, total: 0 };
          }
          expenseByCat[b.categoryId].total += b.total;
          totalExpense += b.total;
        }
      }
      return Object.entries(expenseByCat)
        .map(([id, d]) => ({
          categoryId: id,
          categoryName: d.name,
          categoryColor: d.color,
          total: d.total,
          percentage: totalExpense > 0 ? Math.round((d.total / totalExpense) * 100) : 0,
          count: 0,
          type: "expense" as const,
        }))
        .sort((a, b) => b.total - a.total);
    },
    [transactions, categories, selectedYear]
  );

  // ─── Asset Trend ─────────────────────────────────────────────
  const assetTrend = useMemo(
    () => calculateAssetTrend(transactions, monthRange),
    [transactions, monthRange]
  );

  // ─── Budget Progress ─────────────────────────────────────────
  const budgetProgress = useMemo(
    () => calculateBudgetProgress(budgets, transactions, categories, "monthly", selectedMonth),
    [budgets, transactions, categories, selectedMonth]
  );
  const budgetTotalBudget = getTotalBudget(budgets, "monthly", selectedMonth);
  const budgetTotalSpent = getTotalSpent(budgets, transactions, "monthly", selectedMonth);
  const budgetRemaining = budgetTotalBudget - budgetTotalSpent;
  const budgetPercentage = budgetTotalBudget > 0 ? Math.min(Math.round((budgetTotalSpent / budgetTotalBudget) * 100), 100) : 0;

  // ─── Calendar ────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: typeof LuCalendar }[] = [
    { id: "monthly", label: "Bulanan", icon: LuCalendar },
    { id: "weekly", label: "Mingguan", icon: LuCalendarDays },
    { id: "yearly", label: "Tahunan", icon: LuCalendarRange },
    { id: "calendar", label: "Kalender", icon: LuChartLine },
  ];

  const totalIncome = selectedSummary?.income || 0;
  const totalExpense = selectedSummary?.expense || 0;
  const totalBalance = selectedSummary?.balance || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Laporan & Statistik
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Analisis keuangan lengkap
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-emerald-700 shadow-sm dark:bg-zinc-900 dark:text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── MONTHLY TAB ─────────────────────────────────────── */}
      {activeTab === "monthly" && (
        <>
          {/* Month Selector */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {monthRange.map((m) => (
                <option key={m} value={m}>
                  {getMonthLabel(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              title="Total Pemasukan"
              value={formatCurrency(totalIncome, settings.currency)}
              icon={<LuTrendingUp size={22} />}
              color="emerald"
            />
            <SummaryCard
              title="Total Pengeluaran"
              value={formatCurrency(totalExpense, settings.currency)}
              icon={<LuTrendingDown size={22} />}
              color="red"
            />
            <SummaryCard
              title="Selisih"
              value={formatCurrency(totalBalance, settings.currency)}
              icon={<LuScale size={22} />}
              color={totalBalance >= 0 ? "emerald" : "red"}
            />
          </div>

          {/* Monthly Trend Chart */}
          {monthlySummaries.some((m) => m.income > 0 || m.expense > 0) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tren Bulanan
              </h2>
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {monthlySummaries.map((m, i) => {
                  const maxVal = Math.max(
                    ...monthlySummaries.map((s) => Math.max(s.income, s.expense)),
                    1
                  );
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-end justify-center gap-1" style={{ height: 130 }}>
                        <div
                          className="w-3 rounded-t-sm bg-emerald-400 transition-all hover:bg-emerald-500"
                          title={`Pemasukan: ${formatCurrency(m.income)}`}
                          style={{ height: `${(m.income / maxVal) * 100}%` }}
                        />
                        <div
                          className="w-3 rounded-t-sm bg-red-400 transition-all hover:bg-red-500"
                          title={`Pengeluaran: ${formatCurrency(m.expense)}`}
                          style={{ height: `${(m.expense / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className={`mt-1 text-xs ${
                        m.month === selectedMonth
                          ? "font-bold text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-400"
                      }`}>
                        {m.month.slice(-2) + "/" + m.month.slice(2, 4)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Pemasukan
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Pengeluaran
                </span>
              </div>
            </div>
          )}

          {/* Asset Trend Chart */}
          {assetTrend.length > 1 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <LuChartLine size={16} />
                Perubahan Aset
              </h2>
              <div className="flex items-end gap-2" style={{ height: 100 }}>
                {(() => {
                  const values = assetTrend.map((a) => a.netWorth);
                  const maxVal = Math.max(...values.map(Math.abs), 1);
                  return assetTrend.map((a, i) => {
                    const isPositive = a.netWorth >= 0;
                    const h = Math.abs(a.netWorth);
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center">
                        <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
                          <div
                            className={`w-3 rounded-t-sm transition-all ${
                              isPositive ? "bg-emerald-400" : "bg-red-400"
                            }`}
                            title={`${getMonthLabel(a.date)}: ${formatCurrency(a.netWorth, settings.currency)}`}
                            style={{ height: `${(h / maxVal) * 100}%` }}
                          />
                        </div>
                        <span className="mt-1 text-[10px] text-zinc-400">{a.date.slice(-2)}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              <p className="mt-3 text-center text-xs text-zinc-400">
                Aset saat ini: {formatCurrency(
                  assetTrend[assetTrend.length - 1]?.netWorth || 0,
                  settings.currency
                )}
              </p>
            </div>
          )}

          {/* Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Expense Breakdown */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                <LuArrowDown size={16} />
                Pengeluaran per Kategori
              </h2>
              {expenseBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pengeluaran bulan ini
                </p>
              ) : (
                <>
                  <DonutChart
                    data={expenseBreakdown.map((b) => ({
                      label: b.categoryName,
                      value: b.total,
                      color: b.categoryColor,
                    }))}
                    size={140}
                    totalLabel="Pengeluaran"
                  />
                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <DonutLegend
                      data={expenseBreakdown}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Income Breakdown */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <LuArrowUp size={16} />
                Pemasukan per Kategori
              </h2>
              {incomeBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pemasukan bulan ini
                </p>
              ) : (
                <>
                  <DonutChart
                    data={incomeBreakdown.map((b) => ({
                      label: b.categoryName,
                      value: b.total,
                      color: b.categoryColor,
                    }))}
                    size={140}
                    totalLabel="Pemasukan"
                  />
                  <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <DonutLegend
                      data={incomeBreakdown}
                      currencySymbol={currencySymbol}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Budget vs Actual Comparison */}
          {budgetProgress.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <LuTarget size={16} />
                Budget vs Realisasi ({getMonthLabel(selectedMonth)})
              </h2>

              {/* Overall Budget Summary */}
              <div className="mb-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Total Anggaran</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{formatCurrency(budgetTotalBudget, settings.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-zinc-500">Realisasi</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(budgetTotalSpent, settings.currency)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Sisa</span>
                  <span className={`font-bold ${budgetRemaining >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(budgetRemaining, settings.currency)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                    <span>Progress</span>
                    <span>{budgetPercentage}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        budgetPercentage >= 100 ? "bg-red-500" : budgetPercentage >= 80 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${budgetPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Per-category Budget Progress */}
              <div className="space-y-4">
                {budgetProgress.map((bp) => {
                  const isOver = bp.percentage >= 100;
                  const isWarn = bp.percentage >= 80 && bp.percentage < 100;
                  const iconName = categories.find((c) => c.id === bp.categoryId)?.icon || "folder";
                  return (
                    <div key={bp.budgetId}>
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Icon name={iconName} size={14} />
                          <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                            {bp.categoryName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          <span className="text-red-500">{formatCurrency(bp.spentAmount, settings.currency)}</span>
                          <span className="text-zinc-400">/</span>
                          <span className="text-zinc-600 dark:text-zinc-400">{formatCurrency(bp.budgetAmount, settings.currency)}</span>
                          <span className={`font-bold ${isOver ? "text-red-500" : isWarn ? "text-amber-500" : "text-emerald-500"}`}>
                            {bp.percentage}%
                          </span>
                        </div>
                      </div>
                      {/* Budget bar: show budget vs actual */}
                      <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        {/* Budget 100% line */}
                        <div className="absolute top-0 left-[calc(100%-1px)] h-full w-0.5 bg-zinc-900/50 dark:bg-zinc-100/50" />
                        {/* Spent bar */}
                        <div
                          className={`h-full rounded-full transition-all ${
                            isOver ? "bg-red-500" : isWarn ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.min(bp.percentage, 100)}%` }}
                        />
                        {/* Over-budget indicator */}
                        {isOver && (
                          <div
                            className="absolute right-0 top-0 h-full rounded-r-full"
                            style={{
                              width: `${Math.min(bp.percentage - 100, 10)}%`,
                              backgroundColor: "rgba(239, 68, 68, 0.3)",
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ─── WEEKLY TAB ──────────────────────────────────────── */}
      {activeTab === "weekly" && (
        <>
          {/* Week Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const prev = new Date(selectedWeek + "T00:00:00");
                prev.setDate(prev.getDate() - 7);
                setSelectedWeek(prev.toISOString().split("T")[0]);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuChevronLeft size={18} />
            </button>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              {weeksInMonth.map((w) => (
                <option key={w} value={w}>
                  {getWeekLabel(w)}
                </option>
              ))}
            </select>
            <button
              onClick={() => {
                const next = new Date(selectedWeek + "T00:00:00");
                next.setDate(next.getDate() + 7);
                setSelectedWeek(next.toISOString().split("T")[0]);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuChevronRight size={18} />
            </button>
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              title="Pemasukan Minggu Ini"
              value={formatCurrency(weeklySummary.income, settings.currency)}
              icon={<LuTrendingUp size={22} />}
              color="emerald"
            />
            <SummaryCard
              title="Pengeluaran Minggu Ini"
              value={formatCurrency(weeklySummary.expense, settings.currency)}
              icon={<LuTrendingDown size={22} />}
              color="red"
            />
            <SummaryCard
              title="Selisih"
              value={formatCurrency(weeklySummary.balance, settings.currency)}
              icon={<LuScale size={22} />}
              color={weeklySummary.balance >= 0 ? "emerald" : "red"}
            />
          </div>

          {/* Weekly Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                <LuArrowDown size={16} />
                Pengeluaran Minggu Ini
              </h2>
              {weeklyBreakdown.expense.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pengeluaran minggu ini
                </p>
              ) : (
                <DonutLegend
                  data={weeklyBreakdown.expense}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <LuArrowUp size={16} />
                Pemasukan Minggu Ini
              </h2>
              {weeklyBreakdown.income.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pemasukan minggu ini
                </p>
              ) : (
                <DonutLegend
                  data={weeklyBreakdown.income}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── YEARLY TAB ──────────────────────────────────────── */}
      {activeTab === "yearly" && (
        <>
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear((parseInt(selectedYear) - 1).toString())}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuChevronLeft size={18} />
            </button>
            <div className="flex-1 text-center text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {selectedYear}
            </div>
            <button
              onClick={() => setSelectedYear((parseInt(selectedYear) + 1).toString())}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 text-zinc-500 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <LuChevronRight size={18} />
            </button>
          </div>

          {/* Yearly Summary Cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard
              title="Total Pemasukan"
              value={formatCurrency(yearlySummary.totalIncome, settings.currency)}
              icon={<LuTrendingUp size={22} />}
              color="emerald"
            />
            <SummaryCard
              title="Total Pengeluaran"
              value={formatCurrency(yearlySummary.totalExpense, settings.currency)}
              icon={<LuTrendingDown size={22} />}
              color="red"
            />
            <SummaryCard
              title="Rata-rata/Bulan"
              value={formatCurrency(
                Math.round(yearlySummary.totalExpense / Math.max(yearlySummary.months.filter((m) => m.expense > 0).length, 1)),
                settings.currency
              )}
              icon={<LuScale size={22} />}
              color="blue"
              subtitle="Pengeluaran"
            />
          </div>

          {/* Yearly Bar Chart */}
          {yearlySummary.months.some((m) => m.income > 0 || m.expense > 0) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Tren Tahun {selectedYear}
              </h2>
              <div className="flex items-end gap-1.5" style={{ height: 140 }}>
                {yearlySummary.months.map((m, i) => {
                  const maxVal = Math.max(
                    ...yearlySummary.months.map((s) => Math.max(s.income, s.expense)),
                    1
                  );
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center">
                      <div className="flex w-full items-end justify-center gap-0.5" style={{ height: 110 }}>
                        <div
                          className="w-2 rounded-t-sm bg-emerald-400 transition-all"
                          style={{ height: `${(m.income / maxVal) * 100}%` }}
                        />
                        <div
                          className="w-2 rounded-t-sm bg-red-400 transition-all"
                          style={{ height: `${(m.expense / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="mt-1 text-[10px] text-zinc-400">
                        {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Pemasukan
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Pengeluaran
                </span>
              </div>
            </div>
          )}

          {/* Yearly Category Breakdown */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                <LuArrowDown size={16} />
                Pengeluaran {selectedYear}
              </h2>
              {yearlyExpenseBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pengeluaran tahun ini
                </p>
              ) : (
                <DonutLegend
                  data={yearlyExpenseBreakdown}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <LuArrowUp size={16} />
                Pemasukan {selectedYear}
              </h2>
              {yearlyIncomeBreakdown.length === 0 ? (
                <p className="py-8 text-center text-sm text-zinc-400">
                  Tidak ada pemasukan tahun ini
                </p>
              ) : (
                <DonutLegend
                  data={yearlyIncomeBreakdown}
                  currencySymbol={currencySymbol}
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* ─── CALENDAR TAB ────────────────────────────────────── */}
      {activeTab === "calendar" && (
        <>
          {/* Asset Trend */}
          {assetTrend.length > 1 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                <LuChartLine size={16} />
                Perubahan Aset (12 Bulan)
              </h2>
              <div className="flex items-end gap-2" style={{ height: 120 }}>
                {(() => {
                  const values = assetTrend.map((a) => a.netWorth);
                  const maxAbs = Math.max(...values.map(Math.abs), 1);
                  return assetTrend.map((a, i) => {
                    const isPositive = a.netWorth >= 0;
                    const h = (Math.abs(a.netWorth) / maxAbs) * 100;
                    return (
                      <div key={i} className="flex flex-1 flex-col items-center">
                        <div className="relative flex w-full items-center justify-center" style={{ height: 100 }}>
                          {/* Zero line */}
                          <div className="absolute left-0 right-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-700" />
                          {/* Bar */}
                          <div
                            className={`absolute w-3 rounded-sm transition-all ${
                              isPositive
                                ? "bottom-1/2 bg-emerald-400"
                                : "top-1/2 bg-red-400"
                            }`}
                            style={{ height: `${Math.max(h, 1)}%` }}
                          />
                        </div>
                        <span className="mt-1 text-[10px] text-zinc-400">{a.date.slice(-2)}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Positif
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-400" /> Negatif
                </span>
                <span className="text-zinc-400">
                  Total: {formatCurrency(
                    assetTrend[assetTrend.length - 1]?.netWorth || 0,
                    settings.currency
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Calendar View */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <CalendarView
              transactions={transactions}
              categories={categories}
              currency={settings.currency}
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>
        </>
      )}
    </div>
  );
}
