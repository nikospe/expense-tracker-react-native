import { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import {
  getRecentIncomeAmounts,
  getRecentExpenseEntries,
  getRecentDistributionAmounts,
  addIncome,
  addExpense,
  addProfitDistribution,
  type RecentExpenseEntry,
} from '@/lib/database';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '@/lib/types';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

type EntryType = 'income' | 'expense' | 'profit_distribution';

type RecentItem =
  | { amount: number; category: undefined }
  | { amount: number; category: ExpenseCategoryId };

interface Props {
  entryType: EntryType;
  accentColor: string;
  refreshKey: number;
  year: number;
  month: number;
  onSaved: () => void;
}

export function RecentAdditions({ entryType, accentColor, refreshKey, year, month, onSaved }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);
  const [items, setItems] = useState<RecentItem[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      let data: RecentItem[];
      if (entryType === 'income') {
        const amounts = await getRecentIncomeAmounts();
        data = amounts.map((amount) => ({ amount, category: undefined }));
      } else if (entryType === 'expense') {
        const entries = await getRecentExpenseEntries();
        data = entries.map((e) => ({ amount: e.amount, category: e.category }));
      } else {
        const amounts = await getRecentDistributionAmounts();
        data = amounts.map((amount) => ({ amount, category: undefined }));
      }
      if (!cancelled) setItems(data);
    };
    load();
    return () => { cancelled = true; };
  }, [entryType, refreshKey]);

  if (items.length === 0) return null;

  const handleTap = async (item: RecentItem, idx: number) => {
    if (savingIdx !== null) return;
    setSavingIdx(idx);
    try {
      if (entryType === 'income') {
        await addIncome(year, month, item.amount);
      } else if (entryType === 'expense' && item.category) {
        await addExpense(year, month, item.category, item.amount);
      } else if (entryType === 'profit_distribution') {
        await addProfitDistribution(year, month, item.amount);
      }
      const typeLabel = entryType === 'income'
        ? t('common.income')
        : entryType === 'profit_distribution'
        ? t('common.profitDist')
        : t('common.expenses');
      Alert.alert(t('add.savedTitle'), t('add.savedMsg', { type: typeLabel }));
      onSaved();
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorMsg'));
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{t('add.recentAdditions')}</Text>
      <View style={styles.grid}>
        {items.map((item, i) => {
          const cat = item.category
            ? EXPENSE_CATEGORIES.find((c) => c.id === item.category) ?? null
            : null;
          const chipColor = cat ? cat.color : accentColor;
          const isSaving = savingIdx === i;

          return (
            <Pressable
              key={i}
              style={[
                styles.chip,
                { backgroundColor: chipColor + '18', borderColor: chipColor + '50' },
                isSaving && styles.chipSaving,
              ]}
              onPress={() => handleTap(item, i)}
              disabled={savingIdx !== null}
            >
              {cat && (
                <SymbolView name={cat.icon} size={14} tintColor={chipColor} />
              )}
              {cat && (
                <Text style={[styles.chipCategory, { color: chipColor }]}>
                  {t(`categories.${cat.id}`)}
                </Text>
              )}
              <Text style={[styles.chipAmount, { color: chipColor }]}>
                €{item.amount % 1 === 0 ? item.amount.toFixed(0) : item.amount.toFixed(2)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    label: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1.5,
    },
    chipSaving: {
      opacity: 0.5,
    },
    chipCategory: {
      fontSize: 13,
      fontWeight: '500',
    },
    chipAmount: {
      fontSize: 13,
      fontWeight: '700',
    },
  }), [colors]);
}
