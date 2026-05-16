import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { getAvailableYears, getYearMonths, type MonthRecord } from '@/lib/database';
import { formatEuro, MASKED } from '@/lib/calculations';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

export default function ExploreScreen() {
  const { t } = useTranslation();
  const { colors, effectivePrepaymentRate, prepaymentEnabled, taxRate, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState<MonthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const taxRateFraction = taxRate / 100;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const years = await getAvailableYears();
      const effectiveYear = years.length > 0
        ? (years.includes(selectedYear) ? selectedYear : years[years.length - 1])
        : selectedYear;
      const [data] = await Promise.all([getYearMonths(effectiveYear)]);
      setAvailableYears(years);
      setSelectedYear(effectiveYear);
      setYearData(data);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => { loadData(); }, [loadData]);

  const yearIndex = availableYears.indexOf(selectedYear);
  const canGoPrev = yearIndex > 0;
  const canGoNext = yearIndex < availableYears.length - 1;

  const goPrev = () => { if (canGoPrev) setSelectedYear(availableYears[yearIndex - 1]); };
  const goNext = () => { if (canGoNext) setSelectedYear(availableYears[yearIndex + 1]); };

  // Annual calculations
  const totalIncome = yearData.reduce((s, m) => s + m.totalIncome, 0);
  const totalExpenses = yearData.reduce((s, m) => s + m.totalExpenses, 0);
  const totalProfitDist = yearData.reduce((s, m) => s + m.totalProfitDistributions, 0);
  const grossProfit = totalIncome - totalExpenses;
  const annualTax = grossProfit > 0 ? grossProfit * taxRateFraction : 0;
  const annualPrepayment = annualTax * effectivePrepaymentRate;
  const taxObligation = annualTax + annualPrepayment;
  const netWithoutDist = grossProfit - taxObligation;
  const netWithDist = netWithoutDist - totalProfitDist;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t('explore.title')}</Text>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#22c55e" />
      ) : availableYears.length === 0 ? (
        <View style={styles.emptyState}>
          <SymbolView name="calendar.badge.exclamationmark" size={40} tintColor={colors.textMuted} />
          <Text style={styles.emptyText}>{t('explore.noData')}</Text>
        </View>
      ) : (
        <>
          {/* ── Annual Summary ── */}
          <View style={styles.card}>
            <YearNav
              year={selectedYear}
              canPrev={canGoPrev}
              canNext={canGoNext}
              onPrev={goPrev}
              onNext={goNext}
              title={t('explore.annualSummary')}
              colors={colors}
            />
            <View style={styles.summaryGrid}>
              <SummaryRow label={t('explore.totalIncome')} value={totalIncome} color="#22c55e" colors={colors} amountsVisible={amountsVisible} />
              <SummaryRow label={t('explore.totalExpenses')} value={totalExpenses} color="#ef4444" colors={colors} amountsVisible={amountsVisible} />
              <View style={styles.divider} />
              <SummaryRow label={t('explore.grossProfit')} value={grossProfit} color="#f59e0b" colors={colors} amountsVisible={amountsVisible} />
              <SummaryRow label={t('explore.incomeTax', { rate: taxRate.toFixed(0) })} value={annualTax} color="#f59e0b" colors={colors} amountsVisible={amountsVisible} />
              {prepaymentEnabled && annualPrepayment > 0 && (
                <SummaryRow label={t('explore.taxPrepayment')} value={annualPrepayment} color="#a855f7" colors={colors} amountsVisible={amountsVisible} />
              )}
              <SummaryRow label={t('explore.taxObligation')} value={taxObligation} color="#ef4444" colors={colors} bold amountsVisible={amountsVisible} />
              <View style={styles.divider} />
              {totalProfitDist > 0 && (
                <SummaryRow label={t('explore.profitDist')} value={totalProfitDist} color="#a855f7" colors={colors} amountsVisible={amountsVisible} />
              )}
              <SummaryRow label={t('explore.netWithoutDist')} value={netWithoutDist} color={netWithoutDist >= 0 ? '#22c55e' : '#ef4444'} colors={colors} bold highlight amountsVisible={amountsVisible} />
              {totalProfitDist > 0 && (
                <SummaryRow label={t('explore.netWithDist')} value={netWithDist} color={netWithDist >= 0 ? '#3b82f6' : '#ef4444'} colors={colors} bold highlight amountsVisible={amountsVisible} />
              )}
            </View>
          </View>

          {/* ── Monthly Table ── */}
          <View style={styles.card}>
            <YearNav
              year={selectedYear}
              canPrev={canGoPrev}
              canNext={canGoNext}
              onPrev={goPrev}
              onNext={goNext}
              title={t('explore.monthlyTable')}
              colors={colors}
            />
            {yearData.length === 0 ? (
              <Text style={styles.noMonthData}>{t('explore.noData')}</Text>
            ) : (
              <>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colMonth, styles.headerCell]}>{t('add.month')}</Text>
                  <Text style={[styles.colNum, styles.headerCell]}>{t('common.income')}</Text>
                  <Text style={[styles.colNum, styles.headerCell]}>{t('common.expenses')}</Text>
                  <Text style={[styles.colNum, styles.headerCell]}>{t('history.net')}</Text>
                </View>
                {yearData.map((m) => {
                  const gross = m.totalIncome - m.totalExpenses;
                  const tax = gross > 0 ? gross * taxRateFraction : 0;
                  const net = gross - tax - (tax * effectivePrepaymentRate);
                  return (
                    <View key={m.month} style={styles.tableRow}>
                      <Text style={styles.colMonth}>{t(`shortMonths.${m.month}`)}</Text>
                      <Text style={[styles.colNum, { color: '#22c55e' }]}>
                        {amountsVisible ? formatEuro(m.totalIncome) : MASKED}
                      </Text>
                      <Text style={[styles.colNum, { color: '#ef4444' }]}>
                        {amountsVisible ? formatEuro(m.totalExpenses) : MASKED}
                      </Text>
                      <Text style={[styles.colNum, { color: net >= 0 ? '#22c55e' : '#ef4444', fontWeight: '700' }]}>
                        {amountsVisible ? formatEuro(net) : MASKED}
                      </Text>
                    </View>
                  );
                })}
              </>
            )}
          </View>

          {/* ── Recalculate ── */}
          <Pressable style={styles.recalcBtn} onPress={loadData}>
            <SymbolView name="arrow.clockwise" size={16} tintColor={colors.textSecondary} />
            <View>
              <Text style={styles.recalcLabel}>{t('explore.recalculate')}</Text>
              <Text style={styles.recalcHint}>{t('explore.recalculateHint')}</Text>
            </View>
          </Pressable>
        </>
      )}
    </ScrollView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function YearNav({ year, canPrev, canNext, onPrev, onNext, title, colors }: {
  year: number; canPrev: boolean; canNext: boolean;
  onPrev: () => void; onNext: () => void; title: string; colors: AppColors;
}) {
  const styles = useStyles(colors);
  return (
    <View style={styles.yearNav}>
      <Pressable onPress={onPrev} disabled={!canPrev} hitSlop={12}>
        <SymbolView name="chevron.left" size={16} tintColor={canPrev ? colors.textSecondary : colors.border} />
      </Pressable>
      <View style={styles.yearNavCenter}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.yearLabel}>{year}</Text>
      </View>
      <Pressable onPress={onNext} disabled={!canNext} hitSlop={12}>
        <SymbolView name="chevron.right" size={16} tintColor={canNext ? colors.textSecondary : colors.border} />
      </Pressable>
    </View>
  );
}

