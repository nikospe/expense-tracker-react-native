import type { Income, Expense, StandardIncome, StandardExpense, ProfitDistribution } from './types';
import type { MonthRecord } from './database';

export async function getDatabase(): Promise<never> {
  throw new Error('SQLite is not supported on web.');
}

export async function addIncome(): Promise<number> { return 0; }
export async function getIncomes(): Promise<Income[]> { return []; }
export async function deleteIncome(): Promise<void> {}

export async function addExpense(): Promise<number> { return 0; }
export async function getExpenses(): Promise<Expense[]> { return []; }
export async function deleteExpense(): Promise<void> {}

export async function getRecentMonths(): Promise<MonthRecord[]> { return []; }
export async function getYearMonths(): Promise<MonthRecord[]> { return []; }
export async function getAvailableYears(): Promise<number[]> { return []; }

export async function getStandardIncomes(): Promise<StandardIncome[]> { return []; }
export async function addStandardIncome(): Promise<number> { return 0; }
export async function toggleStandardIncome(): Promise<void> {}
export async function deleteStandardIncome(): Promise<void> {}

export async function getStandardExpenses(): Promise<StandardExpense[]> { return []; }
export async function addStandardExpense(): Promise<number> { return 0; }
export async function toggleStandardExpense(): Promise<void> {}
export async function deleteStandardExpense(): Promise<void> {}

export async function applyStandardsToMonth(): Promise<void> {}
export async function forceApplyStandardsToMonth(): Promise<void> {}

export async function addProfitDistribution(): Promise<number> { return 0; }
export async function getProfitDistributions(): Promise<ProfitDistribution[]> { return []; }
export async function deleteProfitDistribution(): Promise<void> {}

export type { MonthRecord };
