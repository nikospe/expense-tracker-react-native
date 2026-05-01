import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Switch, StyleSheet, Alert } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import {
  getStandardIncomes,
  addStandardIncome,
  toggleStandardIncome,
  deleteStandardIncome,
} from '@/lib/database';
import { formatEuro } from '@/lib/calculations';
import type { StandardIncome } from '@/lib/types';
import type { AppColors } from '@/lib/theme-colors';

export function StandardIncomeSection({ colors }: { colors: AppColors }) {
  const { t } = useTranslation();
  const styles = useStyles(colors);

  const [items, setItems] = useState<StandardIncome[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setItems(await getStandardIncomes());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsed) || parsed <= 0) return;
    setSaving(true);
    await addStandardIncome(description.trim(), parsed);
    setDescription('');
    setAmount('');
    setSaving(false);
    load();
  };

  const handleToggle = async (id: number, enabled: boolean) => {
    await toggleStandardIncome(id, enabled);
    load();
  };

  const handleDelete = (item: StandardIncome) => {
    Alert.alert(
      t('common.deleteTitle'),
      t('common.deleteMsg', { type: item.description || formatEuro(item.amount) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'), style: 'destructive', onPress: async () => {
            await deleteStandardIncome(item.id);
            load();
          },
        },
      ],
    );
  };

  return (
    <>
      <Text style={styles.sectionLabel}>{t('settings.standardIncome')}</Text>
      <View style={styles.card}>
        <Text style={styles.hint}>{t('settings.standardHint')}</Text>

        {items.length === 0 && (
          <Text style={styles.empty}>{t('settings.noStandardIncomes')}</Text>
        )}

        {items.map((item, i) => (
          <View key={item.id} style={[styles.itemRow, i < items.length - 1 && styles.itemBorder]}>
            <SymbolView name="arrow.down.circle.fill" size={18} tintColor="#22c55e" />
            <View style={styles.itemText}>
              {item.description ? (
                <Text style={styles.itemLabel} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <Text style={[styles.itemAmount, { color: '#22c55e' }]}>{formatEuro(item.amount)}</Text>
            </View>
            <Switch
              value={item.enabled === 1}
              onValueChange={(v) => handleToggle(item.id, v)}
              trackColor={{ false: colors.borderStrong, true: '#22c55e' }}
              thumbColor="#fff"
            />
            <Pressable onPress={() => handleDelete(item)} hitSlop={10}>
              <SymbolView name="trash" size={15} tintColor="#ef4444" />
            </Pressable>
          </View>
        ))}

        <View style={styles.addForm}>
          <TextInput
            style={[styles.input, { borderBottomColor: colors.inputBorder, color: colors.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder={t('settings.standardDescPlaceholder')}
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
          />
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
            style={[styles.addBtn, { backgroundColor: '#22c55e' }, saving && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={saving}
          >
            <SymbolView name="plus" size={14} tintColor="#fff" />
            <Text style={styles.addBtnText}>{t('settings.addStandardIncome')}</Text>
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
    itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
    itemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    itemText: { flex: 1 },
    itemLabel: { fontSize: 14, color: colors.text, fontWeight: '500' },
    itemAmount: { fontSize: 13, fontWeight: '600' },
    addForm: { marginTop: 14, gap: 10 },
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
