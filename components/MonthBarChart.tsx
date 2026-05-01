import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { TAX_RATE } from '@/lib/calculations';
import type { MonthRecord } from '@/lib/database';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

interface Props {
  months: MonthRecord[];
}

const CHART_HEIGHT = 140;

export function MonthBarChart({ months }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);

  if (months.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('history.noData')}</Text>
      </View>
    );
  }

  const allValues = months.flatMap((m) => {
    const gross = m.totalIncome - m.totalExpenses;
    const net = gross > 0 ? gross * (1 - TAX_RATE) : gross;
    return [m.totalIncome, m.totalExpenses, net];
  });
  const maxValue = Math.max(...allValues.map(Math.abs), 1);

  return (
    <View style={styles.container}>
      <View style={styles.legend}>
        <LegendDot color="#22c55e" label={t('common.income')} />
        <LegendDot color="#ef4444" label={t('common.expenses')} />
        <LegendDot color="#3b82f6" label={t('dashboard.netProfit')} />
      </View>

      <View style={styles.chart}>
        {months.map((m) => {
          const gross = m.totalIncome - m.totalExpenses;
          const net = gross > 0 ? gross * (1 - TAX_RATE) : gross;
          return (
            <MonthColumn
              key={`${m.year}-${m.month}`}
              label={t(`shortMonths.${m.month}`)}
              income={m.totalIncome}
              expenses={m.totalExpenses}
              netProfit={net}
              maxValue={maxValue}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

function MonthColumn({
  label, income, expenses, netProfit, maxValue, colors,
}: {
  label: string; income: number; expenses: number;
  netProfit: number; maxValue: number; colors: AppColors;
}) {
  const styles = useStyles(colors);
  const toHeight = (v: number) => Math.max(2, (Math.abs(v) / maxValue) * CHART_HEIGHT);
  return (
    <View style={styles.column}>
      <View style={[styles.bars, { height: CHART_HEIGHT }]}>
        <Bar height={toHeight(income)} color="#22c55e" />
        <Bar height={toHeight(expenses)} color="#ef4444" />
        <Bar height={toHeight(netProfit)} color={netProfit >= 0 ? '#3b82f6' : '#f59e0b'} />
      </View>
      <Text style={styles.columnLabel}>{label}</Text>
    </View>
  );
}

function Bar({ height, color }: { height: number; color: string }) {
  return (
    <View style={{ width: 8, justifyContent: 'flex-end' }}>
      <View style={{ width: 8, height, borderRadius: 4, backgroundColor: color }} />
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
      <Text style={{ fontSize: 12, color: '#6b7280' }}>{label}</Text>
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    container: { gap: 12 },
    legend: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
    chart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
    column: { alignItems: 'center', gap: 6, flex: 1 },
    bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, justifyContent: 'center' },
    columnLabel: { fontSize: 11, color: colors.textSecondary },
    empty: { paddingVertical: 32, alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center' },
  }), [colors]);
}
