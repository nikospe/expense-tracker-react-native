---
name: components
description: Every component in /components — props, purpose, and usage notes
type: reference
---

# Components

## `EditEntryModal`
**File:** `components/EditEntryModal.tsx`
**Purpose:** Bottom-sheet modal for editing an existing income, expense, or distribution entry. Triggered by long-pressing an entry row on the dashboard.

```typescript
export type EditTarget =
  | { type: 'income'; entry: Income }
  | { type: 'expense'; entry: Expense }
  | { type: 'profit_distribution'; entry: ProfitDistribution };

interface Props {
  target: EditTarget | null;  // null = hidden
  onClose: () => void;
  onSaved: () => void;        // called after successful DB update
}
```

Fields shown per type:
- **Income:** Client Name → Amount → Description
- **Expense:** Category grid → Amount → Description
- **Distribution:** Shareholder Name → Amount → Description

Pre-fills from the entry when `target` changes. Uses `updateIncome / updateExpense / updateProfitDistribution` from `lib/database.ts`.

---

## `EntryList` — `IncomeList`, `ExpenseList`, `ProfitDistributionList`
**File:** `components/EntryList.tsx`
**Purpose:** Renders a list of entries with delete (tap trash icon) and edit (long press row, 600ms) actions.

```typescript
// IncomeList
interface IncomeListProps {
  incomes: Income[];
  onDelete: () => void;      // called after delete to trigger parent refresh
  onEdit: (entry: Income) => void;
}

// ExpenseList
interface ExpenseListProps {
  expenses: Expense[];
  onDelete: () => void;
  onEdit: (entry: Expense) => void;
}

// ProfitDistributionList
interface ProfitDistributionListProps {
  distributions: ProfitDistribution[];
  onDelete: () => void;
  onEdit: (entry: ProfitDistribution) => void;
}
```

**Display logic:**
- Income row: primary label = `client_name || description || t('common.income')`, sublabel = description (if both client_name and description are set)
- Distribution row: primary label = `shareholder_name || description || t('common.profitDist')`, sublabel = description (if both set)
- Expense row: primary label = description (or category name if no description), sublabel = category name

**Long press:** 600ms, triggers `Haptics.impactAsync(Medium)` + calls `onEdit`. Row dims to 60% opacity while pressed.

---

## `RecentAdditions`
**File:** `components/RecentAdditions.tsx`
**Purpose:** Shows the last 5 unique entries per type as tappable chips on the Add Entry screen. Tapping a chip immediately saves it to the current month (same alert flow as manual save).

```typescript
interface Props {
  entryType: 'income' | 'expense' | 'profit_distribution';
  accentColor: string;
  refreshKey: number;    // increment to force re-fetch
  year: number;
  month: number;
  onSaved: () => void;  // called after chip tap save
}
```

Deduplication logic:
- Income: unique by `(amount, client_name)`
- Expense: unique by `(amount, category)`
- Distribution: unique by `(amount, shareholder_name)`

Chip display:
- Income: `[person icon] clientName  €amount` (icon+name omitted if client_name is empty)
- Expense: `[category icon] category name  €amount`
- Distribution: `[person.2 icon] shareholderName  €amount` (icon+name omitted if empty)

Returns `null` if no data — renders nothing.

---

## `SummaryCard`
**File:** `components/SummaryCard.tsx`
**Purpose:** Individual KPI card on the dashboard (income, expenses, profit, tax, net profit).

```typescript
interface Props {
  label: string;
  amount: number;
  color: string;
  icon: SFSymbol;
  subtitle?: string;
}
```

---

## `ExpenseBreakdown`
**File:** `components/ExpenseBreakdown.tsx`
**Purpose:** Visual breakdown of expenses by category for the current month.

```typescript
interface Props {
  expensesByCategory: Partial<Record<ExpenseCategoryId, number>>;
  totalExpenses: number;
}
```

---

## `MonthNavigator`
**File:** `components/MonthNavigator.tsx`
**Purpose:** Left/right arrow navigation between months with the current month/year displayed.

```typescript
interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}
```

---

## `MonthBarChart`
**File:** `components/MonthBarChart.tsx`
**Purpose:** Bar chart showing income/expense history across recent months.

---

## `StandardIncomeSection` / `StandardExpenseSection`
**Files:** `components/StandardIncomeSection.tsx`, `components/StandardExpenseSection.tsx`
**Purpose:** UI for managing standard monthly values in the Settings screen. Allow adding, toggling, and deleting standard entries.

---

## `useMonthData` Hook
**File:** `hooks/use-month-data.ts`
**Purpose:** Fetches incomes, expenses, distributions, and calculates the month summary. Auto-applies standard values for the current month.

```typescript
function useMonthData(year, month, prepaymentRate?, taxRate?): {
  incomes: Income[];
  expenses: Expense[];
  profitDistributions: ProfitDistribution[];
  summary: MonthSummary;
  loading: boolean;
  refresh: () => void;
}
```
