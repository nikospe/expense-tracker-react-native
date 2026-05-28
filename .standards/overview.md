---
name: overview
description: App identity, purpose, audience, and current feature list
type: reference
---

# Kerdos — App Overview

## Identity
- **App name:** Kerdos (Κέρδος — Greek for "profit")
- **Platform:** iOS & Android (React Native / Expo)
- **Audience:** Greek freelancers and small service-based companies
- **Privacy model:** 100% local — no accounts, no servers, no cloud sync

## Purpose
Kerdos simplifies monthly bookkeeping by tracking income, expenses, and profit distributions in one place. It calculates net profit, income tax, and the Greek tax prepayment (Προκαταβολή Φόρου) in real-time.

## Current Feature Set

### Dashboard (Home)
- Month-by-month navigation with swipe gesture
- Summary cards: Total Income, Total Expenses, Gross Profit, Tax, Tax Prepayment (optional), Net Profit
- Expense breakdown by category (visual)
- Entry lists for incomes, expenses, and profit distributions
- Delete any entry (with confirmation alert)
- **Edit any entry via long-press (600ms) → bottom-sheet modal**
- Auto-fill empty months with standard values
- Show/hide all amounts toggle (privacy mode)

### Add Entry Screen
- Three entry types: Income, Expense, Profit Distribution
- Month/year picker (cannot go beyond current month)
- **Income fields:** Client Name + Amount + Description
- **Expense fields:** Category (grid) + Amount + Description
- **Distribution fields:** Shareholder Name + Amount + Description
- **Recent Additions panel:** shows last 5 unique entries per type — tap to instantly re-add to current month

### Explore Screen
- Annual summary with all tax calculations
- Monthly breakdown table
- Recalculate button

### Settings Screen
- Theme: Light / Dark / Device
- Language: English / Ελληνικά / Device
- Tax rate (configurable, default 22%)
- Tax prepayment (enable/disable + rate: 0%, 40%, 55%, 80%)
- Standard monthly income (auto-added each new month)
- Standard monthly expenses (auto-added each new month)
- Export backup (JSON file via share sheet)
- Import/restore backup
- Delete all data (danger zone)

## Accent Colors Per Entry Type
- Income: `#22c55e` (green)
- Expense: `#ef4444` (red)
- Profit Distribution: `#a855f7` (purple)
