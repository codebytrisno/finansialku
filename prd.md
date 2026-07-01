# PRD Full App — Actual State
## Personal Finance App (FinansialKu)
**Version:** 1.0
**Mode:** Full offline browser-first (localStorage) + Capacitor hybrid mobile
**Platform:** Next.js static export + Capacitor 8 (Android APK)
**Bahasa:** Indonesia

## 1. Product Goal
Aplikasi untuk mencatat pemasukan dan pengeluaran secara cepat, melihat ringkasan keuangan, dan mengelola data secara offline. Semua data disimpan di localStorage browser, tanpa server eksternal. Aplikasi bisa di-deploy sebagai static site, PWA, atau APK Android via Capacitor.

## 2. Target User
- User personal yang mau catatan keuangan sederhana.
- User mobile-first yang butuh akses cepat di HP.
- User yang pengen data lokal, tidak tergantung cloud.

## 3. Product Scope

### In scope (✓ = implemented)
- ✓ Dashboard ringkas dengan saldo, pemasukan/pengeluaran bulan ini, grafik, transaksi terbaru, akun quick-view.
- ✓ Tambah/edit/hapus transaksi (income & expense) dengan kalkulator built-in.
- ✓ Kategori transaksi (default + custom + sub-kategori).
- ✓ Multi-account (Cash, Bank, Card, E-Wallet, Investment, Savings, Other).
- ✓ Transfer antar akun.
- ✓ Budget planning per kategori (weekly/monthly/yearly).
- ✓ Recurring transactions (daily/weekly/monthly/yearly, interval, enable/disable).
- ✓ Calendar view transaksi di laporan.
- ✓ Filter, search, dan sorting.
- ✓ Laporan (Monthly, Weekly, Yearly, Calendar) dengan bar chart, donut chart, asset trend.
- ✓ Settings (Theme Light/Dark/System, Currency 7 pilihan, Export/Import, Reset).
- ✓ Export/import backup (JSON full backup, CSV transaksi, merge/replace).
- ✓ Dark mode real-time.
- ✓ PWA (manifest.json, icon.svg, standalone display).
- ✓ Android APK via Capacitor 8.

### Out of scope
- Login/auth.
- Cloud sync.
- Multi-user.
- Server API eksternal.
- Analitik kompleks berbasis AI.
- Enkripsi database.
- Schema migration/versioning (SCHEMA_VERSION=1 statis).

## 4. Tech Stack (Actual)
| Komponen | Teknologi |
|---|---|
| Framework | Next.js 16.2.9 (`output: 'export'`) |
| UI Library | React 19.2.4 |
| Styling | Tailwind CSS v4 |
| Icons | react-icons (Lucide) |
| Charts | Custom SVG (BarChart, DonutChart, LineChart) |
| State/Storage | Custom store via localStorage |
| Mobile Wrapper | Capacitor 8 (Android) |
| TypeScript | Strict mode |
| Font | Geist (Geist Sans & Geist Mono) |

## 5. Core User Flow
1. User buka app.
2. Dashboard tampil otomatis (saldo, ringkasan, grafik 6 bulan, akun quick-view, transaksi terbaru).
3. User tambah transaksi via form modal (dengan kalkulator bawaan dan pilihan akun).
4. Data disimpan ke localStorage.
5. Dashboard dan list update real-time.
6. User bisa export backup (JSON/CSV).
7. User bisa import backup (merge/replace).

## 6. Frontend Pages

### A. Dashboard (`/`)
- Total kekayaan (saldo dari seluruh akun).
- Pemasukan bulan ini.
- Pengeluaran bulan ini.
- Akun quick-view tags + cards.
- Grafik bar 6 bulan income vs expense.
- 5 transaksi terbaru.
- Tombol tambah transaksi (header + FAB mobile).

### B. Transaction List (`/transactions`)
- List transaksi full.
- Search (by note, kategori, amount).
- Filter tipe (income/expense/all).
- Filter kategori.
- Filter tanggal (date range).
- Sorting (date/amount/category, asc/desc).
- Edit & delete action per item.
- Empty state.

