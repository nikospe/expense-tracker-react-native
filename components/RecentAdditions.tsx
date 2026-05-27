import { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import {
  getRecentIncomeEntries,
  getRecentExpenseEntries,
  getRecentDistributionEntries,
  addIncome,
  addExpense,
  addProfitDistribution,
} from '@/lib/database';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '@/lib/types';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

type EntryType = 'income' | 'expense' | 'profit_distribution';

type RecentItem = {
  amount: number;
  category?: ExpenseCategoryId;
  client_name?: string;
  shareholder_name?: string;
};

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
        const entries = await getRecentIncomeEntries();
        data = entries.map((e) => ({ amount: e.amount, client_name: e.client_name }));
      } else if (entryType === 'expense') {
        const entries = await getRecentExpenseEntries();
        data = entries.map((e) => ({ amount: e.amount, category: e.category }));
      } else {
        const entries = await getRecentDistributionEntries();
        data = entries.map((e) => ({ amount: e.amount, shareholder_name: e.shareholder_name }));
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
        await addIncome(year, month, item.amount, '', item.client_name ?? '');
      } else if (entryType === 'expense' && item.category) {
        await addExpense(year, month, item.category, item.amount);
      } else if (entryType === 'profit_distribution') {
        await addProfitDistribution(year, month, item.amount, '', item.shareholder_name ?? '');
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
          const amountStr = `€${item.amount % 1 === 0 ? item.amount.toFixed(0) : item.amount.toFixed(2)}`;

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
              {/* Expense: icon + category name + amount */}
              {cat && <SymbolView name={cat.icon} size={14} tintColor={chipColor} />}
              {cat && (
                <Text style={[styles.chipCategory, { color: chipColor }]}>
                  {t(`categories.${cat.id}`)}
                </Text>
              )}

              {/* Income: client name + amount */}
              {!cat && item.client_name ? (
                <>
                  <SymbolView name="person.fill" size={13} tintColor={chipColor} />
                  <Text style={[styles.chipCategory, { color: chipColor }]}>
                    {item.client_name}
                  </Text>
                </>
              ) : null}

              {/* Distribution: shareholder name + amount */}
              {!cat && item.shareholder_name ? (
                <>
                  <SymbolView name="person.2.fill" size={13} tintColor={chipColor} />
                  <Text style={[styles.chipCategory, { color: chipColor }]}>
                    {item.shareholder_name}
                  </Text>
                </>
              ) : null}

              <Text style={[styles.chipAmount, { color: chipColor }]}>{amountStr}</Text>
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
