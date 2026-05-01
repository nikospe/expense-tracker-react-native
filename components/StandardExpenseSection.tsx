import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import {
  getStandardExpenses,
  addStandardExpense,
  toggleStandardExpense,
  deleteStandardExpense,
} from '@/lib/database';
import { formatEuro } from '@/lib/calculations';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId, type StandardExpense } from '@/lib/types';
import type { AppColors } from '@/lib/theme-colors';

export function StandardExpenseSection({ colors }: { colors: AppColors }) {
  const { t } = useTranslation();
  const styles = useStyles(colors);

  const [items, setItems] = useState<StandardExpense[]>([]);
  const [category, setCategory] = useState<ExpenseCategoryId>('general');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setItems(await getStandardExpenses());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCategoryChange = (cat: ExpenseCategoryId) => {
    setCategory(cat);
    setDescription('');
  };

  const handleAdd = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    await addStandardExpense(category, parsed, category === 'other' ? description.trim() : '');
    setAmount('');
    setDescription('');
    setSaving(false);
    load();
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await toggleStandardExpense(id, enabled);
    load();
  };

  const handleDelete = (item: StandardExpense) => {
    const label = item.description || t(`categories.${item.category}`);
    Alert.alert(
      t('common.deleteTitle'),
      t('common.deleteMsg', { type: label }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive', onPress: async () => {
            await deleteStandardExpense(item.id);
            load();
          },
        },
      ],
    );
  };

  const selectedCat = EXPENSE_CATEGORIES.find((c) => c.id === category)!;

  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.standardExpenses')}</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>{t('settings.standardHint')}</Text>

        {items.length === 0 && (
          <Text style={styles.empty}>{t('settings.noStandardExpenses')}</Text>
        )}

        {items.map((item, i) => {
          const cat = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
          const label = item.category === 'other'
            ? (item.description || t('categories.other'))
            : t(`categories.${item.category}`);
          return (
            <View key={item.id} style={[styles.itemRow, i < items.length - 1 && styles.itemBorder]}>
              <View style={[styles.iconWrap, { backgroundColor: (cat?.color ?? '#94a3b8') + '20' }]}>
                <SymbolView name={cat?.icon ?? 'ellipsis.circle.fill'} size={14} tintColor={cat?.color ?? '#94a3b8'} />
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemLabel} numberOfLines={1}>{label}</Text>
                {item.category === 'other' && item.description && (
                  <Text style={styles.itemSub}>{t('categories.other')}</Text>
                )}
              </View>
              <Text style={[styles.itemAmount, { color: cat?.color ?? '#94a3b8' }]}>
                {formatEuro(item.amount)}
              </Text>
              <Switch
                value={item.enabled === 1}
                onValueChange={(v) => handleToggle(item.id, v)}
                trackColor={{ false: colors.borderStrong, true: cat?.color ?? '#94a3b8' }}
                thumbColor="#fff"
              />
              <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
                <SymbolView name="trash" size={15} tintColor="#ef4444" />
              </Pressable>
            </View>
          );
        })}

        <View style={styles.addForm}>
          <View style={styles.chipGrid}>
            {EXPENSE_CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                style={[
                  styles.chip,
                  { borderColor: colors.borderStrong },
                  category === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color },
                ]}
                onPress={() => handleCategoryChange(cat.id)}
              >
                <SymbolView
                  name={cat.icon}
                  size={13}
                  tintColor={category === cat.id ? cat.color : colors.textMuted}
                />
                <Text style={[
                  styles.chipLabel,
                  { color: colors.textSecondary },
                  category === cat.id && { color: cat.color, fontWeight: '600' },
                ]}>
                  {t(`categories.${cat.id}`)}
                </Text>
              </Pressable>
            ))}
          </View>

          {category === 'other' && (
            <TextInput
              style={[styles.input, { borderBottomColor: colors.inputBorder, color: colors.text }]}
              value={description}
              onChangeText={setDescription}
              placeholder={t('add.otherNamePlaceholder')}
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
            />
          )}

          <View style={[styles.amountRow, { borderBottomColor: colors.inputBorder }]}>
            <Text style={styles.eurSymbol}>€</Text>
            <TextInput
              style={[styles.amountInput, { color: colors.text }]}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          <Pressable
            style={[
              styles.addBtn,
              { backgroundColor: selectedCat.color },
              saving && styles.addBtnDisabled,
            ]}
            onPress={handleAdd}
            disabled={saving}
          >
            <SymbolView name="plus" size={14} tintColor="#fff" />
            <Text style={styles.addBtnText}>{t('settings.addStandardExpense')}</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: 8, marginTop: 4, marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 20,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    hint: { fontSize: 12, color: colors.textMuted, marginBottom: 12 },
    empty: { fontSize: 13, color: colors.textMuted, marginBottom: 12, fontStyle: 'italic' },
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
    itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    iconWrap: { width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    itemText: { flex: 1 },
    itemLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    itemSub: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
    itemAmount: { fontSize: 13, fontWeight: '600', marginRight: 4 },
    addForm: { marginTop: 14, gap: 10 },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      paddingHorizontal: 9, paddingVertical: 6,
      borderRadius: 8, borderWidth: 1.5, backgroundColor: colors.card,
    },
    chipLabel: { fontSize: 11 },
    input: { fontSize: 15, borderBottomWidth: 1.5, paddingBottom: 6 },
    amountRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, paddingBottom: 4 },
    eurSymbol: { fontSize: 20, fontWeight: '300', color: colors.textMuted, marginRight: 6 },
    amountInput: { flex: 1, fontSize: 22, fontWeight: '600' },
    addBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 6, borderRadius: 10, paddingVertical: 12, marginTop: 4,
    },
    addBtnDisabled: { opacity: 0.6 },
    addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  }), [colors]);
}
