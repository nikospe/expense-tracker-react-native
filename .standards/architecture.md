---
name: architecture
description: Tech stack, folder structure, navigation, state management, and key dependencies
type: reference
---

# Architecture

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native via Expo SDK |
| Router | expo-router (file-based, v3) |
| Database | expo-sqlite (SQLite, on-device only) |
| Settings persistence | `expo-sqlite/localStorage` (localStorage shim) |
| Localization | i18next + react-i18next |
| State | React Context (`AppSettingsContext`) |
| Gestures | react-native-gesture-handler |
| Animations | react-native-reanimated |
| Icons | expo-symbols (SF Symbols — iOS native) |
| Haptics | expo-haptics |
| Tab bar | `expo-router/unstable-native-tabs` (`NativeTabs`) |
| Backup I/O | expo-file-system + expo-sharing + expo-document-picker |

## Folder Structure

```
/
├── app/
│   ├── _layout.tsx           Root layout — wraps everything in AppSettingsProvider + GestureHandlerRootView
│   ├── modal.tsx             Unused modal route (Expo default)
│   └── (tabs)/
│       ├── _layout.tsx       NativeTabs config with SF Symbol icons + i18n labels
│       ├── index.tsx         Dashboard screen (home tab)
│       ├── add.tsx           Add entry screen
│       ├── explore.tsx       Annual summary / explore screen
│       └── settings.tsx      App settings screen
│
├── components/
│   ├── EditEntryModal.tsx    Long-press edit modal (income/expense/distribution)
│   ├── EntryList.tsx         IncomeList, ExpenseList, ProfitDistributionList + shared EntryRow
│   ├── ExpenseBreakdown.tsx  Category breakdown visual
│   ├── MonthBarChart.tsx     Bar chart for history
│   ├── MonthNavigator.tsx    Month/year nav arrows
│   ├── RecentAdditions.tsx   Recent-entries chips on add screen
│   ├── StandardExpenseSection.tsx  Standard expenses UI (settings)
│   ├── StandardIncomeSection.tsx   Standard incomes UI (settings)
│   ├── SummaryCard.tsx       Individual KPI card on dashboard
│   └── ui/                  Expo-generated stubs (collapsible, icon-symbol, etc.)
│
├── contexts/
│   └── AppSettingsContext.tsx  Theme, language, tax rates, privacy (amountsVisible)
│
├── hooks/
│   ├── use-month-data.ts     Fetches incomes/expenses/distributions + summary for a month
│   └── use-color-scheme.ts   Color scheme with SSR safety
│
├── lib/
│   ├── backup.ts             JSON export/import for full data backup
│   ├── calculations.ts       calculateSummary(), formatEuro(), formatEuroCompact()
│   ├── database.ts           All SQLite operations (see database.md)
│   ├── database.web.ts       No-op web stub for database
│   ├── i18n.ts               All translations — EN + EL (see localization.md)
│   ├── settings-store.ts     localStorage wrapper for user preferences
│   ├── theme-colors.ts       LightColors + DarkColors palettes
│   └── types.ts              Shared TypeScript types + EXPENSE_CATEGORIES constant
│
├── assets/                  Images, fonts
├── .standards/              Project documentation for AI agents ← YOU ARE HERE
├── CLAUDE.md                Auto-loaded by Claude Code — points here
└── .AGENTS.md               Comprehensive agent task guide
```

## State Management

### AppSettingsContext (`contexts/AppSettingsContext.tsx`)
Single global context that holds all user preferences. Read with `useAppSettings()` or `useAppColors()`.

| Value | Type | Description |
|---|---|---|
| `themePreference` | `'light' \| 'dark' \| 'device'` | User's theme choice |
| `isDark` | `boolean` | Computed current dark mode state |
| `colors` | `AppColors` | Current color palette object |
| `navTheme` | `Theme` | React Navigation theme |
| `languagePreference` | `'en' \| 'el' \| 'device'` | User's language choice |
| `prepaymentEnabled` | `boolean` | Whether tax prepayment is calculated |
| `prepaymentRate` | `0 \| 0.4 \| 0.55 \| 0.8` | Tax prepayment rate |
| `effectivePrepaymentRate` | `number` | 0 when disabled, otherwise prepaymentRate |
| `taxRate` | `number` | Income tax % (default 22) |
| `amountsVisible` | `boolean` | Privacy toggle — hides all money values |
| `toggleAmountsVisible` | `() => void` | Flip amountsVisible |

### Settings Persistence
Preferences are stored via `settingsStore` in `lib/settings-store.ts`, which uses `expo-sqlite/localStorage` (a localStorage shim backed by SQLite). Keys: `pref_theme`, `pref_language`, `pref_prepayment_enabled`, `pref_prepayment_rate`, `pref_tax_rate`.

## Navigation
`expo-router` file-based routing. All tabs live under `app/(tabs)/`. The tab bar uses `NativeTabs` (native iOS UITabBarController equivalent). No stack navigation is currently used inside tabs.
