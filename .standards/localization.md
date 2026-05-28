---
name: localization
description: i18n setup, supported languages, all translation key sections, and how to add new keys
type: reference
---

# Localization

## Setup (`lib/i18n.ts`)
- Library: `i18next` + `react-i18next`
- Languages: `en` (English), `el` (Greek / Ελληνικά)
- Fallback: `en`
- Device language detection: `expo-localization` → `getDeviceLanguage()` returns `'en' | 'el'`
- Language is changed at runtime via `i18n.changeLanguage(lang)` when the user updates their preference in Settings

## Using Translations in a Component
```typescript
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();

t('add.amount')                          // → "Amount (€)"
t('dashboard.tax', { rate: '22' })       // → "Tax (22%)"
t('add.savedMsg', { type: 'Income' })    // → "Income entry added successfully."
```

## Adding New Translation Keys
1. Add the key in the `en` object inside `lib/i18n.ts`
2. Add the **exact same key** in the `el` object with the Greek translation
3. The TypeScript type `typeof en` is applied to `el`, so the compiler will catch missing keys

## Translation Key Sections

### `tabs`
Tab bar labels: `dashboard`, `addEntry`, `history`, `explore`, `settings`

### `months` / `shortMonths`
Numeric keys 1–12 for month names and abbreviations.
Usage: `t('months.5')` → "May" / "Μάιος"

### `categories`
One key per `ExpenseCategoryId`. Used everywhere categories are displayed.
Current keys: `car_fuel`, `accountant`, `internet`, `phone`, `electricity`, `general`, `efka`, `bank`, `skroutz`, `plaisio`, `kotsovolos`, `public`, `openai`, `claude_code`, `claude_api`, `openai_api`, `apple_dev`, `other`

### `common`
Shared strings used across multiple screens:
`income`, `expenses`, `delete`, `cancel`, `deleteTitle`, `deleteMsg`, `errorTitle`, `errorMsg`, `done`, `profitDist`

### `dashboard`
All strings for the home screen: summary card labels, entry section titles, empty state messages, "Fill with Standard Values" flow.

### `add`
Add entry screen: field labels, placeholders, button labels, validation alerts, success alerts, recent additions label.

Key fields:
- `clientNameLabel` / `clientNamePlaceholder` — income client name field
- `shareholderLabel` / `shareholderPlaceholder` — distribution shareholder field
- `recentAdditions` — "Recent Additions" section header
- `savedTitle` / `savedMsg` — success alert after adding

### `edit`
Edit entry modal: `incomeTitle`, `expenseTitle`, `distributionTitle`, `saveChanges`, `savedTitle`, `savedMsg`

### `history`
History/summary screen strings.

### `explore`
Explore/annual summary screen strings including tax calculation labels.

### `settings`
All settings screen strings: appearance, language, tax configuration, backup, standard values, danger zone.

## Greek Translation Notes
- Brand names stay in English: `OpenAI`, `Claude Code`, `Claude API`, `OpenAI API`, `Apple Developer`, `Skroutz`, `Plaisio`, `Kotsovolos`, `Public`, `EFKA`
- Financial/legal terms: `Προκαταβολή Φόρου` (tax prepayment), `ΕΦΚΑ` (EFKA), `Μικτό Κέρδος` (gross profit), `Καθαρό Κέρδος` (net profit)
