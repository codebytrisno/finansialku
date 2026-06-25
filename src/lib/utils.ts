import {
  CURRENCY_OPTIONS,
  type Transaction,
  type Category,
  type Budget,
  type BudgetProgress,
  type RecurringTransaction,
  type MonthlySummary,
  type CategoryBreakdown,
  type WeeklySummary,
  type YearlySummary,
  type AssetTrend,
  type DayTransactions,
} from "./types";

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export function formatCurrency(
  amount: number,
  currencyCode: string = "IDR"
): string {
  const opt = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
  if (!opt) return amount.toLocaleString("id-ID");

  try {
    return new Intl.NumberFormat(opt.locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${opt.symbol}${amount.toLocaleString("id-ID")}`;
  }
}

export function getCurrencySymbol(code: string): string {
  const opt = CURRENCY_OPTIONS.find((c) => c.code === code);
  return opt?.symbol || "Rp";
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string): string {
  try {
    return new Date(dateStr + "T00:00:00").toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return dateStr;
  }
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthLabel(month: string): string {
  const [y, m] = month.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export function formatMonthYear(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getMonthRange(count: number = 6): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(formatMonthYear(d));
  }
  return months;
}

export function getCategoryById(
  categories: Category[],
  id: string
): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getCategoryName(
  categories: Category[],
  id: string
): string {
  return getCategoryById(categories, id)?.name || "Tanpa Kategori";
}

export function getCategoryColor(
  categories: Category[],
  id: string
): string {
  return getCategoryById(categories, id)?.color || "#6b7280";
}

export function getCategoryIcon(
  categories: Category[],
  id: string
): string {
  return getCategoryById(categories, id)?.icon || "folder";
}

export function calculateBalance(
  transactions: Transaction[]
): number {
  return transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);
}

// ─── Week helpers ──────────────────────────────────────────────

export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

export function getWeekEnd(date: Date = new Date()): string {
  const start = new Date(getWeekStart(date) + "T00:00:00");
  start.setDate(start.getDate() + 6);
  return start.toISOString().split("T")[0];
}

export function getWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + "T00:00:00");
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmtStart = start.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const fmtEnd = end.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return `${fmtStart} - ${fmtEnd}`;
}

export function getWeeksInMonth(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const weeks: Set<string> = new Set();
  const daysInMonth = new Date(y, m, 0).getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(y, m - 1, day);
    weeks.add(getWeekStart(d));
  }
  return Array.from(weeks).sort();
}

export function calculateWeeklySummary(
  transactions: Transaction[],
  weekStart: string
): WeeklySummary {
  const weekEndDate = new Date(weekStart + "T00:00:00");
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = weekEndDate.toISOString().split("T")[0];

  const filtered = transactions.filter((t) => {
    return t.transactionDate >= weekStart && t.transactionDate <= weekEnd;
  });
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { weekStart, weekEnd, income, expense, balance: income - expense };
}

// ─── Year helpers ──────────────────────────────────────────────

export function getCurrentYear(): string {
  return new Date().getFullYear().toString();
}

export function getYearMonths(year: string): string[] {
  const months: string[] = [];
  for (let i = 0; i < 12; i++) {
    months.push(`${year}-${String(i + 1).padStart(2, "0")}`);
  }
  return months;
}

export function calculateYearlySummary(
  transactions: Transaction[],
  year: string
): YearlySummary {
  const months = getYearMonths(year);
  const monthlySummaries = calculateMonthlySummaries(transactions, months);
  return {
    year,
    months: monthlySummaries,
    totalIncome: monthlySummaries.reduce((s, m) => s + m.income, 0),
    totalExpense: monthlySummaries.reduce((s, m) => s + m.expense, 0),
    totalBalance: monthlySummaries.reduce((s, m) => s + m.balance, 0),
  };
}

// ─── Asset Trend ───────────────────────────────────────────────

export function calculateAssetTrend(
  transactions: Transaction[],
  months: string[]
): AssetTrend[] {
  const summaries = calculateMonthlySummaries(transactions, months);
  let cumulative = 0;
  return summaries.map((m) => {
    cumulative += m.income - m.expense;
    return {
      date: m.month,
      totalIncome: m.income,
      totalExpense: m.expense,
      netWorth: cumulative,
    };
  });
}

// ─── Day Transactions ──────────────────────────────────────────

export function getDayTransactions(
  transactions: Transaction[],
  date: string
): DayTransactions {
  const dayTx = transactions.filter((t) => t.transactionDate === date);
  const income = dayTx
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = dayTx
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { date, transactions: dayTx, totalIncome: income, totalExpense: expense };
}

export function getMonthDays(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const days: string[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(`${month}-${String(d).padStart(2, "0")}`);
  }
  return days;
}

export function calculateMonthlySummary(
  transactions: Transaction[],
  month: string
): MonthlySummary {
  const filtered = transactions.filter((t) => t.transactionDate.startsWith(month));
  const income = filtered
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = filtered
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  return { month, income, expense, balance: income - expense };
}

export function calculateMonthlySummaries(
  transactions: Transaction[],
  months: string[]
): MonthlySummary[] {
  return months.map((m) => calculateMonthlySummary(transactions, m));
}

export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  type: "income" | "expense"
): CategoryBreakdown[] {
  const filtered = transactions.filter(
    (t) => t.transactionDate.startsWith(month) && t.type === type
  );
  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  if (total === 0) return [];

  const grouped: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const t of filtered) {
    grouped[t.categoryId] = (grouped[t.categoryId] || 0) + t.amount;
    counts[t.categoryId] = (counts[t.categoryId] || 0) + 1;
  }

  return Object.entries(grouped)
    .map(([catId, totalAmt]) => {
      const cat = getCategoryById(categories, catId);
      return {
        categoryId: catId,
        categoryName: cat?.name || "Tanpa Kategori",
        categoryColor: cat?.color || "#6b7280",
        type,
        total: totalAmt,
        percentage: Math.round((totalAmt / total) * 100),
        count: counts[catId] || 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export function exportToCSV(transactions: Transaction[], categories: Category[]): string {
  const header = "Tipe,Jumlah,Kategori,Catatan,Tanggal";
  const rows = transactions.map((t) => {
    const catName = getCategoryName(categories, t.categoryId);
    return `${t.type === "income" ? "Pemasukan" : "Pengeluaran"},${t.amount},"${catName}","${t.note.replace(/"/g, '""')}",${t.transactionDate}`;
  });
  return [header, ...rows].join("\n");
}