function SummaryRow({ label, value, color, colors, bold, highlight, amountsVisible }: {
  label: string; value: number; color: string; colors: AppColors; bold?: boolean; highlight?: boolean; amountsVisible: boolean;
}) {
  const styles = useStyles(colors);
  return (
    <View style={[styles.summaryRow, highlight && styles.summaryRowHighlight]}>
      <Text style={[styles.summaryLabel, bold && { fontWeight: '700' }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color }, bold && { fontSize: 16, fontWeight: '800' }]}>
        {amountsVisible ? formatEuro(value) : MASKED}
      </Text>
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, paddingBottom: 40, gap: 12 },
    heading: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 4 },
    loader: { marginTop: 48 },
    emptyState: { alignItems: 'center', gap: 12, marginTop: 60 },
    emptyText: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    card: {
      backgroundColor: colors.card, borderRadius: 16, padding: 16,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    yearNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
    yearNavCenter: { alignItems: 'center', flex: 1 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
    yearLabel: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
    summaryGrid: { gap: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 },
    summaryRowHighlight: { backgroundColor: colors.background, borderRadius: 10, paddingHorizontal: 10, marginTop: 4 },
    summaryLabel: { fontSize: 14, color: colors.text, flex: 1 },
    summaryValue: { fontSize: 14, fontWeight: '600' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 6 },
    tableHeader: {
      flexDirection: 'row', paddingBottom: 8,
      borderBottomWidth: 1.5, borderBottomColor: colors.border, marginBottom: 4,
    },
    headerCell: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: {
      flexDirection: 'row', paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
    },
    colMonth: { flex: 1.2, fontSize: 13, color: colors.text },
    colNum: { flex: 1, fontSize: 12, textAlign: 'right', fontWeight: '500', color: colors.text },
    noMonthData: { color: colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
    recalcBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.card, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    recalcLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
    recalcHint: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  }), [colors]);
}

