import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '@/lib/types';
import { formatEuro } from '@/lib/calculations';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

interface Props {
  expensesByCategory: Partial<Record<ExpenseCategoryId, number>>;
  totalExpenses: number;
}

export function ExpenseBreakdown({ expensesByCategory, totalExpenses }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);

  const entries = EXPENSE_CATEGORIES
    .filter((cat) => (expensesByCategory[cat.id] ?? 0) > 0)
    .map((cat) => ({ cat, amount: expensesByCategory[cat.id]! }))
    .sort((a, b) => b.amount - a.amount);

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dashboard.noExpensesThisMonth')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.stackedBar}>
        {entries.map(({ cat, amount }) => (
          <View
            key={cat.id}
            style={[
              styles.stackSegment,
              { flex: amount / totalExpenses, backgroundColor: cat.color },
            ]}
          />
        ))}
      </View>

      {entries.map(({ cat, amount }) => {
        const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
        return (
          <View key={cat.id} style={styles.row}>
            <SymbolView name={cat.icon} size={16} tintColor={cat.color} />
            <Text style={styles.rowLabel}>{t(`categories.${cat.id}`)}</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowPct}>{pct.toFixed(0)}%</Text>
              <Text style={[styles.rowAmount, { color: cat.color }]}>
                {formatEuro(amount)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    container: { gap: 10 },
    stackedBar: {
      height: 14,
      borderRadius: 7,
      flexDirection: 'row',
      overflow: 'hidden',
      backgroundColor: colors.border,
    },
    stackSegment: { height: '100%' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    rowLabel: { flex: 1, fontSize: 14, color: colors.text },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowPct: { fontSize: 12, color: colors.textMuted, width: 32, textAlign: 'right' },
    rowAmount: { fontSize: 14, fontWeight: '600', minWidth: 80, textAlign: 'right' },
    empty: { paddingVertical: 16, alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 14 },
  }), [colors]);
}
