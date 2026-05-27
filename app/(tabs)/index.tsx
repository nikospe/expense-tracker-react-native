import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter, useFocusEffect } from 'expo-router';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { SymbolView } from 'expo-symbols';
import { SummaryCard } from '@/components/SummaryCard';
import { MonthNavigator } from '@/components/MonthNavigator';
import { ExpenseBreakdown } from '@/components/ExpenseBreakdown';
import { IncomeList, ExpenseList, ProfitDistributionList } from '@/components/EntryList';
import { EditEntryModal, type EditTarget } from '@/components/EditEntryModal';
import { useMonthData } from '@/hooks/use-month-data';
import { getStandardIncomes, getStandardExpenses, forceApplyStandardsToMonth } from '@/lib/database';
import { formatEuro } from '@/lib/calculations';
import type { SFSymbol } from 'expo-symbols';
import { useAppColors, useAppSettings } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

const MIN_YEAR = 2020;
const MIN_MONTH = 1;

function prevMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}
function nextMonth(year: number, month: number) {
  return month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
}

export default function DashboardScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);
  const { effectivePrepaymentRate, prepaymentEnabled, prepaymentRate, taxRate } = useAppSettings();
  const router = useRouter();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // null = not checked, true/false = result
  const [hasEnabledStandards, setHasEnabledStandards] = useState<boolean | null>(null);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const handlePrev = useCallback(() => {
    if (year === MIN_YEAR && month === MIN_MONTH) return;
    const p = prevMonth(year, month);
    setYear(p.year);
    setMonth(p.month);
  }, [year, month]);

  const handleNext = useCallback(() => {
    if (isCurrentMonth) return;
    const n = nextMonth(year, month);
    setYear(n.year);
    setMonth(n.month);
  }, [year, month, isCurrentMonth]);

  // Horizontal swipe to change month (left = next, right = prev)
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-40, 40])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      if (e.translationX < -60) {
        runOnJS(handleNext)();
      } else if (e.translationX > 60) {
        runOnJS(handlePrev)();
      }
    });

  const { incomes, expenses, profitDistributions, summary, loading, refresh } = useMonthData(
    year, month, effectivePrepaymentRate, taxRate / 100,
  );

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const isEmpty = !loading && incomes.length === 0 && expenses.length === 0 && profitDistributions.length === 0;

  type CardItem = {
    key: string;
    label: string;
    amount: number;
    color: string;
    icon: SFSymbol;
    subtitle?: string;
  };

  const summaryRows = useMemo<CardItem[][]>(() => {
    const items: CardItem[] = [
      {
        key: 'income',
        label: t('dashboard.totalIncome'),
        amount: summary.totalIncome,
        color: '#22c55e',
        icon: 'chart.line.uptrend.xyaxis' as SFSymbol,
      },
      {
        key: 'expenses',
        label: t('dashboard.totalExpenses'),
        amount: summary.totalExpenses,
        color: '#ef4444',
        icon: 'chart.line.downtrend.xyaxis' as SFSymbol,
      },
      {
        key: 'gross',
        label: t('dashboard.grossProfit'),
        amount: summary.grossProfit,
        color: summary.grossProfit >= 0 ? '#f59e0b' : '#ef4444',
        icon: 'chart.bar.fill' as SFSymbol,
        subtitle: t('dashboard.beforeTax'),
      },
      {
        key: 'tax',
        label: t('dashboard.tax', { rate: taxRate.toFixed(0) }),
        amount: summary.tax,
        color: '#f59e0b',
        icon: 'percent' as SFSymbol,
        subtitle: summary.grossProfit > 0
          ? t('dashboard.onGrossProfit', { amount: formatEuro(summary.grossProfit) })
          : t('dashboard.noTaxableProfit'),
      },
    ];

    if (prepaymentEnabled && summary.prepayment > 0) {
      items.push({
        key: 'prepayment',
        label: t('dashboard.prepayment', { rate: (prepaymentRate * 100).toFixed(0) }),
        amount: summary.prepayment,
        color: '#a855f7',
        icon: 'chart.pie' as SFSymbol,
        subtitle: formatEuro(summary.tax) + ' × ' + (prepaymentRate * 100).toFixed(0) + '%',
      });
    }

    items.push({
      key: 'net',
      label: t('dashboard.netProfit'),
      amount: summary.netProfit,
      color: summary.netProfit >= 0 ? '#3b82f6' : '#ef4444',
      icon: 'wallet.pass' as SFSymbol,
      subtitle: t('dashboard.afterTaxAndExpenses'),
    });

    const rows: CardItem[][] = [];
    for (let i = 0; i < items.length; i += 2) {
      rows.push(items.slice(i, i + 2));
    }
    return rows;
  }, [summary, prepaymentEnabled, prepaymentRate, taxRate, t]);

  // When landing on an empty past month, check if standards are configured
  useEffect(() => {
    if (!isCurrentMonth && isEmpty) {
      Promise.all([getStandardIncomes(), getStandardExpenses()]).then(([si, se]) => {
        setHasEnabledStandards([...si, ...se].some((item) => item.enabled === 1));
      });
    } else {
      setHasEnabledStandards(null);
    }
  }, [isCurrentMonth, isEmpty]);

  const handleFillWithDefaults = useCallback(async () => {
    await forceApplyStandardsToMonth(year, month);
    refresh();
  }, [year, month, refresh]);

  return (
    <GestureDetector gesture={swipeGesture}>
      <>
      <EditEntryModal
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => { setEditTarget(null); refresh(); }}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <MonthNavigator
          year={year} month={month}
          onPrev={handlePrev}
          onNext={handleNext}
        />

        {loading ? (
          <ActivityIndicator style={styles.loader} color="#22c55e" />
        ) : (
          <>
            <View style={styles.grid}>
              {summaryRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.gridRow}>
                  {row.map((card) => (
                    <SummaryCard
                      key={card.key}
                      label={card.label}
                      amount={card.amount}
                      color={card.color}
                      icon={card.icon}
                      subtitle={card.subtitle}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* Empty past month prompt */}
            {!isCurrentMonth && isEmpty && hasEnabledStandards !== null && (
              <EmptyMonthCard
                hasStandards={hasEnabledStandards}
                onFill={handleFillWithDefaults}
                onGoToSettings={() => router.navigate('/(tabs)/settings')}
                colors={colors}
              />
            )}

            {summary.totalExpenses > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{t('dashboard.expensesByCategory')}</Text>
                <ExpenseBreakdown
                  expensesByCategory={summary.expensesByCategory}
                  totalExpenses={summary.totalExpenses}
                />
              </View>
            )}

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dashboard.incomeEntries')}</Text>
              <IncomeList
                incomes={incomes}
                onDelete={refresh}
                onEdit={(entry) => setEditTarget({ type: 'income', entry })}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dashboard.expenseEntries')}</Text>
              <ExpenseList
                expenses={expenses}
                onDelete={refresh}
                onEdit={(entry) => setEditTarget({ type: 'expense', entry })}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t('dashboard.profitDistributions')}</Text>
              <ProfitDistributionList
                distributions={profitDistributions}
                onDelete={refresh}
                onEdit={(entry) => setEditTarget({ type: 'profit_distribution', entry })}
              />
            </View>
          </>
        )}
      </ScrollView>
      </>
    </GestureDetector>
  );
}

