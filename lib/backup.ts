import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getDatabase } from './database';
import { settingsStore } from './settings-store';
import type { ThemePreference, LanguagePreference } from './settings-store';
import type { PrepaymentRate } from './types';

interface IncomeRow       { id: number; year: number; month: number; amount: number; description: string; created_at: string; }
interface ExpenseRow      { id: number; year: number; month: number; category: string; amount: number; description: string; created_at: string; }
interface ProfitDistRow   { id: number; year: number; month: number; amount: number; description: string; created_at: string; }
interface StdIncRow       { id: number; description: string; amount: number; enabled: number; }
interface StdExpRow       { id: number; category: string; amount: number; description: string; enabled: number; }
interface AppliedRow      { year: number; month: number; }

interface SettingsSnapshot {
  theme: ThemePreference;
  language: LanguagePreference;
  prepaymentEnabled: boolean;
  prepaymentRate: PrepaymentRate;
  taxRate: number;
}

interface BackupData {
  version: 1;
  app: 'kerdos';
  exportedAt: string;
  settings: SettingsSnapshot;
  incomes: IncomeRow[];
  expenses: ExpenseRow[];
  profit_distributions: ProfitDistRow[];
  standard_incomes: StdIncRow[];
  standard_expenses: StdExpRow[];
  applied_standards: AppliedRow[];
}

export type RestoredSettings = SettingsSnapshot;

export async function exportBackup(): Promise<void> {
  const db = await getDatabase();

  const [incomes, expenses, profitDist, standardIncomes, standardExpenses, appliedStandards] =
    await Promise.all([
      db.getAllAsync<IncomeRow>('SELECT * FROM incomes ORDER BY id'),
      db.getAllAsync<ExpenseRow>('SELECT * FROM expenses ORDER BY id'),
      db.getAllAsync<ProfitDistRow>('SELECT * FROM profit_distributions ORDER BY id'),
      db.getAllAsync<StdIncRow>('SELECT * FROM standard_incomes ORDER BY id'),
      db.getAllAsync<StdExpRow>('SELECT * FROM standard_expenses ORDER BY id'),
      db.getAllAsync<AppliedRow>('SELECT * FROM applied_standards'),
    ]);

  const data: BackupData = {
    version: 1,
    app: 'kerdos',
    exportedAt: new Date().toISOString(),
    settings: {
      theme: settingsStore.getTheme(),
      language: settingsStore.getLanguage(),
      prepaymentEnabled: settingsStore.getPrepaymentEnabled(),
      prepaymentRate: settingsStore.getPrepaymentRate(),
      taxRate: settingsStore.getTaxRate(),
    },
    incomes,
    expenses,
    profit_distributions: profitDist,
    standard_incomes: standardIncomes,
    standard_expenses: standardExpenses,
    applied_standards: appliedStandards,
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `kerdos-backup-${dateStr}.json`;
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(data, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Kerdos Backup',
      UTI: 'public.json',
    });
  }
}

export async function importBackup(): Promise<'cancelled' | { settings: RestoredSettings }> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
  });

  if (result.canceled) return 'cancelled';

  const fileUri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(fileUri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let data: BackupData;
  try {
    data = JSON.parse(content) as BackupData;
  } catch {
    throw new Error('invalid_json');
  }

  if (data.app !== 'kerdos' || data.version !== 1) {
    throw new Error('invalid_backup');
  }

  const db = await getDatabase();

  // Delete each table individually to avoid multi-statement issues
  await db.runAsync('DELETE FROM profit_distributions');
  await db.runAsync('DELETE FROM incomes');
  await db.runAsync('DELETE FROM expenses');
  await db.runAsync('DELETE FROM standard_incomes');
  await db.runAsync('DELETE FROM standard_expenses');
  await db.runAsync('DELETE FROM applied_standards');

  for (const r of data.incomes) {
    await db.runAsync(
      'INSERT INTO incomes (id, year, month, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [r.id, r.year, r.month, r.amount, r.description, r.created_at],
    );
  }
  for (const r of data.expenses) {
    await db.runAsync(
      'INSERT INTO expenses (id, year, month, category, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [r.id, r.year, r.month, r.category, r.amount, r.description, r.created_at],
    );
  }
  for (const r of (data.profit_distributions ?? [])) {
    await db.runAsync(
      'INSERT INTO profit_distributions (id, year, month, amount, description, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [r.id, r.year, r.month, r.amount, r.description, r.created_at],
    );
  }
  for (const r of data.standard_incomes) {
    await db.runAsync(
      'INSERT INTO standard_incomes (id, description, amount, enabled) VALUES (?, ?, ?, ?)',
      [r.id, r.description, r.amount, r.enabled],
    );
  }
  for (const r of data.standard_expenses) {
    await db.runAsync(
      'INSERT INTO standard_expenses (id, category, amount, description, enabled) VALUES (?, ?, ?, ?, ?)',
      [r.id, r.category, r.amount, r.description, r.enabled],
    );
  }
  for (const r of data.applied_standards) {
    await db.runAsync(
      'INSERT OR IGNORE INTO applied_standards (year, month) VALUES (?, ?)',
      [r.year, r.month],
    );
  }

  const s = data.settings;
  if (s) {
    settingsStore.setTheme(s.theme);
    settingsStore.setLanguage(s.language);
    settingsStore.setPrepaymentEnabled(s.prepaymentEnabled);
    settingsStore.setPrepaymentRate(s.prepaymentRate);
    settingsStore.setTaxRate(s.taxRate ?? 22);
  }

  return {
    settings: s ?? {
      theme: 'device',
      language: 'device',
      prepaymentEnabled: false,
      prepaymentRate: 0.4,
      taxRate: 22,
    },
  };
}