// ─── Budget Helpers ───────────────────────────────────────────

export function calculateBudgetProgress(
  budgets: Budget[],
  transactions: Transaction[],
  categories: Category[],
  period: "weekly" | "monthly" | "yearly",
  reference: string // YYYY-MM for monthly, YYYY-MM-DD for weekly start, YYYY for yearly
): BudgetProgress[] {
  const filteredBudgets = budgets.filter((b) => b.period === period && b.month === reference);
  if (filteredBudgets.length === 0) return [];

  // Calculate date range
  let startDate: string, endDate: string;
  if (period === "weekly") {
    startDate = reference;
    const end = new Date(reference + "T00:00:00");
    end.setDate(end.getDate() + 6);
    endDate = end.toISOString().split("T")[0];
  } else if (period === "monthly") {
    startDate = reference + "-01";
    const [y, m] = reference.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    endDate = `${reference}-${String(daysInMonth).padStart(2, "0")}`;
  } else {
    // yearly
    startDate = reference + "-01-01";
    endDate = reference + "-12-31";
  }

  // Filter transactions in date range
  const periodTx = transactions.filter(
    (t) => t.type === "expense" && t.transactionDate >= startDate && t.transactionDate <= endDate
  );

  return filteredBudgets.map((budget) => {
    const cat = categories.find((c) => c.id === budget.categoryId);
    const spentAmount = periodTx
      .filter((t) => t.categoryId === budget.categoryId)
      .reduce((sum, t) => sum + t.amount, 0);
    const remainingAmount = budget.amount - spentAmount;
    const percentage = budget.amount > 0 ? Math.min(Math.round((spentAmount / budget.amount) * 100), 100) : 0;

    let periodLabel = "";
    if (period === "weekly") {
      const start = new Date(reference + "T00:00:00");
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      periodLabel = `${start.toLocaleDateString("id-ID", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}`;
    } else if (period === "monthly") {
      periodLabel = getMonthLabel(reference);
    } else {
      periodLabel = reference;
    }

    return {
      budgetId: budget.id,
      categoryId: budget.categoryId,
      categoryName: cat?.name || "Tanpa Kategori",
      categoryColor: cat?.color || "#6b7280",
      budgetAmount: budget.amount,
      spentAmount,
      remainingAmount,
      percentage,
      period,
      periodLabel,
    };
  }).sort((a, b) => b.percentage - a.percentage);
}

