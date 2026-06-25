"use client";

import { generateId } from "./utils";
import type {
  Transaction,
  Category,
  Account,
  Budget,
  Transfer,
  RecurringTransaction,
  AppSettings,
  BackupData,
  TransactionFilters,
} from "./types";
import {
  DEFAULT_SETTINGS,
  DEFAULT_CATEGORIES,
  SCHEMA_VERSION,
} from "./types";

const STORAGE_KEYS = {
  transactions: "finance_transactions",
  categories: "finance_categories",
  settings: "finance_settings",
  accounts: "finance_accounts",
  budgets: "finance_budgets",
  transfers: "finance_transfers",
  recurring: "finance_recurring",
  initialized: "finance_initialized",
} as const;

function getTimestamp(): string {
  return new Date().toISOString();
}

// ─── Initialization ────────────────────────────────────────────

export function initializeStore(): void {
  if (typeof window === "undefined") return;
  const initialized = localStorage.getItem(STORAGE_KEYS.initialized);
  if (!initialized) {
    // Seed default categories
    const now = getTimestamp();
    const defaultCats: Category[] = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }));
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(defaultCats));
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(DEFAULT_SETTINGS));

    // Seed default accounts
    const defaultAccounts: Account[] = [
      { id: generateId(), name: "Dompet Cash", type: "cash", balance: 0, color: "#22c55e", icon: "wallet", isActive: true, createdAt: now, updatedAt: now },
      { id: generateId(), name: "Rekening Utama", type: "bank", balance: 0, color: "#3b82f6", icon: "bank", isActive: true, createdAt: now, updatedAt: now },
      { id: generateId(), name: "Tabungan", type: "savings", balance: 0, color: "#8b5cf6", icon: "piggy-bank", isActive: true, createdAt: now, updatedAt: now },
      { id: generateId(), name: "Kartu Kredit", type: "card", balance: 0, color: "#ef4444", icon: "credit-card", isActive: true, createdAt: now, updatedAt: now },
    ];
    localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(defaultAccounts));
    localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.transfers, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.recurring, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.initialized, "true");
  }
}

// ─── Transactions ──────────────────────────────────────────────

export function getTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.transactions);
    if (!data) return [];
    const all: Transaction[] = JSON.parse(data);
    return all.filter((t) => !t.deletedAt);
  } catch {
    return [];
  }
}

export function getAllTransactions(): Transaction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.transactions);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

export function addTransaction(
  data: Omit<Transaction, "id" | "createdAt" | "updatedAt" | "deletedAt">
): Transaction {
  const now = getTimestamp();
  const transaction: Transaction = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getAllTransactions();
  all.push(transaction);
  saveTransactions(all);
  // Update account balance
  if (transaction.accountId) {
    const delta = transaction.type === "income" ? transaction.amount : -transaction.amount;
    updateAccountBalance(transaction.accountId, delta);
  }
  return transaction;
}

export function updateTransaction(
  id: string,
  data: Partial<Omit<Transaction, "id" | "createdAt" | "deletedAt">>
): Transaction | null {
  const all = getAllTransactions();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const oldTx = all[idx];
  // Reverse old balance change
  if (oldTx.accountId) {
    const oldDelta = oldTx.type === "income" ? -oldTx.amount : oldTx.amount;
    updateAccountBalance(oldTx.accountId, oldDelta);
  }
  all[idx] = { ...all[idx], ...data, updatedAt: getTimestamp() };
  saveTransactions(all);
  // Apply new balance change
  const newTx = all[idx];
  if (newTx.accountId) {
    const newDelta = newTx.type === "income" ? newTx.amount : -newTx.amount;
    updateAccountBalance(newTx.accountId, newDelta);
  }
  return all[idx];
}

export function deleteTransaction(id: string): boolean {
  return softDeleteTransaction(id);
}

export function softDeleteTransaction(id: string): boolean {
  const all = getAllTransactions();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  const tx = all[idx];
  // Reverse balance change
  if (tx.accountId) {
    const delta = tx.type === "income" ? -tx.amount : tx.amount;
    updateAccountBalance(tx.accountId, delta);
  }
  all[idx] = { ...all[idx], deletedAt: getTimestamp(), updatedAt: getTimestamp() };
  saveTransactions(all);
  return true;
}

export function hardDeleteTransaction(id: string): boolean {
  const all = getAllTransactions();
  const idx = all.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  const tx = all[idx];
  // Reverse balance change
  if (tx.accountId) {
    const delta = tx.type === "income" ? -tx.amount : tx.amount;
    updateAccountBalance(tx.accountId, delta);
  }
  const filtered = all.filter((t) => t.id !== id);
  if (filtered.length === all.length) return false;
  saveTransactions(filtered);
  return true;
}

