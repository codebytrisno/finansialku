# FinansialKu

A fully offline personal finance tracking app. Built with Next.js and Tauri.

## Features

- **Multi-Account Management** — Cash, Bank, Card, E-Wallet, Investment, Savings, and more
- **Income & Expense Tracking** — Categorize transactions with sub-categories
- **Budget Planning** — Set weekly/monthly/yearly budgets with progress tracking
- **Recurring Transactions** — Daily, weekly, monthly, yearly with interval support
- **Transfer Between Accounts** — Auto-updates balances
- **Reports** — Monthly, Weekly, Yearly summaries + Calendar view
- **Export/Import** — JSON backup or CSV export with merge/replace modes
- **Dark Mode** — Light, Dark, or System theme
- **Multi-Currency** — IDR, USD, EUR, MYR, SGD, JPY, KRW
- **Built-in Calculator** — In transaction forms
- **Offline-First** — All data stored in `localStorage`, no server required

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (static export) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Icons | react-icons (Lucide) |
| Charts | Custom SVG |
| Desktop | Tauri 2 |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

```bash
npm run build
```

Static output is in the `out/` directory.

## Desktop Build (Tauri)

```bash
npm run tauri dev     # development
npm run tauri build   # production build
```
