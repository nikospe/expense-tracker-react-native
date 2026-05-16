import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { settingsStore, type ThemePreference, type LanguagePreference } from '@/lib/settings-store';
import { LightColors, DarkColors, type AppColors } from '@/lib/theme-colors';
import { type PrepaymentRate } from '@/lib/types';
import i18n, { getDeviceLanguage } from '@/lib/i18n';

interface AppSettingsContextValue {
  // Theme
  themePreference: ThemePreference;
  setThemePreference: (v: ThemePreference) => void;
  navTheme: Theme;
  colors: AppColors;
  isDark: boolean;

  // Language
  languagePreference: LanguagePreference;
  setLanguagePreference: (v: LanguagePreference) => void;

  // Prepayment
  prepaymentEnabled: boolean;
  setPrepaymentEnabled: (v: boolean) => void;
  prepaymentRate: PrepaymentRate;
  setPrepaymentRate: (v: PrepaymentRate) => void;
  effectivePrepaymentRate: number; // 0 when disabled

  // Tax Rate
  taxRate: number;
  setTaxRate: (v: number) => void;

  // Privacy
  amountsVisible: boolean;
  toggleAmountsVisible: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();

  const [themePreference, setThemeState] = useState<ThemePreference>(
    () => settingsStore.getTheme(),
  );
  const [languagePreference, setLanguageState] = useState<LanguagePreference>(
    () => settingsStore.getLanguage(),
  );
  const [prepaymentEnabled, setPrepaymentState] = useState<boolean>(
    () => settingsStore.getPrepaymentEnabled(),
  );
  const [prepaymentRate, setPrepaymentRateState] = useState<PrepaymentRate>(
    () => settingsStore.getPrepaymentRate(),
  );
  const [taxRate, setTaxRateState] = useState<number>(() => settingsStore.getTaxRate());
  const [amountsVisible, setAmountsVisible] = useState(true);
  const toggleAmountsVisible = useCallback(() => setAmountsVisible((v) => !v), []);

  const isDark = useMemo(() => {
    if (themePreference === 'dark') return true;
    if (themePreference === 'light') return false;
    return deviceScheme === 'dark';
  }, [themePreference, deviceScheme]);

  const colors = isDark ? DarkColors : LightColors;
  const navTheme = isDark ? DarkTheme : DefaultTheme;

  const setThemePreference = useCallback((v: ThemePreference) => {
    settingsStore.setTheme(v);
    setThemeState(v);
  }, []);

  const setLanguagePreference = useCallback((v: LanguagePreference) => {
    settingsStore.setLanguage(v);
    setLanguageState(v);
    i18n.changeLanguage(v === 'device' ? getDeviceLanguage() : v);
  }, []);

  const setPrepaymentEnabled = useCallback((v: boolean) => {
    settingsStore.setPrepaymentEnabled(v);
    setPrepaymentState(v);
  }, []);

  const setPrepaymentRate = useCallback((v: PrepaymentRate) => {
    settingsStore.setPrepaymentRate(v);
    setPrepaymentRateState(v);
  }, []);

  const setTaxRate = useCallback((v: number) => {
    settingsStore.setTaxRate(v);
    setTaxRateState(v);
  }, []);

  const effectivePrepaymentRate = prepaymentEnabled ? prepaymentRate : 0;

  useEffect(() => {
    const lang = languagePreference === 'device' ? getDeviceLanguage() : languagePreference;
    i18n.changeLanguage(lang);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      themePreference, setThemePreference,
      navTheme, colors, isDark,
      languagePreference, setLanguagePreference,
      prepaymentEnabled, setPrepaymentEnabled,
      prepaymentRate, setPrepaymentRate,
      effectivePrepaymentRate,
      taxRate, setTaxRate,
      amountsVisible, toggleAmountsVisible,
    }),
    [
      themePreference, setThemePreference,
      navTheme, colors, isDark,
      languagePreference, setLanguagePreference,
      prepaymentEnabled, setPrepaymentEnabled,
      prepaymentRate, setPrepaymentRate,
      effectivePrepaymentRate,
      taxRate, setTaxRate,
      amountsVisible, toggleAmountsVisible,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within AppSettingsProvider');
  return ctx;
}

export function useAppColors(): AppColors {
  return useAppSettings().colors;
}
