import * as SQLite from 'expo-sqlite';
import type { ExpenseCategoryId, Income, Expense, StandardIncome, StandardExpense, ProfitDistribution } from './types';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('kerdos.db');
  await initSchema(db);
  return db;
}

async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS incomes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      year        INTEGER NOT NULL,
      month       INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      year        INTEGER NOT NULL,
      month       INTEGER NOT NULL,
      category    TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_incomes_ym  ON incomes  (year, month);
    CREATE INDEX IF NOT EXISTS idx_expenses_ym ON expenses (year, month);

    CREATE TABLE IF NOT EXISTS standard_incomes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT    NOT NULL DEFAULT '',
      amount      REAL    NOT NULL,
      enabled     INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS standard_expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      enabled     INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS applied_standards (
      year  INTEGER NOT NULL,
      month INTEGER NOT NULL,
      PRIMARY KEY (year, month)
    );

    CREATE TABLE IF NOT EXISTS profit_distributions (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      year        INTEGER NOT NULL,
      month       INTEGER NOT NULL,
      amount      REAL    NOT NULL,
      description TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_profit_dist_ym ON profit_distributions (year, month);
  `);

  // Additive migrations — safe to run on every open
  try {
    await database.execAsync(`ALTER TABLE incomes ADD COLUMN client_name TEXT NOT NULL DEFAULT ''`);
  } catch { /* column already exists */ }
  try {
    await database.execAsync(`ALTER TABLE profit_distributions ADD COLUMN shareholder_name TEXT NOT NULL DEFAULT ''`);
  } catch { /* column already exists */ }
}

// ─── Incomes ────────────────────────────────────────────────────────────────

export async function addIncome(
  year: number,
  month: number,
  amount: number,
  description: string = '',
  clientName: string = '',
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO incomes (year, month, amount, description, client_name) VALUES (?, ?, ?, ?, ?)',
    [year, month, amount, description, clientName],
  );
  return result.lastInsertRowId;
}

export async function getIncomes(year: number, month: number): Promise<Income[]> {
  const database = await getDatabase();
  return database.getAllAsync<Income>(
    'SELECT * FROM incomes WHERE year = ? AND month = ? ORDER BY created_at DESC',
    [year, month],
  );
}

export async function deleteIncome(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM incomes WHERE id = ?', [id]);
}

// ─── Expenses ───────────────────────────────────────────────────────────────

export async function addExpense(
  year: number,
  month: number,
  category: ExpenseCategoryId,
  amount: number,
  description: string = '',
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO expenses (year, month, category, amount, description) VALUES (?, ?, ?, ?, ?)',
    [year, month, category, amount, description],
  );
  return result.lastInsertRowId;
}

export async function getExpenses(year: number, month: number): Promise<Expense[]> {
  const database = await getDatabase();
  return database.getAllAsync<Expense>(
    'SELECT * FROM expenses WHERE year = ? AND month = ? ORDER BY created_at DESC',
    [year, month],
  );
}

export async function deleteExpense(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM expenses WHERE id = ?', [id]);
}

// ─── Profit Distributions ───────────────────────────────────────────────────

export async function addProfitDistribution(
  year: number,
  month: number,
  amount: number,
  description: string = '',
  shareholderName: string = '',
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO profit_distributions (year, month, amount, description, shareholder_name) VALUES (?, ?, ?, ?, ?)',
    [year, month, amount, description, shareholderName],
  );
  return result.lastInsertRowId;
}

export async function getProfitDistributions(year: number, month: number): Promise<ProfitDistribution[]> {
  const database = await getDatabase();
  return database.getAllAsync<ProfitDistribution>(
    'SELECT * FROM profit_distributions WHERE year = ? AND month = ? ORDER BY created_at DESC',
    [year, month],
  );
}

export async function deleteProfitDistribution(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM profit_distributions WHERE id = ?', [id]);
}

// ─── Available Years ─────────────────────────────────────────────────────────

export async function getAvailableYears(): Promise<number[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<{ year: number }>(
    `SELECT DISTINCT year FROM incomes
     UNION SELECT DISTINCT year FROM expenses
     UNION SELECT DISTINCT year FROM profit_distributions
     ORDER BY year`,
  );
  return rows.map((r) => r.year);
}

// ─── History ────────────────────────────────────────────────────────────────

export interface MonthRecord {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  totalProfitDistributions: number;
}

export async function getRecentMonths(count: number = 6): Promise<MonthRecord[]> {
  const database = await getDatabase();

  const incomeRows = await database.getAllAsync<{ year: number; month: number; total: number }>(
    `SELECT year, month, SUM(amount) as total FROM incomes GROUP BY year, month`,
  );
  const expenseRows = await database.getAllAsync<{ year: number; month: number; total: number }>(
    `SELECT year, month, SUM(amount) as total FROM expenses GROUP BY year, month`,
  );

  // Merge by year+month
  const map = new Map<string, MonthRecord>();

  for (const row of incomeRows) {
    const key = `${row.year}-${row.month}`;
    const existing = map.get(key) ?? { year: row.year, month: row.month, totalIncome: 0, totalExpenses: 0, totalProfitDistributions: 0 };
    existing.totalIncome = row.total;
    map.set(key, existing);
  }

  for (const row of expenseRows) {
    const key = `${row.year}-${row.month}`;
    const existing = map.get(key) ?? { year: row.year, month: row.month, totalIncome: 0, totalExpenses: 0, totalProfitDistributions: 0 };
    existing.totalExpenses = row.total;
    map.set(key, existing);
  }

  const profitDistRows = await database.getAllAsync<{ year: number; month: number; total: number }>(
    `SELECT year, month, SUM(amount) as total FROM profit_distributions GROUP BY year, month`,
  );
  for (const row of profitDistRows) {
    const key = `${row.year}-${row.month}`;
    const existing = map.get(key) ?? { year: row.year, month: row.month, totalIncome: 0, totalExpenses: 0, totalProfitDistributions: 0 };
    existing.totalProfitDistributions = row.total;
    map.set(key, existing);
  }

  return Array.from(map.values())
    .sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month)
    .slice(0, count)
    .reverse();
}

// ─── Standard Incomes ───────────────────────────────────────────────────────

export async function getStandardIncomes(): Promise<StandardIncome[]> {
  const database = await getDatabase();
  return database.getAllAsync<StandardIncome>('SELECT * FROM standard_incomes ORDER BY id');
}

export async function addStandardIncome(description: string, amount: number): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO standard_incomes (description, amount) VALUES (?, ?)',
    [description, amount],
  );
  return result.lastInsertRowId;
}

export async function toggleStandardIncome(id: number, enabled: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE standard_incomes SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
}

export async function deleteStandardIncome(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM standard_incomes WHERE id = ?', [id]);
}

// ─── Standard Expenses ──────────────────────────────────────────────────────

export async function getStandardExpenses(): Promise<StandardExpense[]> {
  const database = await getDatabase();
  return database.getAllAsync<StandardExpense>('SELECT * FROM standard_expenses ORDER BY id');
}

export async function addStandardExpense(
  category: ExpenseCategoryId,
  amount: number,
  description: string = '',
): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    'INSERT INTO standard_expenses (category, amount, description) VALUES (?, ?, ?)',
    [category, amount, description],
  );
  return result.lastInsertRowId;
}

export async function toggleStandardExpense(id: number, enabled: boolean): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('UPDATE standard_expenses SET enabled = ? WHERE id = ?', [enabled ? 1 : 0, id]);
}

export async function deleteStandardExpense(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync('DELETE FROM standard_expenses WHERE id = ?', [id]);
}

// ─── Auto-apply ─────────────────────────────────────────────────────────────

export async function forceApplyStandardsToMonth(year: number, month: number): Promise<void> {
  const database = await getDatabase();

  const incomes = await database.getAllAsync<StandardIncome>(
    'SELECT * FROM standard_incomes WHERE enabled = 1',
  );
  const expenses = await database.getAllAsync<StandardExpense>(
    'SELECT * FROM standard_expenses WHERE enabled = 1',
  );

  for (const inc of incomes) {
    await database.runAsync(
      'INSERT INTO incomes (year, month, amount, description) VALUES (?, ?, ?, ?)',
      [year, month, inc.amount, inc.description],
    );
  }
  for (const exp of expenses) {
    await database.runAsync(
      'INSERT INTO expenses (year, month, category, amount, description) VALUES (?, ?, ?, ?, ?)',
      [year, month, exp.category, exp.amount, exp.description],
    );
  }

  await database.runAsync(
    'INSERT OR REPLACE INTO applied_standards (year, month) VALUES (?, ?)',
    [year, month],
  );
}

export async function applyStandardsToMonth(year: number, month: number): Promise<void> {
  const database = await getDatabase();

  // Skip if already applied this month
  const already = await database.getFirstAsync<{ year: number }>(
    'SELECT year FROM applied_standards WHERE year = ? AND month = ?',
    [year, month],
  );
  if (already) return;

  const incomes = await database.getAllAsync<StandardIncome>(
    'SELECT * FROM standard_incomes WHERE enabled = 1',
  );
  const expenses = await database.getAllAsync<StandardExpense>(
    'SELECT * FROM standard_expenses WHERE enabled = 1',
  );

  // Nothing to apply — don't mark as applied so future standards can still run
  if (incomes.length === 0 && expenses.length === 0) return;

  for (const inc of incomes) {
    await database.runAsync(
      'INSERT INTO incomes (year, month, amount, description) VALUES (?, ?, ?, ?)',
      [year, month, inc.amount, inc.description],
    );
  }
  for (const exp of expenses) {
    await database.runAsync(
      'INSERT INTO expenses (year, month, category, amount, description) VALUES (?, ?, ?, ?, ?)',
      [year, month, exp.category, exp.amount, exp.description],
    );
  }

  await database.runAsync(
    'INSERT OR IGNORE INTO applied_standards (year, month) VALUES (?, ?)',
    [year, month],
  );
}

// ─── Recent Unique Amounts ───────────────────────────────────────────────────

export interface RecentIncomeEntry {
  amount: number;
  client_name: string;
}

export async function getRecentIncomeEntries(limit = 5): Promise<RecentIncomeEntry[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecentIncomeEntry>(
    `WITH ranked AS (
       SELECT amount, client_name, MAX(created_at) AS last_added
       FROM incomes
       GROUP BY amount, client_name
     )
     SELECT amount, client_name FROM ranked ORDER BY last_added DESC LIMIT ?`,
    [limit],
  );
}

export interface RecentExpenseEntry {
  amount: number;
  category: ExpenseCategoryId;
}

export async function getRecentExpenseEntries(limit = 5): Promise<RecentExpenseEntry[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecentExpenseEntry>(
    `WITH ranked AS (
       SELECT amount, category, MAX(created_at) AS last_added
       FROM expenses
       GROUP BY amount, category
     )
     SELECT amount, category FROM ranked ORDER BY last_added DESC LIMIT ?`,
    [limit],
  );
}

export interface RecentDistributionEntry {
  amount: number;
  shareholder_name: string;
}

export async function getRecentDistributionEntries(limit = 5): Promise<RecentDistributionEntry[]> {
  const database = await getDatabase();
  return database.getAllAsync<RecentDistributionEntry>(
    `WITH ranked AS (
       SELECT amount, shareholder_name, MAX(created_at) AS last_added
       FROM profit_distributions
       GROUP BY amount, shareholder_name
     )
     SELECT amount, shareholder_name FROM ranked ORDER BY last_added DESC LIMIT ?`,
    [limit],
  );
}

export async function deleteAllData(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    DELETE FROM incomes;
    DELETE FROM expenses;
    DELETE FROM profit_distributions;
    DELETE FROM standard_incomes;
    DELETE FROM standard_expenses;
    DELETE FROM applied_standards;
  `);
}

