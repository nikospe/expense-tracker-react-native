import { useState, useEffect, useCallback } from 'react';
import { getIncomes, getExpenses, getProfitDistributions, applyStandardsToMonth } from '@/lib/database';
import { calculateSummary } from '@/lib/calculations';
import type { Income, Expense, ProfitDistribution, MonthSummary } from '@/lib/types';

interface MonthData {
  incomes: Income[];
  expenses: Expense[];
  profitDistributions: ProfitDistribution[];
  summary: MonthSummary;
  loading: boolean;
  refresh: () => void;
}

const EMPTY_SUMMARY: MonthSummary = {
  totalIncome: 0,
  totalExpenses: 0,
  grossProfit: 0,
  tax: 0,
  prepayment: 0,
  netProfit: 0,
  expensesByCategory: {},
};

export function useMonthData(
  year: number,
  month: number,
  prepaymentRate: number = 0,
  taxRate: number = 0.22,
): MonthData {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [profitDistributions, setProfitDistributions] = useState<ProfitDistribution[]>([]);
  const [summary, setSummary] = useState<MonthSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      if (year === now.getFullYear() && month === now.getMonth() + 1) {
        await applyStandardsToMonth(year, month);
      }
      const [inc, exp, dist] = await Promise.all([
        getIncomes(year, month),
        getExpenses(year, month),
        getProfitDistributions(year, month),
      ]);
      setIncomes(inc);
      setExpenses(exp);
      setProfitDistributions(dist);
      setSummary(calculateSummary(inc, exp, prepaymentRate, taxRate));
    } finally {
      setLoading(false);
    }
  }, [year, month, prepaymentRate, taxRate]);

  useEffect(() => {
    load();
  }, [load]);

  return { incomes, expenses, profitDistributions, summary, loading, refresh: load };
}
