"use client";

import { useState, useMemo } from "react";
import { type Transaction, type Category } from "@/lib/types";
import { formatCurrency, formatDate, getDayTransactions, getMonthLabel } from "@/lib/utils";
import { Icon } from "@/lib/icons";
import { MaterialSymbol } from "@/components/MaterialSymbol";

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

  const getCategory = (categoryId: string) => categories.find((c) => c.id === categoryId);

  const calendarRows = useMemo(() => {
    const rows: { date: string; income: number; expense: number; count: number }[][] = [];
    let currentRow: { date: string; income: number; expense: number; count: number }[] = [];

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
          className="flex h-8 w-8 items-center justify-center rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-highest"
        >
          <MaterialSymbol icon="chevron_left" size={18} />
        </button>
        <h3 className="text-label-md font-semibold text-on-surface">
          {getMonthLabel(selectedMonth)}
        </h3>
        <button
          onClick={() => navigateMonth(1)}
          className="flex h-8 w-8 items-center justify-center rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-highest"
        >
          <MaterialSymbol icon="chevron_right" size={18} />
        </button>
      </div>

      {/* Day Names */}
      <div className="grid grid-cols-7 text-label-sm text-on-surface-variant text-center pb-2">
        {DAY_NAMES.map((name) => (
          <div key={name}>{name}</div>
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

          let bgStyle = "text-on-surface-variant/50";
          if (isSelected) {
            bgStyle = "bg-primary-container text-primary font-semibold ring-2 ring-primary";
          } else if (isToday) {
            bgStyle = "bg-primary-container text-primary font-semibold";
          } else if (hasIncome && hasExpense) {
            bgStyle = "bg-tertiary-container text-tertiary";
          } else if (hasIncome) {
            bgStyle = "bg-tertiary-container text-tertiary";
          } else if (hasExpense) {
            bgStyle = "bg-error-container text-error";
          }

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(isSelected ? null : day.date)}
              className={`aspect-square rounded-xl flex items-center justify-center text-label-md transition-all ${bgStyle}`}
            >
              <span className="text-sm font-medium">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Monthly Summary */}
      <div className="flex items-center justify-center gap-4 rounded-xl bg-surface-container-low p-3 text-label-sm">
        <span className="flex items-center gap-1 font-bold text-tertiary">
          <MaterialSymbol icon="arrow_upward" size={12} />
          {formatCurrency(
            dayData.reduce((s, d) => s + d.income, 0),
            currency
          )}
        </span>
        <span className="flex items-center gap-1 font-bold text-error">
          <MaterialSymbol icon="arrow_downward" size={12} />
          {formatCurrency(
            dayData.reduce((s, d) => s + d.expense, 0),
            currency
          )}
        </span>
        <span className="text-on-surface-variant">
          {dayData.filter((d) => d.count > 0).length} hari bertransaksi
        </span>
      </div>

      {/* Selected Day Detail */}
      {selectedDayData && (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-label-md font-semibold text-on-surface">
              {formatDate(selectedDayData.date)}
            </h4>
            <div className="flex gap-3 text-label-sm">
              <span className="text-tertiary">
                +{formatCurrency(selectedDayData.totalIncome, currency)}
              </span>
              <span className="text-error">
                -{formatCurrency(selectedDayData.totalExpense, currency)}
              </span>
            </div>
          </div>

          {selectedDayData.transactions.length === 0 ? (
            <p className="py-4 text-center text-label-sm text-on-surface-variant/60">
              Tidak ada transaksi
            </p>
          ) : (
            <div className="space-y-1.5">
              {selectedDayData.transactions.map((t) => {
                const cat = getCategory(t.categoryId);
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-container text-on-surface-variant">
                        <Icon name={cat?.icon || "folder"} size={12} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-label-sm font-medium text-on-surface">
                          {cat?.name || "Tanpa Kategori"}
                        </p>
                        {t.note && (
                          <p className="truncate text-[10px] text-on-surface-variant/60">{t.note}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-label-sm font-semibold ${
                        t.type === "income"
                          ? "text-tertiary"
                          : "text-error"
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
