import type { SFSymbol } from 'expo-symbols';

export type ExpenseCategoryId =
  | 'car_fuel'
  | 'accountant'
  | 'internet'
  | 'phone'
  | 'electricity'
  | 'general'
  | 'efka'
  | 'bank'
  | 'skroutz'
  | 'plaisio'
  | 'kotsovolos'
  | 'public'
  | 'other';

export interface ExpenseCategory {
  id: ExpenseCategoryId;
  label: string;
  icon: SFSymbol;
  color: string;
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'car_fuel',    label: 'Car Fuel',          icon: 'car.fill',               color: '#f59e0b' },
  { id: 'accountant',  label: 'Accountant',         icon: 'doc.text.fill',          color: '#8b5cf6' },
  { id: 'internet',    label: 'Internet',           icon: 'wifi',                   color: '#3b82f6' },
  { id: 'phone',       label: 'Phone',              icon: 'phone.fill',             color: '#06b6d4' },
  { id: 'electricity', label: 'Electricity',        icon: 'bolt.fill',              color: '#eab308' },
  { id: 'general',     label: 'General Business',   icon: 'briefcase.fill',         color: '#64748b' },
  { id: 'efka',        label: 'EFKA',               icon: 'shield.fill',            color: '#ec4899' },
  { id: 'bank',        label: 'Bank',               icon: 'building.columns.fill',  color: '#0ea5e9' },
  { id: 'skroutz',     label: 'Skroutz',            icon: 'cart.fill',              color: '#f97316' },
  { id: 'plaisio',     label: 'Plaisio',            icon: 'laptopcomputer',         color: '#6366f1' },
  { id: 'kotsovolos',  label: 'Kotsovolos',         icon: 'tv.fill',                color: '#ef4444' },
  { id: 'public',      label: 'Public',             icon: 'book.fill',              color: '#10b981' },
  { id: 'other',       label: 'Other',              icon: 'ellipsis.circle.fill',   color: '#94a3b8' },
];

export interface Income {
  id: number;
  year: number;
  month: number;
  amount: number;
  description: string;
  created_at: string;
}

export interface Expense {
  id: number;
  year: number;
  month: number;
  category: ExpenseCategoryId;
  amount: number;
  description: string;
  created_at: string;
}

export interface ProfitDistribution {
  id: number;
  year: number;
  month: number;
  amount: number;
  description: string;
  created_at: string;
}

export interface MonthSummary {
  totalIncome: number;
  totalExpenses: number;
  grossProfit: number;
  tax: number;
  prepayment: number;
  netProfit: number;
  expensesByCategory: Partial<Record<ExpenseCategoryId, number>>;
}

export interface StandardIncome {
  id: number;
  description: string;
  amount: number;
  enabled: number;
}

export interface StandardExpense {
  id: number;
  category: ExpenseCategoryId;
  amount: number;
  description: string;
  enabled: number;
}

export const PREPAYMENT_RATES = [0, 0.4, 0.55, 0.8] as const;
export type PrepaymentRate = (typeof PREPAYMENT_RATES)[number];

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