export function getTotalBudget(budgets: Budget[], period: "weekly" | "monthly" | "yearly", reference: string): number {
  return budgets
    .filter((b) => b.period === period && b.month === reference)
    .reduce((sum, b) => sum + b.amount, 0);
}

export function getTotalSpent(budgets: Budget[], transactions: Transaction[], period: "weekly" | "monthly" | "yearly", reference: string): number {
  const filteredBudgets = budgets.filter((b) => b.period === period && b.month === reference);
  if (filteredBudgets.length === 0) return 0;

  let startDate: string, endDate: string;
  if (period === "weekly") {
    startDate = reference;
    const end = new Date(reference + "T00:00:00");
    end.setDate(end.getDate() + 6);
    endDate = end.toISOString().split("T")[0];
  } else if (period === "monthly") {
    startDate = reference + "-01";
    const [y, m] = reference.split("-").map(Number);
    const daysInMonth = new Date(y, m, 0).getDate();
    endDate = `${reference}-${String(daysInMonth).padStart(2, "0")}`;
  } else {
    startDate = reference + "-01-01";
    endDate = reference + "-12-31";
  }

  const categoryIds = new Set(filteredBudgets.map((b) => b.categoryId));
  return transactions
    .filter((t) => t.type === "expense" && categoryIds.has(t.categoryId) && t.transactionDate >= startDate && t.transactionDate <= endDate)
    .reduce((sum, t) => sum + t.amount, 0);
}

// ─── Recurring Helpers ─────────────────────────────────────────

export function calculateNextDate(recurring: RecurringTransaction): string {
  const current = new Date(recurring.nextDate + "T00:00:00");
  let next = new Date(current);

  switch (recurring.frequency) {
    case "daily":
      next.setDate(next.getDate() + recurring.interval);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7 * recurring.interval);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + recurring.interval);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + recurring.interval);
      break;
  }

  return next.toISOString().split("T")[0];
}

export function getRecurringLabel(type: string): string {
  const labels: Record<string, string> = {
    salary: "Gaji",
    insurance: "Asuransi",
    deposit: "Deposito",
    loan: "Pinjaman",
    rent: "Sewa",
    subscription: "Langganan",
    savings: "Tabungan Rutin",
    other: "Lainnya",
  };
  return labels[type] || type;
}

export function getAccountTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cash: "Tunai",
    bank: "Bank",
    card: "Kartu",
    "e-wallet": "E-Wallet",
    investment: "Investasi",
    savings: "Tabungan",
    other: "Lainnya",
  };
  return labels[type] || type;
}

export function getAccountTypeColor(type: string): string {
  const colors: Record<string, string> = {
    cash: "#22c55e",
    bank: "#3b82f6",
    card: "#ef4444",
    "e-wallet": "#f59e0b",
    investment: "#8b5cf6",
    savings: "#06b6d4",
    other: "#6b7280",
  };
  return colors[type] || "#6b7280";
}

export function downloadFile(content: string, filename: string, mime: string = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string) {
  downloadFile(JSON.stringify(data, null, 2), filename, "application/json");
}

export function validateBackupData(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") return { valid: false, error: "Format file tidak valid" };
  const d = data as Record<string, unknown>;
  if (!d.metadata || typeof d.metadata !== "object") return { valid: false, error: "Metadata backup tidak ditemukan" };
  if (!Array.isArray(d.transactions)) return { valid: false, error: "Data transaksi tidak valid" };
  if (!Array.isArray(d.categories)) return { valid: false, error: "Data kategori tidak valid" };
  return { valid: true };
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsText(file);
  });
}