export function getTransactionById(id: string): Transaction | undefined {
  return getTransactions().find((t) => t.id === id);
}

export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions
    .filter((t) => {
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
      if (filters.dateFrom && t.transactionDate < filters.dateFrom) return false;
      if (filters.dateTo && t.transactionDate > filters.dateTo) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const catName = getCategoryNameById(t.categoryId).toLowerCase();
        if (
          !t.note.toLowerCase().includes(q) &&
          !catName.includes(q) &&
          !t.amount.toString().includes(q)
        )
          return false;
      }
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      switch (filters.sortField) {
        case "date":
          cmp = a.transactionDate.localeCompare(b.transactionDate);
          break;
        case "amount":
          cmp = a.amount - b.amount;
          break;
        case "category":
          cmp = a.categoryId.localeCompare(b.categoryId);
          break;
      }
      return filters.sortDirection === "desc" ? -cmp : cmp;
    });
}

// ─── Categories ────────────────────────────────────────────────

export function getCategories(): Category[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.categories);
    if (!data) return [];
    const cats: Category[] = JSON.parse(data);
    // Migrate old data: ensure parentId field exists
    return cats.map((c) => ({
      ...c,
      parentId: (c as any).parentId !== undefined ? (c as any).parentId : null,
    }));
  } catch {
    return [];
  }
}

function saveCategories(categories: Category[]): void {
  localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
}

export function addCategory(
  data: Omit<Category, "id" | "createdAt" | "updatedAt">
): Category {
  const now = getTimestamp();
  const category: Category = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getCategories();
  all.push(category);
  saveCategories(all);
  return category;
}

export function updateCategory(
  id: string,
  data: Partial<Omit<Category, "id" | "createdAt">>
): Category | null {
  const all = getCategories();
  const idx = all.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, updatedAt: getTimestamp() };
  saveCategories(all);
  return all[idx];
}

export function deleteCategory(id: string): boolean {
  const all = getCategories();
  const filtered = all.filter((c) => c.id !== id);
  if (filtered.length === all.length) return false;
  saveCategories(filtered);
  return true;
}

export function getCategoryNameById(id: string): string {
  const cat = getCategories().find((c) => c.id === id);
  return cat?.name || "Tanpa Kategori";
}

export function getCategoryById(id: string): Category | undefined {
  return getCategories().find((c) => c.id === id);
}

export function getCategoriesByType(type: "income" | "expense"): Category[] {
  return getCategories().filter((c) => c.type === type);
}

// ─── Sub-Categories ────────────────────────────────────────────

export function getTopLevelCategories(type?: "income" | "expense"): Category[] {
  const all = getCategories();
  return all.filter((c) => {
    if (type && c.type !== type) return false;
    return c.parentId === null;
  });
}

export function getSubCategories(parentId: string): Category[] {
  return getCategories().filter((c) => c.parentId === parentId);
}

export function getCategoryTree(type?: "income" | "expense"): { category: Category; subCategories: Category[] }[] {
  const all = getCategories();
  const tops = all.filter((c) => {
    if (type && c.type !== type) return false;
    return c.parentId === null;
  });
  return tops.map((cat) => ({
    category: cat,
    subCategories: all.filter((c) => c.parentId === cat.id),
  }));
}

export function getParentCategory(categoryId: string): Category | undefined {
  const cat = getCategoryById(categoryId);
  if (!cat || !cat.parentId) return undefined;
  return getCategoryById(cat.parentId);
}

export function getFullCategoryPath(categoryId: string): string {
  const cat = getCategoryById(categoryId);
  if (!cat) return "Tanpa Kategori";
  if (!cat.parentId) return cat.name;
  const parent = getCategoryById(cat.parentId);
  return parent ? `${parent.name} → ${cat.name}` : cat.name;
}

// ─── Accounts ──────────────────────────────────────────────────

export function getAccounts(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.accounts);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveAccounts(accounts: Account[]): void {
  localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(accounts));
}

export function addAccount(data: Omit<Account, "id" | "createdAt" | "updatedAt">): Account {
  const now = getTimestamp();
  const account: Account = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getAccounts();
  all.push(account);
  saveAccounts(all);
  return account;
}

export function updateAccount(id: string, data: Partial<Omit<Account, "id" | "createdAt">>): Account | null {
  const all = getAccounts();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, updatedAt: getTimestamp() };
  saveAccounts(all);
  return all[idx];
}

