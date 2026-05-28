# Kerdos — Business Expense & Tax Tracker

A privacy-first financial management app for Greek freelancers and small service-based companies. Tracks income, expenses, and profit distributions; calculates net profit, income tax, and tax prepayment (Προκαταβολή Φόρου) in real-time.

**All data stays on device — no accounts, no cloud.**

## Tech Stack
- React Native (Expo) — iOS & Android
- SQLite (local persistence via expo-sqlite)
- i18next — English + Greek localization
- expo-router — file-based navigation

## Features
- Monthly dashboard with income/expense/distribution tracking
- 18 expense categories (including OpenAI, Claude Code, Apple Developer)
- Income entries with client name; distributions with shareholder name
- Long-press any entry to edit it
- Recent Additions — tap to instantly re-add a past entry
- Configurable income tax rate + Greek tax prepayment (Προκαταβολή)
- Standard monthly values auto-applied each new month
- Full JSON backup & restore
- Dark / Light / Device theme
- Show/hide amounts privacy toggle

## For AI Agents & Contributors
See `.AGENTS.md` at the project root for the complete task guide and `.standards/` for detailed technical documentation.

## Run Locally
```bash
npm install
npx expo run:ios   # or run:android
```
