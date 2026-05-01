import { useMemo, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId } from '@/lib/types';
import { addIncome, addExpense, addProfitDistribution } from '@/lib/database';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

type EntryType = 'income' | 'expense' | 'profit_distribution';

export default function AddEntryScreen() {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);

  const now = new Date();
  const [entryType, setEntryType] = useState<EntryType>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryId>('general');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert(t('add.invalidAmountTitle'), t('add.invalidAmountMsg'));
      return;
    }
    setSaving(true);
    try {
      if (entryType === 'income') {
        await addIncome(year, month, parsed, description.trim());
      } else if (entryType === 'expense') {
        await addExpense(year, month, category, parsed, description.trim());
      } else if (entryType === 'profit_distribution') {
        await addProfitDistribution(year, month, parsed, description.trim());
      }
      setAmount('');
      setDescription('');
      const typeLabel = entryType === 'income'
        ? t('common.income')
        : entryType === 'profit_distribution'
        ? t('common.profitDist')
        : t('common.expenses');
      Alert.alert(t('add.savedTitle'), t('add.savedMsg', { type: typeLabel }));
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorMsg'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>

        {/* Type toggle */}
        <View style={styles.toggle}>
          <ToggleButton
            label={t('common.income')}
            icon="arrow.down.circle.fill"
            active={entryType === 'income'}
            activeColor="#22c55e"
            onPress={() => setEntryType('income')}
            colors={colors}
          />
          <ToggleButton
            label={t('common.expenses')}
            icon="arrow.up.circle.fill"
            active={entryType === 'expense'}
            activeColor="#ef4444"
            onPress={() => setEntryType('expense')}
            colors={colors}
          />
          <ToggleButton
            label={t('add.profitDistShort')}
            icon="chart.pie.fill"
            active={entryType === 'profit_distribution'}
            activeColor="#a855f7"
            onPress={() => setEntryType('profit_distribution')}
            colors={colors}
          />
        </View>

        {/* Month picker */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('add.month')}</Text>
          <View style={styles.monthRow}>
            <MonthArrow
              direction="left"
              colors={colors}
              onPress={() => {
                if (month === 1) { setMonth(12); setYear(y => y - 1); }
                else setMonth(m => m - 1);
              }}
            />
            <Text style={styles.monthText}>
              {t(`months.${month}`)} {year}
            </Text>
            <MonthArrow
              direction="right"
              colors={colors}
              disabled={year === now.getFullYear() && month === now.getMonth() + 1}
              onPress={() => {
                if (month === 12) { setMonth(1); setYear(y => y + 1); }
                else setMonth(m => m + 1);
              }}
            />
          </View>
        </View>

        {/* Amount */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>{t('add.amount')}</Text>
          <View style={[styles.amountRow, { borderBottomColor: colors.inputBorder }]}>
            <Text style={styles.eurSymbol}>€</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Category (expense only) */}
        {entryType === 'expense' && (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('add.category')}</Text>
            <View style={styles.categoryGrid}>
              {EXPENSE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    { borderColor: colors.borderStrong },
                    category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                  ]}
                  onPress={() => { setCategory(cat.id); setDescription(''); }}
                >
                  <SymbolView
                    name={cat.icon}
                    size={16}
                    tintColor={category === cat.id ? cat.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.chipLabel,
                      { color: colors.textSecondary },
                      category === cat.id && { color: cat.color, fontWeight: '600' },
                    ]}
                  >
                    {t(`categories.${cat.id}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* "Other" custom name — replaces description when category is 'other' */}
        {entryType === 'expense' && category === 'other' ? (
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('add.otherNameLabel')}</Text>
            <TextInput
              style={[styles.descInput, { borderBottomColor: colors.inputBorder, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('add.otherNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              autoFocus
            />
            <Text style={[styles.hintText, { color: colors.textMuted }]}>
              {t('add.otherNameHint')}
            </Text>
          </View>
        ) : (
          /* Regular description */
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>{t('add.description')}</Text>
            <TextInput
              style={[styles.descInput, { borderBottomColor: colors.inputBorder, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder={
                entryType === 'income'
                  ? t('add.descPlaceholderIncome')
                  : entryType === 'profit_distribution'
                  ? t('add.descPlaceholderDist')
                  : t('add.descPlaceholderExpense')
              }
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
            />
          </View>
        )}

        {/* Save */}
        <Pressable
          style={[
            styles.saveBtn,
            {
              backgroundColor: entryType === 'income'
                ? '#22c55e'
                : entryType === 'profit_distribution'
                ? '#a855f7'
                : '#ef4444',
            },
            saving && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving
              ? t('add.saving')
              : entryType === 'income'
              ? t('add.addIncome')
              : entryType === 'profit_distribution'
              ? t('add.addProfitDistribution')
              : t('add.addExpense')}
          </Text>
        </Pressable>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ToggleButton({ label, icon, active, activeColor, onPress, colors }: {
  label: string; icon: string; active: boolean; activeColor: string; onPress: () => void; colors: AppColors;
}) {
  return (
    <Pressable
      style={[
        { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center', gap: 4,
          borderWidth: 1.5, borderColor: active ? activeColor : 'transparent',
          backgroundColor: active ? activeColor : 'transparent' },
      ]}
      onPress={onPress}
    >
      <SymbolView
        name={icon}
        size={20}
        tintColor={active ? '#fff' : colors.textSecondary}
      />
      <Text style={{ fontSize: 11, fontWeight: '600', color: active ? '#fff' : colors.textSecondary, textAlign: 'center' }}>
        {label}
      </Text>
    </Pressable>
  );
}

function MonthArrow({ direction, onPress, disabled, colors }: {
  direction: 'left' | 'right'; onPress: () => void; disabled?: boolean; colors: AppColors;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={12}>
      <SymbolView
        name={direction === 'left' ? 'chevron.left' : 'chevron.right'}
        size={18}
        tintColor={disabled ? colors.border : colors.textSecondary}
      />
    </Pressable>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    flex: { flex: 1 },
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, paddingBottom: 40, gap: 12 },
    toggle: {
      flexDirection: 'row',
      backgroundColor: colors.toggleBg,
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
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
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
    monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    monthText: { fontSize: 17, fontWeight: '600', color: colors.text },
    amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, paddingBottom: 4 },
    eurSymbol: { fontSize: 26, fontWeight: '300', color: colors.textMuted, marginRight: 6 },
    amountInput: { flex: 1, fontSize: 32, fontWeight: '700', color: colors.text },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 8,
      borderRadius: 10, borderWidth: 1.5,
      backgroundColor: colors.card,
    },
    chipLabel: { fontSize: 13 },
    descInput: { fontSize: 15, borderBottomWidth: 1.5, paddingBottom: 6 },
    hintText: { fontSize: 12, marginTop: 6 },
    saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  }), [colors]);
}