// ─── Empty month prompt ──────────────────────────────────────────────────────

function EmptyMonthCard({
  hasStandards, onFill, onGoToSettings, colors,
}: {
  hasStandards: boolean;
  onFill: () => void;
  onGoToSettings: () => void;
  colors: AppColors;
}) {
  const { t } = useTranslation();
  const styles = useStyles(colors);
  return (
    <View style={[styles.card, styles.emptyMonthCard]}>
      <SymbolView name="calendar.badge.plus" size={28} tintColor={colors.textMuted} />
      <Text style={styles.emptyMonthTitle}>{t('dashboard.emptyMonthTitle')}</Text>
      {hasStandards ? (
        <Pressable style={styles.fillBtn} onPress={onFill}>
          <SymbolView name="wand.and.stars" size={16} tintColor="#fff" />
          <Text style={styles.fillBtnText}>{t('dashboard.fillWithDefaults')}</Text>
        </Pressable>
      ) : (
        <>
          <Text style={styles.emptyMonthHint}>{t('dashboard.noDefaultsHint')}</Text>
          <Pressable style={styles.settingsBtn} onPress={onGoToSettings}>
            <SymbolView name="gearshape.fill" size={14} tintColor={colors.accent} />
            <Text style={styles.settingsBtnText}>{t('dashboard.goToSettings')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, paddingBottom: 32 },
    loader: { marginTop: 48 },
    grid: { gap: 10, marginBottom: 16 },
    gridRow: { flexDirection: 'row', gap: 10 },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 14,
    },
    emptyMonthCard: {
      alignItems: 'center',
      gap: 10,
      paddingVertical: 24,
    },
    emptyMonthTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    emptyMonthHint: {
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    fillBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: '#3b82f6',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 4,
    },
    fillBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    settingsBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.accent,
      marginTop: 4,
    },
    settingsBtnText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.accent,
    },
  }), [colors]);
}
