"use client";

import { useState, useMemo } from "react";
import { type Transaction, type Category } from "@/lib/types";
import { formatCurrency, formatDate, getDayTransactions, getMonthLabel } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { LuChevronLeft, LuChevronRight, LuArrowUp, LuArrowDown } from "react-icons/lu";

interface CalendarViewProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function CalendarView({
  transactions,
  categories,
  currency,
  selectedMonth,
  onMonthChange,
}: CalendarViewProps) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { year, month } = useMemo(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    return { year: y, month: m };
  }, [selectedMonth]);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const firstDayOfWeek = useMemo(() => new Date(year, month - 1, 1).getDay(), [year, month]);

  // Build day data
  const dayData = useMemo(() => {
    const days: { date: string; income: number; expense: number; count: number }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedMonth}-${String(d).padStart(2, "0")}`;
      const dayTx = getDayTransactions(transactions, dateStr);
      days.push({
        date: dateStr,
        income: dayTx.totalIncome,
        expense: dayTx.totalExpense,
        count: dayTx.transactions.length,
      });
    }
    return days;
  }, [transactions, selectedMonth, daysInMonth]);

  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null;
    return getDayTransactions(transactions, selectedDay);
  }, [transactions, selectedDay]);

  const navigateMonth = (delta: number) => {
    const newDate = new Date(year, month - 1 + delta, 1);
    const y = newDate.getFullYear();
    const m = String(newDate.getMonth() + 1).padStart(2, "0");
    onMonthChange(`${y}-${m}`);
    setSelectedDay(null);
  };

  // Get category for a transaction
  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  // Build calendar grid rows (weeks)
  const calendarRows = useMemo(() => {
    const rows: { date: string; income: number; expense: number; count: number }[][] = [];
    let currentRow: { date: string; income: number; expense: number; count: number }[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentRow.push({ date: "", income: 0, expense: 0, count: 0 });
    }

    for (const day of dayData) {
      currentRow.push(day);
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    // Fill remaining cells in last row
    if (currentRow.length > 0) {
      while (currentRow.length < 7) {
        currentRow.push({ date: "", income: 0, expense: 0, count: 0 });
      }
      rows.push(currentRow);
    }

    return rows;
  }, [dayData, firstDayOfWeek]);

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigateMonth(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <LuChevronLeft size={18} />
        </button>
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          {getMonthLabel(selectedMonth)}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        >
          <LuChevronRight size={18} />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="py-1 text-center text-[10px] font-medium uppercase tracking-wider text-zinc-400"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarRows.flat().map((day, i) => {
          if (!day.date) return <div key={i} className="aspect-square" />;
          const dayNum = parseInt(day.date.slice(-2));
          const isToday = day.date === today;
          const isSelected = day.date === selectedDay;
          const hasIncome = day.income > 0;
          const hasExpense = day.expense > 0;

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(isSelected ? null : day.date)}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs transition-all ${
                isSelected
                  ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-500 dark:bg-emerald-900/50 dark:text-emerald-200"
                  : isToday
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50"
              } ${day.count === 0 ? "opacity-50" : ""}`}
            >
              <span className={`text-sm font-medium ${isToday && !isSelected ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                {dayNum}
              </span>
              {day.count > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  {hasIncome && (
                    <div className="h-1 w-1 rounded-full bg-emerald-400" />
                  )}
                  {hasExpense && (
                    <div className="h-1 w-1 rounded-full bg-red-400" />
                  )}
                </div>
              )}
              {day.count > 0 && (
                <span className="mt-0.5 text-[8px] text-zinc-400">
                  {day.income > 0 || day.expense > 0
                    ? `${day.count > 99 ? "99+" : day.count}`
                    : ""}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="flex items-center justify-center gap-4 rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-800/50">
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <LuArrowUp size={12} />
          {formatCurrency(
            dayData.reduce((s, d) => s + d.income, 0),
            currency
          )}
        </span>
        <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <LuArrowDown size={12} />
          {formatCurrency(
            dayData.reduce((s, d) => s + d.expense, 0),
            currency
          )}
        </span>
        <span className="text-zinc-500">
          {dayData.filter((d) => d.count > 0).length} hari bertransaksi
        </span>
      </div>

      {/* Selected Day Detail */}
      {selectedDayData && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {formatDate(selectedDayData.date)}
            </h4>
            <div className="flex gap-3 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400">
                +{formatCurrency(selectedDayData.totalIncome, currency)}
              </span>
              <span className="text-red-600 dark:text-red-400">
                -{formatCurrency(selectedDayData.totalExpense, currency)}
              </span>
            </div>
          </div>

          {selectedDayData.transactions.length === 0 ? (
            <p className="py-4 text-center text-xs text-zinc-400">
              Tidak ada transaksi
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedDayData.transactions.map((t) => {
                const cat = getCategory(t.categoryId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                        <Icon name={cat?.icon || "folder"} size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                          {cat?.name || "Tanpa Kategori"}
                        </p>
                        {t.note && (
                          <p className="truncate text-[10px] text-zinc-400">{t.note}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold ${
                        t.type === "income"
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {t.type === "income" ? "+" : "-"}
                      {formatCurrency(t.amount, currency)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
