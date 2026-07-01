"use client";

import { useState, useEffect, useCallback } from "react";
import type { Category } from "@/lib/types";
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
import { Skeleton } from "@/components/Skeleton";
import { MaterialSymbol } from "@/components/MaterialSymbol";
import { useToast } from "@/components/Toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>({
    theme: "system",
    currency: "IDR",
    defaultCategoryId: "",
    language: "id",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const loadData = useCallback(() => {
    setSettings(getSettings());
    setCategories(getCategories());
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      loadData();
      initTheme();
      setLoading(false);
    });
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
        showToast(validation.error || "File backup tidak valid", "error");
        return;
      }

      const result = importBackup(data as BackupData, "replace");
      showToast(result.message, result.success ? "success" : "error");
      if (result.success) {
        loadData();
      }
    } catch {
      showToast("Gagal membaca file backup. Pastikan format JSON valid.", "error");
    }

    e.target.value = "";
  };

  const handleReset = () => {
    resetAllData();
    loadData();
    setShowResetConfirm(false);
    showToast("Semua data berhasil direset!");
  };

  const themeOptions = [
    { value: "light" as const, label: "Terang", icon: "light_mode" },
    { value: "dark" as const, label: "Gelap", icon: "dark_mode" },
    { value: "system" as const, label: "Sistem", icon: "settings_brightness" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-24 lg:pb-8">
      {loading && (
        <>
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </>
      )}
      {!loading && (<>
      {/* Header */}
      <div>
        <h1 className="text-label-md sm:text-headline-lg font-bold text-on-surface">
          Pengaturan
        </h1>
        <p className="text-label-xs sm:text-body-md text-on-surface-variant">
          Personalisasi dan amankan data finansial Anda.
        </p>
      </div>

      {/* Theme */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="flex items-center gap-2 mb-6">
          <MaterialSymbol icon="palette" className="text-primary" />
          <h2 className="text-headline-md font-bold text-on-surface">
            Tema Aplikasi
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`p-4 border-2 rounded-xl transition-all text-center ${
                settings.theme === opt.value
                  ? "border-primary bg-primary-container/10"
                  : "border-outline-variant hover:border-primary"
              }`}
            >
              <div className="h-20 rounded-lg border border-outline-variant mb-3 flex items-center justify-center bg-surface">
                <MaterialSymbol
                  icon={opt.icon}
                  size={24}
                  className={settings.theme === opt.value ? "text-primary" : "text-on-surface"}
                />
              </div>
              <span className="text-label-md block text-center">{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="flex items-center gap-2 mb-4">
          <MaterialSymbol icon="payments" className="text-primary" />
          <h2 className="text-headline-md font-bold text-on-surface">
            Mata Uang
          </h2>
        </div>
        <p className="text-body-md text-on-surface-variant mb-4">
          Pilih mata uang default untuk semua catatan transaksi Anda.
        </p>
        <select
          value={settings.currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {CURRENCY_OPTIONS.map((opt) => (
            <option key={opt.code} value={opt.code}>
              {opt.symbol} - {opt.code}
            </option>
          ))}
        </select>
      </div>

      {/* Export/Import */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
        <div className="flex items-center gap-2 mb-6">
          <MaterialSymbol icon="backup" className="text-primary" />
          <h2 className="text-headline-md font-bold text-on-surface">
            Cadangkan & Pulihkan
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Export */}
          <div>
            <h3 className="text-label-md font-bold mb-3">
              Ekspor Data
            </h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              Unduh salinan data Anda untuk disimpan secara luring.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleExportJSON}
                className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MaterialSymbol icon="save" className="text-primary" />
                  <span className="text-label-md font-bold">Ekspor JSON</span>
                </div>
                <span className="text-label-sm text-on-surface-variant">Semua Data</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center justify-between w-full p-4 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MaterialSymbol icon="table_view" className="text-primary" />
                  <span className="text-label-md font-bold">Ekspor CSV</span>
                </div>
                <span className="text-label-sm text-on-surface-variant">Hanya Transaksi</span>
              </button>
            </div>
          </div>
          {/* Import */}
          <div>
            <h3 className="text-label-md font-bold mb-3">
              Impor Data
            </h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              Unggah berkas JSON untuk memulihkan catatan keuangan.
            </p>
            <label className="block">
              <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 text-center hover:border-primary transition-all cursor-pointer bg-surface-container-lowest/50">
                <MaterialSymbol icon="upload_file" className="text-4xl text-outline mb-2" />
                <p className="text-label-md font-bold">Klik atau seret berkas JSON ke sini</p>
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
      </div>

      {/* Reset Data */}
      <div className="border-2 border-error/20 rounded-xl p-6 bg-error-container/5">
        <div className="flex items-center gap-2 mb-4">
          <MaterialSymbol icon="warning" className="text-error" />
          <h2 className="text-headline-md font-bold text-error">
            Area Berbahaya
          </h2>
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-label-md font-bold">Reset Semua Data</h3>
            <p className="text-body-md text-on-surface-variant">
              Menghapus seluruh riwayat transaksi, anggaran, dan kategori secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          {showResetConfirm ? (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleReset}
                className="rounded-xl bg-error px-5 py-2.5 text-label-md font-medium text-on-error hover:bg-error/90 transition-all"
              >
                Ya, Reset Semua Data
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-outline-variant px-5 py-2.5 text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="shrink-0 rounded-xl border border-error px-5 py-2.5 text-label-md font-medium text-error hover:bg-error hover:text-on-error transition-all"
            >
              Reset Semua Data
            </button>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="text-center text-label-sm text-on-surface-variant/60">
        <p>FinansialKu v1.0.0</p>
        <p>App offline — semua data disimpan di perangkatmu</p>
      </div>
    </>)}
    </div>
  );
}
