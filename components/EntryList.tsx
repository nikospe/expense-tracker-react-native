import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { EXPENSE_CATEGORIES, type Income, type Expense, type ProfitDistribution } from '@/lib/types';
import { formatEuro, MASKED } from '@/lib/calculations';
import { deleteIncome, deleteExpense, deleteProfitDistribution } from '@/lib/database';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

interface IncomeListProps {
  incomes: Income[];
  onDelete: () => void;
  onEdit: (entry: Income) => void;
}

export function IncomeList({ incomes, onDelete, onEdit }: IncomeListProps) {
  const { t } = useTranslation();
  const { colors, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  if (incomes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dashboard.noIncomeYet')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {incomes.map((item) => (
        <EntryRow
          key={item.id}
          label={item.client_name || item.description || t('common.income')}
          sublabel={item.client_name && item.description ? item.description : undefined}
          amount={item.amount}
          amountsVisible={amountsVisible}
          color="#22c55e"
          icon={'arrow.down.circle.fill' as SFSymbol}
          onDelete={() =>
            confirmDelete(t('common.income').toLowerCase(), t, () =>
              deleteIncome(item.id).then(onDelete),
            )
          }
          onEdit={() => onEdit(item)}
          colors={colors}
        />
      ))}
    </View>
  );
}

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: () => void;
  onEdit: (entry: Expense) => void;
}

export function ExpenseList({ expenses, onDelete, onEdit }: ExpenseListProps) {
  const { t } = useTranslation();
  const { colors, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  if (expenses.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dashboard.noExpensesYet')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {expenses.map((item) => {
        const cat = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
        return (
          <EntryRow
            key={item.id}
            label={item.category === 'other'
              ? (item.description || t('categories.other'))
              : (item.description || t(`categories.${item.category}`))}
            sublabel={item.category === 'other' && item.description
              ? t('categories.other')
              : t(`categories.${item.category}`)}
            amount={item.amount}
            amountsVisible={amountsVisible}
            color={cat?.color ?? '#6b7280'}
            icon={cat?.icon ?? ('creditcard.fill' as SFSymbol)}
            onDelete={() =>
              confirmDelete(t('common.expenses').toLowerCase(), t, () =>
                deleteExpense(item.id).then(onDelete),
              )
            }
            onEdit={() => onEdit(item)}
            colors={colors}
          />
        );
      })}
    </View>
  );
}

// ─── Profit Distribution List ────────────────────────────────────────────────

interface ProfitDistributionListProps {
  distributions: ProfitDistribution[];
  onDelete: () => void;
  onEdit: (entry: ProfitDistribution) => void;
}

export function ProfitDistributionList({ distributions, onDelete, onEdit }: ProfitDistributionListProps) {
  const { t } = useTranslation();
  const { colors, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  if (distributions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{t('dashboard.noProfitDistributions')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {distributions.map((item) => (
        <EntryRow
          key={item.id}
          label={item.shareholder_name || item.description || t('common.profitDist')}
          sublabel={item.shareholder_name && item.description ? item.description : undefined}
          amount={item.amount}
          amountsVisible={amountsVisible}
          color="#a855f7"
          icon={'arrow.up.forward.circle.fill' as SFSymbol}
          onDelete={() =>
            confirmDelete(t('common.profitDist').toLowerCase(), t, () =>
              deleteProfitDistribution(item.id).then(onDelete),
            )
          }
          onEdit={() => onEdit(item)}
          colors={colors}
        />
      ))}
    </View>
  );
}

// ─── Shared row ──────────────────────────────────────────────────────────────

interface EntryRowProps {
  label: string;
  sublabel?: string;
  amount: number;
  amountsVisible: boolean;
  color: string;
  icon: SFSymbol;
  onDelete: () => void;
  onEdit: () => void;
  colors: AppColors;
}

function EntryRow({ label, sublabel, amount, amountsVisible, color, icon, onDelete, onEdit, colors }: EntryRowProps) {
  const styles = useStyles(colors);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onEdit();
      }}
      delayLongPress={600}
    >
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <SymbolView name={icon} size={16} tintColor={color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel} numberOfLines={1}>{label}</Text>
        {sublabel && label !== sublabel ? (
          <Text style={styles.rowSublabel}>{sublabel}</Text>
        ) : null}
      </View>
      <Text style={[styles.rowAmount, { color }]}>
        {amountsVisible ? formatEuro(amount) : MASKED}
      </Text>
      <Pressable onPress={onDelete} hitSlop={12} style={styles.deleteBtn}>
        <SymbolView name="trash" size={15} tintColor="#ef4444" />
      </Pressable>
    </Pressable>
  );
}

function confirmDelete(type: string, t: ReturnType<typeof useTranslation>['t'], onConfirm: () => void) {
  Alert.alert(
    t('common.deleteTitle'),
    t('common.deleteMsg', { type }),
    [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: onConfirm },
    ],
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    list: { gap: 1 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    rowPressed: {
      opacity: 0.6,
    },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowText: { flex: 1 },
    rowLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    rowSublabel: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
    rowAmount: { fontSize: 14, fontWeight: '600' },
    deleteBtn: { padding: 4 },
    empty: { paddingVertical: 16, alignItems: 'center' },
    emptyText: { color: colors.textMuted, fontSize: 14 },
  }), [colors]);
}
