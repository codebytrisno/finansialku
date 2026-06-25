"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTransactions,
  getSettings,
  getCategories,
  updateSettings,
  exportBackup,
  importBackup,
  resetAllData,
  initTheme,
  applyTheme,
} from "@/lib/store";
import {
  validateBackupData,
  readFileAsText,
  downloadJSON,
  exportToCSV,
  downloadFile,
} from "@/lib/utils";
import {
  type AppSettings,
  type BackupData,
  CURRENCY_OPTIONS,
} from "@/lib/types";
import {
  LuPalette,
  LuSun,
  LuMoon,
  LuMonitor,
  LuCoins,
  LuDownload,
  LuUpload,
  LuTriangleAlert,
  LuX,
} from "react-icons/lu";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "system",
    currency: "IDR",
    defaultCategoryId: "",
    language: "id",
  });
  const [categories, setCategories] = useState(() => getCategories());
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<"success" | "error" | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadData = useCallback(() => {
    setSettings(getSettings());
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    loadData();
    initTheme();
  }, [loadData]);

  const handleThemeChange = (theme: AppSettings["theme"]) => {
    const updated = updateSettings({ theme });
    setSettings(updated);
    applyTheme(theme);
  };

  const handleCurrencyChange = (currency: string) => {
    const updated = updateSettings({ currency });
    setSettings(updated);
  };

  const handleExportJSON = () => {
    const data = exportBackup();
    const filename = `finansialku-backup-${new Date().toISOString().split("T")[0]}.json`;
    downloadJSON(data, filename);
  };

  const handleExportCSV = () => {
    const transactions = getTransactions();
    const csv = exportToCSV(transactions, categories);
    const filename = `finansialku-transactions-${new Date().toISOString().split("T")[0]}.csv`;
    downloadFile(csv, filename, "text/csv");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileAsText(file);
      const data = JSON.parse(content);

      const validation = validateBackupData(data);
      if (!validation.valid) {
        setImportMessage(validation.error || "File backup tidak valid");
        setImportStatus("error");
        return;
      }

      const result = importBackup(data as BackupData, "replace");
      setImportMessage(result.message);
      setImportStatus(result.success ? "success" : "error");
      if (result.success) {
        loadData();
      }
    } catch {
      setImportMessage("Gagal membaca file backup. Pastikan format JSON valid.");
      setImportStatus("error");
    }

    // Reset input
    e.target.value = "";
  };

  const handleReset = () => {
    resetAllData();
    loadData();
    setShowResetConfirm(false);
    setImportMessage("Data berhasil direset!");
    setImportStatus("success");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Pengaturan
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Kelola preferensi aplikasi
        </p>
      </div>

      {/* Notification */}
      {importMessage && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            importStatus === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span>{importMessage}</span>
            <button
              onClick={() => setImportMessage(null)}
              className="ml-2 text-current opacity-50 hover:opacity-100"
            >
              <LuX size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Theme */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <LuPalette size={18} />
          Tampilan
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "light" as const, label: "Terang", icon: LuSun },
            { value: "dark" as const, label: "Gelap", icon: LuMoon },
            { value: "system" as const, label: "Sistem", icon: LuMonitor },
          ].map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => handleThemeChange(opt.value)}
                className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-center text-sm font-medium transition-all ${
                  settings.theme === opt.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                }`}
              >
                <Icon size={20} />
                <div>{opt.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Currency */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          <LuCoins size={18} />
          Mata Uang
        </h2>
        <select
          value={settings.currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.symbol} - {opt.code}
            </option>
          ))}
        </select>
      </div>

      {/* Export/Import */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Backup Data
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98]"
            >
              <LuDownload size={16} />
              Export JSON
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
            >
              <LuDownload size={16} />
              Export CSV
            </button>
          </div>
          <label className="block">
            <div className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-emerald-400">
              <LuUpload size={16} />
              Import Backup JSON
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Reset Data */}
      <div className="rounded-2xl border border-red-200 bg-white p-5 dark:border-red-900/30 dark:bg-zinc-900">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
          <LuTriangleAlert size={18} />
          Reset Data
        </h2>
        <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
          Hapus semua data transaksi dan kategori. Tindakan ini tidak bisa dibatalkan!
        </p>
        {showResetConfirm ? (
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-red-700"
            >
              Ya, Reset Semua Data
            </button>
            <button
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 rounded-xl border border-zinc-300 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full rounded-xl border border-red-300 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Reset Data
          </button>
        )}
      </div>

      {/* App Info */}
      <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>FinansialKu v1.0.0</p>
        <p>App offline — semua data disimpan di perangkatmu</p>
      </div>
    </div>
  );
}
