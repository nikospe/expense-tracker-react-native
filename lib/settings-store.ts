import 'expo-sqlite/localStorage/install';
import type { PrepaymentRate } from './types';

export type ThemePreference = 'light' | 'dark' | 'device';
export type LanguagePreference = 'en' | 'el' | 'device';

export const settingsStore = {
  getTheme: (): ThemePreference =>
    (localStorage.getItem('pref_theme') as ThemePreference) ?? 'device',
  setTheme: (v: ThemePreference): void =>
    localStorage.setItem('pref_theme', v),

  getLanguage: (): LanguagePreference =>
    (localStorage.getItem('pref_language') as LanguagePreference) ?? 'device',
  setLanguage: (v: LanguagePreference): void =>
    localStorage.setItem('pref_language', v),

  getPrepaymentEnabled: (): boolean =>
    localStorage.getItem('pref_prepayment_enabled') === 'true',
  setPrepaymentEnabled: (v: boolean): void =>
    localStorage.setItem('pref_prepayment_enabled', String(v)),

  getPrepaymentRate: (): PrepaymentRate => {
    const raw = localStorage.getItem('pref_prepayment_rate');
    return raw ? (parseFloat(raw) as PrepaymentRate) : 0.4;
  },
  setPrepaymentRate: (v: PrepaymentRate): void =>
    localStorage.setItem('pref_prepayment_rate', String(v)),

  getTaxRate: (): number => {
    const raw = localStorage.getItem('pref_tax_rate');
    return raw ? parseFloat(raw) : 22;
  },
  setTaxRate: (v: number): void =>
    localStorage.setItem('pref_tax_rate', String(v)),
};