export function deleteAccount(id: string): boolean {
  const all = getAccounts();
  const filtered = all.filter((a) => a.id !== id);
  if (filtered.length === all.length) return false;
  saveAccounts(filtered);
  return true;
}

export function getAccountById(id: string): Account | undefined {
  return getAccounts().find((a) => a.id === id);
}

export function getActiveAccounts(): Account[] {
  return getAccounts().filter((a) => a.isActive);
}

export function updateAccountBalance(accountId: string, delta: number): void {
  const all = getAccounts();
  const idx = all.findIndex((a) => a.id === accountId);
  if (idx === -1) return;
  all[idx] = { ...all[idx], balance: all[idx].balance + delta, updatedAt: getTimestamp() };
  saveAccounts(all);
}

// Update all account balances based on transactions
// Income adds to account, expense subtracts from account
export function recalculateAllBalances(): void {
  const all = getAccounts();
  const txs = getTransactions();
  const transfers = getTransfers();

  // Reset all balances to 0
  for (const acc of all) {
    acc.balance = 0;
  }

  // Apply transactions
  for (const tx of txs) {
    if (tx.accountId) {
      const acc = all.find((a) => a.id === tx.accountId);
      if (acc) {
        acc.balance += tx.type === "income" ? tx.amount : -tx.amount;
      }
    }
  }

  // Apply transfers
  for (const tr of transfers) {
    const fromAcc = all.find((a) => a.id === tr.fromAccountId);
    const toAcc = all.find((a) => a.id === tr.toAccountId);
    if (fromAcc) fromAcc.balance -= tr.amount;
    if (toAcc) toAcc.balance += tr.amount;
  }

  saveAccounts(all);
}

// ─── Budgets ───────────────────────────────────────────────────

export function getBudgets(): Budget[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.budgets);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveBudgets(budgets: Budget[]): void {
  localStorage.setItem(STORAGE_KEYS.budgets, JSON.stringify(budgets));
}

export function addBudget(data: Omit<Budget, "id" | "createdAt" | "updatedAt">): Budget {
  const now = getTimestamp();
  const budget: Budget = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getBudgets();
  all.push(budget);
  saveBudgets(all);
  return budget;
}

export function updateBudget(id: string, data: Partial<Omit<Budget, "id" | "createdAt">>): Budget | null {
  const all = getBudgets();
  const idx = all.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, updatedAt: getTimestamp() };
  saveBudgets(all);
  return all[idx];
}

export function deleteBudget(id: string): boolean {
  const all = getBudgets();
  const filtered = all.filter((b) => b.id !== id);
  if (filtered.length === all.length) return false;
  saveBudgets(filtered);
  return true;
}

export function getBudgetsByPeriod(period: "weekly" | "monthly" | "yearly", reference: string): Budget[] {
  return getBudgets().filter((b) => b.period === period && b.month === reference);
}

// ─── Transfers ─────────────────────────────────────────────────

export function getTransfers(): Transfer[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.transfers);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveTransfers(transfers: Transfer[]): void {
  localStorage.setItem(STORAGE_KEYS.transfers, JSON.stringify(transfers));
}

export function addTransfer(data: Omit<Transfer, "id" | "createdAt" | "updatedAt">): Transfer {
  const now = getTimestamp();
  const transfer: Transfer = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getTransfers();
  all.push(transfer);
  saveTransfers(all);
  // Update account balances
  updateAccountBalance(transfer.fromAccountId, -transfer.amount);
  updateAccountBalance(transfer.toAccountId, transfer.amount);
  return transfer;
}

export function deleteTransfer(id: string): boolean {
  const all = getTransfers();
  const transfer = all.find((t) => t.id === id);
  if (!transfer) return false;
  const filtered = all.filter((t) => t.id !== id);
  if (filtered.length === all.length) return false;
  saveTransfers(filtered);
  // Reverse balance changes
  updateAccountBalance(transfer.fromAccountId, transfer.amount);
  updateAccountBalance(transfer.toAccountId, -transfer.amount);
  return true;
}

// ─── Recurring Transactions ────────────────────────────────────

export function getRecurringTransactions(): RecurringTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.recurring);
    if (!data) return [];
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveRecurringTransactions(recurring: RecurringTransaction[]): void {
  localStorage.setItem(STORAGE_KEYS.recurring, JSON.stringify(recurring));
}

