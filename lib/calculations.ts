import { EXPENSE_CATEGORIES, type ExpenseCategoryId, type Income, type Expense, type MonthSummary } from './types';

export const TAX_RATE = 0.22; // default fallback
export const MASKED = '••••';

export function calculateSummary(
  incomes: Income[],
  expenses: Expense[],
  prepaymentRate: number = 0,
  taxRate: number = TAX_RATE,
): MonthSummary {
  const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const grossProfit = totalIncome - totalExpenses;
  const tax = grossProfit > 0 ? grossProfit * taxRate : 0;
  const prepayment = tax * prepaymentRate;
  const netProfit = grossProfit - tax - prepayment;

  const expensesByCategory: Partial<Record<ExpenseCategoryId, number>> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    const total = expenses
      .filter((e) => e.category === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);
    if (total > 0) {
      expensesByCategory[cat.id] = total;
    }
  }

  return { totalIncome, totalExpenses, grossProfit, tax, prepayment, netProfit, expensesByCategory };
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('el-GR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatEuroCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (abs >= 1000) {
    return `${sign}€${(abs / 1000).toFixed(1)}k`;
  }
  return formatEuro(amount);
}
