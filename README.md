# FinansialKu

A fully offline personal finance tracking app. Built with Next.js + Capacitor.

## Download APK

[![Download APK v1.1.0](https://img.shields.io/badge/Download-APK%20v1.1.0-brightgreen?style=for-the-badge&logo=android)](https://github.com/codebytrisno/finansialku/releases/download/v1.1.0/FinansialKu-v1.1.0.apk)

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
- **Toast Notifications** — Success/error feedback on all actions
- **Skeleton Loading** — Smooth loading placeholders across all pages
- **Responsive Design** — Optimized for mobile with touch-friendly targets
- **Negative Balance Indicators** — Red coloring when balance goes negative
- **Account Transactions** — Click any account card to view its transactions
- **Offline-First** — All data stored in `localStorage`, no server required

## Tech Stack

| Component | Technology |
|---|---|
| Framework | Next.js 16 (static export) |
| UI | React 19, Tailwind CSS v4 |
| Language | TypeScript |
| Icons | Material Symbols |
| Charts | Custom SVG |
| Mobile | Capacitor 8 |

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

## Android Build (Capacitor)

```bash
npm run build
npx cap sync
npx cap open android   # open in Android Studio
npx cap run android    # run on device
```

> Already have the APK? Download the latest release [here](https://github.com/codebytrisno/finansialku/releases/download/v1.1.0/FinansialKu-v1.1.0.apk).
