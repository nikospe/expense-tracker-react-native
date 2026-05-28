---
name: features
description: Complete feature documentation — how each screen and flow works, what data it reads/writes
type: reference
---

# Features

## Dashboard (Home — `app/(tabs)/index.tsx`)

### Month Navigation
- Defaults to the current month/year on load
- `useFocusEffect` triggers a refresh every time the tab is focused
- Left/right arrows and swipe gesture (via `react-native-gesture-handler`) navigate months
- Cannot go before `MIN_YEAR = 2020` or after the current month

### Summary Cards
`useMonthData` hook provides the `MonthSummary`. Cards rendered in a 2-column grid:
1. Total Income
2. Total Expenses
3. Gross Profit (income − expenses)
4. Income Tax (grossProfit × taxRate, only when grossProfit > 0)
5. Tax Prepayment (tax × prepaymentRate, only when enabled and > 0)
6. Net Profit (grossProfit − tax − prepayment)

### Entry Lists
Three separate card sections: Income Entries, Expense Entries, Profit Distributions.
Each row:
- **Tap trash icon** → confirmation alert → delete → refresh
- **Long press (600ms)** → haptic feedback → `EditEntryModal` opens pre-filled

### Edit Modal (`EditEntryModal`)
- Bottom-sheet modal with `animationType="slide"`
- Fields vary by entry type (see components.md)
- Saves via `updateIncome / updateExpense / updateProfitDistribution`
- On save: success alert → close modal → refresh dashboard

### Empty Month Prompt
When a past month has no data and the user lands on it:
- If standard values exist → show "Fill with Standard Values" button → calls `forceApplyStandardsToMonth`
- If no standards configured → show "Go to Settings" link

### Privacy Toggle (Show/Hide Amounts)
`amountsVisible` from `AppSettingsContext`. When `false`, all monetary values render as `••••`. Toggle lives in the dashboard header area.

---

## Add Entry Screen (`app/(tabs)/add.tsx`)

### Entry Type Toggle
Segmented control at top: Income / Expenses / Distribution. Switching type resets the relevant fields but preserves month/year.

### Month Picker
Left/right arrows. Cannot go beyond current month/year.

### Fields by Type

**Income:**
1. Client Name (text, optional) — who paid
2. Amount (numeric) — required
3. Description (text, optional) — notes

**Expense:**
1. Category grid — required (default: `general`)
2. Amount (numeric) — required
3. If category is `other`: shows "Expense Name" field (replaces description, becomes the display label)
4. If any other category: shows Description field (optional)

**Distribution:**
1. Shareholder Name (text, optional) — who receives it
2. Amount (numeric) — required
3. Description (text, optional) — notes

### Save Flow
1. Validate amount > 0
2. Insert into DB via `addIncome / addExpense / addProfitDistribution`
3. Clear amount + description + client/shareholder name
4. Increment `refreshKey` (triggers Recent Additions to re-fetch)
5. Show success alert

### Recent Additions (`RecentAdditions` component)
Appears below the save button. Shows last 5 unique entries for the current type.
Tapping a chip → saves immediately to the currently selected month → same success alert as manual save → refreshes the chip list.

---

## Explore Screen (`app/(tabs)/explore.tsx`)
- Yearly aggregate summary for the selected year
- Tax calculations using current settings (tax rate + prepayment)
- Monthly breakdown table
- "Recalculate" button to force data reload

---

## Settings Screen (`app/(tabs)/settings.tsx`)

### Appearance
- Theme: Light / Dark / Device (changes immediately via `Appearance.setColorScheme`)
- Language: English / Ελληνικά / Device Language (changes `i18n.changeLanguage` immediately)

### Tax Configuration
- Tax rate % (editable number input, default 22%)
- Tax prepayment toggle + rate selector (0%, 40%, 55%, 80%)
All changes update `AppSettingsContext` and persist via `settingsStore`.

### Standard Monthly Values
- Standard incomes: list with toggle/delete, "Add Income" button
- Standard expenses: list with toggle/delete, "Add Expense" button
Auto-applied to each new month the first time `useMonthData` runs for it.

### Data Backup
- **Export:** serialises all tables + settings to JSON → shares via native share sheet
- **Import:** pick JSON file → confirm overwrite alert → restore all data + settings

Backup format version: `1`. App identifier: `kerdos`. New columns use `?? ''` fallback when restoring old backups.

### Danger Zone
"Delete All Data" → double confirmation → `deleteAllData()` clears all 6 tables.

---

## Tax Calculation Logic (`lib/calculations.ts`)

```
grossProfit = totalIncome - totalExpenses
tax = grossProfit > 0 ? grossProfit × taxRate : 0
prepayment = tax × effectivePrepaymentRate   (0 when disabled)
netProfit = grossProfit - tax - prepayment
```

`taxRate` is stored as a percentage (e.g., `22`), divided by 100 when passed to `calculateSummary`.
`effectivePrepaymentRate` is already a decimal (e.g., `0.4`).

---

## Expense Categories (`lib/types.ts`)

| ID | Label | Icon | Color |
|---|---|---|---|
| `car_fuel` | Car Fuel | `car.fill` | `#f59e0b` |
| `accountant` | Accountant | `doc.text.fill` | `#8b5cf6` |
| `internet` | Internet | `wifi` | `#3b82f6` |
| `phone` | Phone | `phone.fill` | `#06b6d4` |
| `electricity` | Electricity | `bolt.fill` | `#eab308` |
| `general` | General Business | `briefcase.fill` | `#64748b` |
| `efka` | EFKA | `shield.fill` | `#ec4899` |
| `bank` | Bank | `building.columns.fill` | `#0ea5e9` |
| `skroutz` | Skroutz | `cart.fill` | `#f97316` |
| `plaisio` | Plaisio | `laptopcomputer` | `#6366f1` |
| `kotsovolos` | Kotsovolos | `tv.fill` | `#ef4444` |
| `public` | Public | `book.fill` | `#10b981` |
| `openai` | OpenAI | `sparkles` | `#10a37f` |
| `claude_code` | Claude Code | `terminal.fill` | `#cc785c` |
| `claude_api` | Claude API | `antenna.radiowaves.left.and.right` | `#bf6650` |
| `openai_api` | OpenAI API | `cpu` | `#0d9f7e` |
| `apple_dev` | Apple Developer | `swift` | `#5856d6` |
| `other` | Other | `ellipsis.circle.fill` | `#94a3b8` |

`other` is special: the `description` field becomes the display label in the entry list.