export function addRecurringTransaction(data: Omit<RecurringTransaction, "id" | "createdAt" | "updatedAt">): RecurringTransaction {
  const now = getTimestamp();
  const recurring: RecurringTransaction = {
    ...data,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  };
  const all = getRecurringTransactions();
  all.push(recurring);
  saveRecurringTransactions(all);
  return recurring;
}

export function updateRecurringTransaction(id: string, data: Partial<Omit<RecurringTransaction, "id" | "createdAt">>): RecurringTransaction | null {
  const all = getRecurringTransactions();
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...data, updatedAt: getTimestamp() };
  saveRecurringTransactions(all);
  return all[idx];
}

export function deleteRecurringTransaction(id: string): boolean {
  const all = getRecurringTransactions();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  saveRecurringTransactions(filtered);
  return true;
}

export function getActiveRecurringTransactions(): RecurringTransaction[] {
  return getRecurringTransactions().filter((r) => r.active);
}

export function getDueRecurringTransactions(): RecurringTransaction[] {
  const today = new Date().toISOString().split("T")[0];
  return getActiveRecurringTransactions().filter((r) => r.nextDate <= today);
}

// ─── Settings ──────────────────────────────────────────────────

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.settings);
    return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function updateSettings(
  data: Partial<AppSettings>
): AppSettings {
  const current = getSettings();
  const updated = { ...current, ...data };
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(updated));
  return updated;
}

// ─── Aggregation ───────────────────────────────────────────────

export function getTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getTotalExpense(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getBalance(transactions: Transaction[]): number {
  return getTotalIncome(transactions) - getTotalExpense(transactions);
}

// ─── Backup ────────────────────────────────────────────────────

export function exportBackup(): BackupData {
  return {
    metadata: {
      schemaVersion: SCHEMA_VERSION,
      appVersion: "1.0.0",
      exportedAt: getTimestamp(),
      recordCount: getTransactions().length,
    },
    transactions: getTransactions(),
    categories: getCategories(),
    accounts: getAccounts(),
    budgets: getBudgets(),
    transfers: getTransfers(),
    recurring: getRecurringTransactions(),
    settings: getSettings(),
  };
}

export function importBackup(
  data: BackupData,
  mode: "merge" | "replace" = "replace"
): { success: boolean; count: number; message: string } {
  try {
    if (mode === "replace") {
      saveTransactions(data.transactions);
      saveCategories(data.categories);
      if (data.accounts) saveAccounts(data.accounts);
      if (data.budgets) saveBudgets(data.budgets);
      if (data.transfers) saveTransfers(data.transfers);
      if (data.recurring) saveRecurringTransactions(data.recurring);
      updateSettings(data.settings);
      recalculateAllBalances();
    } else {
      // Merge mode: add data that doesn't exist
      const existingTx = getAllTransactions();
      const existingTxIds = new Set(existingTx.map((t) => t.id));
      const newTx = data.transactions.filter((t) => !existingTxIds.has(t.id));
      saveTransactions([...existingTx, ...newTx]);

      const existingCat = getCategories();
      const existingCatIds = new Set(existingCat.map((c) => c.id));
      const newCat = data.categories.filter((c) => !existingCatIds.has(c.id));
      saveCategories([...existingCat, ...newCat]);

      if (data.accounts) {
        const existingAcc = getAccounts();
        const existingAccIds = new Set(existingAcc.map((a) => a.id));
        const newAcc = data.accounts.filter((a) => !existingAccIds.has(a.id));
        saveAccounts([...existingAcc, ...newAcc]);
      }
    }
    return { success: true, count: data.transactions.length, message: "Import berhasil!" };
  } catch (e) {
    return { success: false, count: 0, message: `Import gagal: ${e}` };
  }
}

export function resetAllData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.transactions);
  localStorage.removeItem(STORAGE_KEYS.categories);
  localStorage.removeItem(STORAGE_KEYS.settings);
  localStorage.removeItem(STORAGE_KEYS.accounts);
  localStorage.removeItem(STORAGE_KEYS.budgets);
  localStorage.removeItem(STORAGE_KEYS.transfers);
  localStorage.removeItem(STORAGE_KEYS.recurring);
  localStorage.removeItem(STORAGE_KEYS.initialized);
  initializeStore();
}

// ─── Theme ─────────────────────────────────────────────────────

export function applyTheme(theme: AppSettings["theme"]): void {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "light") {
    root.classList.remove("dark");
  } else {
    // system
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", prefersDark);
  }
}

export function initTheme(): void {
  const settings = getSettings();
  applyTheme(settings.theme);
}
