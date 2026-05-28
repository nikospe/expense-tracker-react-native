---
name: database
description: SQLite schema, migration pattern, and every exported database function
type: reference
---

# Database

## Setup
File: `lib/database.ts`. Database name: `kerdos.db` (opened via `expo-sqlite`).
`getDatabase()` is a singleton — returns the cached instance or opens + initialises it.

## Schema

### `incomes`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `year` | INTEGER NOT NULL | |
| `month` | INTEGER NOT NULL | 1–12 |
| `amount` | REAL NOT NULL | |
| `client_name` | TEXT NOT NULL DEFAULT '' | Who the income came from |
| `description` | TEXT NOT NULL DEFAULT '' | Optional notes |
| `created_at` | TEXT NOT NULL DEFAULT datetime('now') | |

Index: `idx_incomes_ym` on `(year, month)`.

### `expenses`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `year` | INTEGER NOT NULL | |
| `month` | INTEGER NOT NULL | |
| `category` | TEXT NOT NULL | Must be a valid `ExpenseCategoryId` |
| `amount` | REAL NOT NULL | |
| `description` | TEXT NOT NULL DEFAULT '' | For `other` category this becomes the display label |
| `created_at` | TEXT NOT NULL DEFAULT datetime('now') | |

Index: `idx_expenses_ym` on `(year, month)`.

### `profit_distributions`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `year` | INTEGER NOT NULL | |
| `month` | INTEGER NOT NULL | |
| `amount` | REAL NOT NULL | |
| `shareholder_name` | TEXT NOT NULL DEFAULT '' | Who receives the distribution |
| `description` | TEXT NOT NULL DEFAULT '' | |
| `created_at` | TEXT NOT NULL DEFAULT datetime('now') | |

Index: `idx_profit_dist_ym` on `(year, month)`.

### `standard_incomes`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `description` | TEXT NOT NULL DEFAULT '' | |
| `amount` | REAL NOT NULL | |
| `enabled` | INTEGER NOT NULL DEFAULT 1 | 0 or 1 |

### `standard_expenses`
| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | |
| `category` | TEXT NOT NULL | |
| `amount` | REAL NOT NULL | |
| `description` | TEXT NOT NULL DEFAULT '' | |
| `enabled` | INTEGER NOT NULL DEFAULT 1 | |

### `applied_standards`
| Column | Type | Notes |
|---|---|---|
| `year` | INTEGER | Composite PK |
| `month` | INTEGER | Composite PK |

Tracks which months have already had standard values auto-applied.

## Migration Pattern
New columns are added with `ALTER TABLE ... ADD COLUMN` wrapped in `try/catch` inside `initSchema()`. SQLite doesn't support `ADD COLUMN IF NOT EXISTS`, so the catch silently ignores "duplicate column" errors. This runs on every DB open and is safe.

```typescript
try {
  await database.execAsync(`ALTER TABLE incomes ADD COLUMN client_name TEXT NOT NULL DEFAULT ''`);
} catch { /* already exists */ }
```

**When adding a new column:** add the ALTER TABLE migration in `initSchema()`, update the relevant TypeScript interface in `lib/types.ts`, update all INSERT/UPDATE statements in `lib/database.ts`, and update `lib/backup.ts` (both the row interface and the restore INSERT, using `?? ''` for backwards compatibility with old backups).

## All Exported Functions

### Incomes
```typescript
addIncome(year, month, amount, description?, clientName?): Promise<number>
getIncomes(year, month): Promise<Income[]>
updateIncome(id, amount, clientName, description): Promise<void>
deleteIncome(id): Promise<void>
getRecentIncomeEntries(limit?): Promise<{ amount: number; client_name: string }[]>
```
`getRecentIncomeEntries` returns the `limit` (default 5) most recently used unique `(amount, client_name)` pairs, ordered by recency.

### Expenses
```typescript
addExpense(year, month, category, amount, description?): Promise<number>
getExpenses(year, month): Promise<Expense[]>
updateExpense(id, amount, category, description): Promise<void>
deleteExpense(id): Promise<void>
getRecentExpenseEntries(limit?): Promise<{ amount: number; category: ExpenseCategoryId }[]>
```

### Profit Distributions
```typescript
addProfitDistribution(year, month, amount, description?, shareholderName?): Promise<number>
getProfitDistributions(year, month): Promise<ProfitDistribution[]>
updateProfitDistribution(id, amount, shareholderName, description): Promise<void>
deleteProfitDistribution(id): Promise<void>
getRecentDistributionEntries(limit?): Promise<{ amount: number; shareholder_name: string }[]>
```

### Standard Values
```typescript
getStandardIncomes(): Promise<StandardIncome[]>
addStandardIncome(description, amount): Promise<number>
toggleStandardIncome(id, enabled): Promise<void>
deleteStandardIncome(id): Promise<void>

getStandardExpenses(): Promise<StandardExpense[]>
addStandardExpense(category, amount, description?): Promise<number>
toggleStandardExpense(id, enabled): Promise<void>
deleteStandardExpense(id): Promise<void>

applyStandardsToMonth(year, month): Promise<void>       // skips if already applied
forceApplyStandardsToMonth(year, month): Promise<void>  // always applies
```

### Aggregate / History
```typescript
getAvailableYears(): Promise<number[]>
getRecentMonths(count?): Promise<MonthRecord[]>
getYearMonths(year): Promise<MonthRecord[]>
```

`MonthRecord` = `{ year, month, totalIncome, totalExpenses, totalProfitDistributions }`.
