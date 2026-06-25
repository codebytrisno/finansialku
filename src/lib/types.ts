export type TransactionType = "income" | "expense";

// ─── Account Types ────────────────────────────────────────────
export type AccountType = "cash" | "bank" | "card" | "e-wallet" | "investment" | "savings" | "other";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Budget Types ─────────────────────────────────────────────
export type BudgetPeriod = "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  categoryId: string;
  period: BudgetPeriod;
  amount: number;
  month: string; // YYYY-MM for monthly, YYYY-MM-DD for weekly start, YYYY for yearly
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
  period: BudgetPeriod;
  periodLabel: string;
}

// ─── Transfer Types ───────────────────────────────────────────
export interface Transfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note: string;
  transactionDate: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
}

// ─── Recurring Transaction Types ──────────────────────────────
export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";
export type RecurringType = "income" | "expense" | "transfer";

export interface RecurringTransaction {
  id: string;
  type: RecurringType;
  amount: number;
  categoryId: string;
  fromAccountId: string;
  toAccountId: string; // for transfer type
  accountId: string; // for income/expense type
  frequency: RecurringFrequency;
  interval: number; // every N days/weeks/months/years
  startDate: string; // YYYY-MM-DD
  endDate?: string; // optional end date
  nextDate: string; // next occurrence
  note: string;
  label: string; // display name like "Gaji", "Asuransi", etc.
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  transactionDate: string; // YYYY-MM-DD
  accountId?: string; // Link to Account
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  currency: string;
  defaultCategoryId: string;
  language: string;
}

export interface BackupMetadata {
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  recordCount: number;
}

export interface BackupData {
  metadata: BackupMetadata;
  transactions: Transaction[];
  categories: Category[];
  accounts?: Account[];
  budgets?: Budget[];
  transfers?: Transfer[];
  recurring?: RecurringTransaction[];
  settings: AppSettings;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  balance: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  type: TransactionType;
  total: number;
  percentage: number;
  count: number;
}

export interface WeeklySummary {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  income: number;
  expense: number;
  balance: number;
}

export interface YearlySummary {
  year: string; // YYYY
  months: MonthlySummary[];
  totalIncome: number;
  totalExpense: number;
  totalBalance: number;
}

export interface AssetTrend {
  date: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  netWorth: number; // cumulative balance up to this month
}

export interface DayTransactions {
  date: string; // YYYY-MM-DD
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
}

export type SortField = "date" | "amount" | "category";
export type SortDirection = "asc" | "desc";

export interface TransactionFilters {
  search: string;
  type: TransactionType | "all";
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  sortField: SortField;
  sortDirection: SortDirection;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  currency: "IDR",
  defaultCategoryId: "",
  language: "id",
};

export const SCHEMA_VERSION = 1;

export const DEFAULT_CATEGORIES: Omit<Category, "id" | "createdAt" | "updatedAt">[] = [
  // Income
  { name: "Gaji", type: "income", color: "#22c55e", icon: "wallet", parentId: null },
  { name: "Freelance", type: "income", color: "#3b82f6", icon: "laptop", parentId: null },
  { name: "Investasi", type: "income", color: "#8b5cf6", icon: "trending-up", parentId: null },
  { name: "Hadiah", type: "income", color: "#f59e0b", icon: "gift", parentId: null },
  { name: "Lainnya (Pemasukan)", type: "income", color: "#6b7280", icon: "download", parentId: null },
  // Expense
  { name: "Makanan", type: "expense", color: "#ef4444", icon: "utensils", parentId: null },
  { name: "Transportasi", type: "expense", color: "#f97316", icon: "car", parentId: null },
  { name: "Belanja", type: "expense", color: "#ec4899", icon: "shopping-bag", parentId: null },
  { name: "Tagihan", type: "expense", color: "#6366f1", icon: "file-text", parentId: null },
  { name: "Hiburan", type: "expense", color: "#14b8a6", icon: "gamepad", parentId: null },
  { name: "Kesehatan", type: "expense", color: "#10b981", icon: "hospital", parentId: null },
  { name: "Pendidikan", type: "expense", color: "#06b6d4", icon: "book-open", parentId: null },
  { name: "Lainnya (Pengeluaran)", type: "expense", color: "#6b7280", icon: "upload", parentId: null },
];

export const CURRENCY_OPTIONS = [
  { code: "IDR", symbol: "Rp", locale: "id-ID" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "MYR", symbol: "RM", locale: "ms-MY" },
  { code: "SGD", symbol: "S$", locale: "en-SG" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "KRW", symbol: "₩", locale: "ko-KR" },
];