export async function getYearMonths(year: number): Promise<MonthRecord[]> {
  const database = await getDatabase();

  const incomeRows = await database.getAllAsync<{ month: number; total: number }>(
    'SELECT month, SUM(amount) as total FROM incomes WHERE year = ? GROUP BY month',
    [year],
  );
  const expenseRows = await database.getAllAsync<{ month: number; total: number }>(
    'SELECT month, SUM(amount) as total FROM expenses WHERE year = ? GROUP BY month',
    [year],
  );
  const profitDistRows = await database.getAllAsync<{ month: number; total: number }>(
    'SELECT month, SUM(amount) as total FROM profit_distributions WHERE year = ? GROUP BY month',
    [year],
  );

  const map = new Map<number, MonthRecord>();

  for (const row of incomeRows) {
    map.set(row.month, { year, month: row.month, totalIncome: row.total, totalExpenses: 0, totalProfitDistributions: 0 });
  }
  for (const row of expenseRows) {
    const existing = map.get(row.month) ?? { year, month: row.month, totalIncome: 0, totalExpenses: 0, totalProfitDistributions: 0 };
    existing.totalExpenses = row.total;
    map.set(row.month, existing);
  }
  for (const row of profitDistRows) {
    const existing = map.get(row.month) ?? { year, month: row.month, totalIncome: 0, totalExpenses: 0, totalProfitDistributions: 0 };
    existing.totalProfitDistributions = row.total;
    map.set(row.month, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.month - b.month);
}