### C. Transaction Form (Modal component)
- Tipe transaksi (income/expense toggle).
- Nominal (dengan kalkulator built-in numeric keypad).
- Kategori (tree: parent + sub-kategori).
- Akun (pilih dari multi-account).
- Tanggal (date picker native).
- Catatan (text area).

### D. Categories (`/categories`)
- List kategori default (5 income + 8 expense).
- Tambah kategori custom (name, type, color picker 16 warna, icon picker 40+ icon).
- Edit kategori.
- Hapus kategori.
- Sub-kategori (parent-child hierarchy).

### E. Accounts (`/accounts`)
- Multi-account: Cash, Bank, Card, E-Wallet, Investment, Savings, Other.
- Tambah/edit/hapus akun.
- Balance tracking otomatis dari transaksi & transfer.
- Quick-view balance di dashboard.

### F. Transfers (`/transfers`)
- Transfer antar akun.
- Balance update otomatis (fromAccount -amount, toAccount +amount).
- Daftar riwayat transfer.
- Hapus transfer (reverse balance).

### G. Recurring Transactions (`/transfers`)
- Income/Expense/Transfer recurring.
- Frequency: daily, weekly, monthly, yearly.
- Interval support (every N days/weeks/etc).
- Auto next-date calculation.
- Enable/disable toggle.
- Due date indicators.

### H. Budgets (`/budgets`)
- Budget per kategori.
- Period: weekly, monthly, yearly.
- Progress bar dengan persentase.
- Over-budget warning.
- Budget vs actual comparison.

### I. Reports (`/reports`)
- 4 tabs: Monthly, Weekly, Yearly, Calendar.
- Summary cards (income, expense, balance).
- Bar chart income vs expense.
- Donut chart breakdown kategori.
- Asset trend line chart.
- Calendar view dengan color-coded daily totals.

### J. Settings (`/settings`)
- Theme: Light / Dark / System (real-time apply via inline script).
- Currency: IDR, USD, EUR, MYR, SGD, JPY, KRW.
- Export JSON (full backup: transaksi, kategori, akun, budget, transfer, recurring, settings).
- Export CSV (transaksi only).
- Import JSON (validasi + merge/replace).
- Reset all data.

## 7. Data Storage (Actual)

### localStorage keys:
| Key | Data |
|---|---|
| `finance_transactions` | Transaction[] |
| `finance_categories` | Category[] |
| `finance_accounts` | Account[] |
| `finance_budgets` | Budget[] |
| `finance_transfers` | Transfer[] |
| `finance_recurring` | RecurringTransaction[] |
| `finance_settings` | AppSettings |
| `finance_initialized` | boolean |

### Data Model

#### Transaction
- id, type, amount, categoryId, accountId (optional), note, transactionDate, createdAt, updatedAt, deletedAt (soft delete)

#### Category
- id, name, type, color, icon, parentId (for sub-categories), createdAt, updatedAt

#### Account
- id, name, type (cash/bank/card/e-wallet/investment/savings/other), balance, color, icon, isActive, createdAt, updatedAt

#### Budget
- id, categoryId, period (weekly/monthly/yearly), amount, month, createdAt, updatedAt

#### Transfer
- id, fromAccountId, toAccountId, amount, note, transactionDate, createdAt, updatedAt

#### RecurringTransaction
- id, type (income/expense/transfer), amount, categoryId, fromAccountId, toAccountId, accountId, frequency (daily/weekly/monthly/yearly), interval, startDate, endDate, nextDate, note, label, active, createdAt, updatedAt

#### AppSettings
- theme ("light" | "dark" | "system"), currency (kode ISO), defaultCategoryId, language

#### BackupData
- metadata (schemaVersion, appVersion, exportedAt, recordCount)
- transactions, categories, accounts, budgets, transfers, recurring, settings

## 8. Export & Import

### Export
- **JSON** — backup lengkap (semua data termasuk metadata).
- **CSV** — transaksi saja (Tipe, Jumlah, Kategori, Catatan, Tanggal).
- Download via browser (`<a download>`).

### Import
- Upload file JSON via browser (`<input type="file">`).
- Validasi: cek metadata, transactions array, categories array.
- Mode: **Replace** (hapus semua data lama) atau **Merge** (tambah data baru yang belum ada).
- Gagal aman kalau file tidak valid.

## 9. UI/UX

### Mobile
- Bottom navigation (5 menu: Dashboard, Transaksi, Laporan, Budget, Lainnya).
- Form modal / bottom sheet.
- FAB tombol tambah transaksi (floating).

### Desktop
- Sidebar navigation.
- Layout dua kolom.
- Panel summary lebih padat.

### Bahasa
- Full Indonesia (label, format tanggal, mata uang).
- Lokalisasi `id-ID`.

## 10. Business Rules
- Income menambah balance akun.
- Expense mengurangi balance akun.
- Transfer: fromAccount -amount, toAccount +amount.
- Kategori wajib valid (parent boleh null).
- Nominal harus > 0.
- Soft delete transaction (deletedAt timestamp).
- Hapus transaksi revers balance akun.
- Schema version = 1 (belum ada migration logic).
- Calculator built-in untuk input nominal (numeric keypad).

## 11. Non-Functional Requirements
- Offline first (localStorage).
- Fast startup (initialize store di AppShell useEffect).
- Low dependency overhead (Next.js, React, react-icons, Tailwind, Capacitor).
- Static export friendly (`output: 'export'`).
- Dark mode dengan CSS variables + Tailwind dark variant + inline script theme flicker prevention.
- Android APK via Capacitor 8 (`npx cap sync && npx cap open android`).

## 12. Security (Browser-Only)
- Input divalidasi di UI.
- Data tersimpan di localStorage (tidak diekspos ke server).

## 13. Feature Status vs Original PRD

| PRD Feature | Status | Keterangan |
|---|---|---|
| Dashboard + Akun Quick-View | ✅ | Lengkap |
| Add/Edit/Delete Transaksi | ✅ | Plus calculator built-in + pilih akun |
| Category CRUD | ✅ | Plus sub-kategori |
| Search/Filter/Sort | ✅ | Search, type, category, date range, sort |
| Reports | ✅ | Monthly, Weekly, Yearly, Calendar |
| Settings | ✅ | Theme, Currency, Export/Import, Reset |
| Export/Import Backup | ✅ | JSON + CSV, Merge/Replace |
| Dark Mode | ✅ | Light/Dark/System |
| Multi-Account | ✅ | **Beyond original PRD** |
| Transfer Antar Akun | ✅ | **Beyond original PRD** |
| Budget Planning | ✅ | **Beyond original PRD** |
| Recurring Transactions | ✅ | **Beyond original PRD** |
| Calendar View | ✅ | **Beyond original PRD** |
| Calculator | ✅ | **Beyond original PRD** |
| Sub-Kategori | ✅ | **Beyond original PRD** |
| PWA (manifest + icon) | ✅ | manifest.json + icon.svg |
| **Capacitor Android APK** | ✅ | **Beyond original PRD (menggantikan Tauri)** |
| Schema Migration | ❌ | SCHEMA_VERSION=1 tanpa migrasi |
| Encrypted Backup | ❌ | Tidak diimplementasi |
| Error Handling UX | ⚠️ | Minimal (try-catch di store, tanpa notifikasi user) |

## 14. MVP Status
### P0 — ✅ All Complete
- Dashboard ✅
- Add/edit/delete transaksi ✅
- Category CRUD ✅
- Local storage ✅
- Export/import backup ✅
- Settings dasar ✅

### P1 — ✅ All Complete
- Reports ✅
- Search/filter ✅
- Dark mode ✅
- Currency setting ✅

### P2 — ⚠️ Partial
- Merge/replace import ✅ (implemented)
- Recurring transaction ✅ (implemented, beyond PRD)
- Multi-account + transfer ✅ (implemented, beyond PRD)
- Budget planning ✅ (implemented, beyond PRD)
- Android APK via Capacitor ✅ (implemented, beyond PRD)
- Encrypted backup ❌
- Advanced analytics ❌

## 15. Definition of Done
- ✅ App jalan full offline.
- ✅ Data tersimpan lokal (localStorage).
- ✅ User bisa export/import file backup.
- ✅ Frontend Next.js jalan dengan static export.
- ✅ Aplikasi bisa dibuild jadi APK Android via Capacitor 8.
- ✅ PWA support (manifest, standalone display).
