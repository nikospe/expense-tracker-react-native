import { useEffect, useMemo, useState } from 'react';
import {
  Modal, View, Text, TextInput, Pressable,
  ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { updateIncome, updateExpense, updateProfitDistribution } from '@/lib/database';
import { EXPENSE_CATEGORIES, type ExpenseCategoryId, type Income, type Expense, type ProfitDistribution } from '@/lib/types';
import { useAppColors } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

export type EditTarget =
  | { type: 'income'; entry: Income }
  | { type: 'expense'; entry: Expense }
  | { type: 'profit_distribution'; entry: ProfitDistribution };

interface Props {
  target: EditTarget | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditEntryModal({ target, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const colors = useAppColors();
  const styles = useStyles(colors);

  const [amount, setAmount] = useState('');
  const [clientName, setClientName] = useState('');
  const [shareholderName, setShareholderName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryId>('general');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!target) return;
    setAmount(String(target.entry.amount));
    setDescription(target.entry.description);
    if (target.type === 'income') {
      setClientName(target.entry.client_name);
    } else if (target.type === 'expense') {
      setCategory(target.entry.category);
    } else {
      setShareholderName(target.entry.shareholder_name);
    }
  }, [target]);

  if (!target) return null;

  const title =
    target.type === 'income' ? t('edit.incomeTitle')
    : target.type === 'expense' ? t('edit.expenseTitle')
    : t('edit.distributionTitle');

  const accentColor =
    target.type === 'income' ? '#22c55e'
    : target.type === 'expense' ? '#ef4444'
    : '#a855f7';

  const handleSave = async () => {
    const parsed = parseFloat(amount.replace(',', '.'));
    if (!amount || isNaN(parsed) || parsed <= 0) {
      Alert.alert(t('add.invalidAmountTitle'), t('add.invalidAmountMsg'));
      return;
    }
    setSaving(true);
    try {
      if (target.type === 'income') {
        await updateIncome(target.entry.id, parsed, clientName.trim(), description.trim());
      } else if (target.type === 'expense') {
        await updateExpense(target.entry.id, parsed, category, description.trim());
      } else {
        await updateProfitDistribution(target.entry.id, parsed, shareholderName.trim(), description.trim());
      }
      Alert.alert(t('edit.savedTitle'), t('edit.savedMsg'));
      onSaved();
    } catch {
      Alert.alert(t('common.errorTitle'), t('common.errorMsg'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kvContainer}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <SymbolView name="xmark.circle.fill" size={24} tintColor={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.form}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Client Name — income only */}
            {target.type === 'income' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('add.clientNameLabel')}</Text>
                <TextInput
                  style={[styles.input, { borderBottomColor: colors.inputBorder, color: colors.text }]}
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder={t('add.clientNamePlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Shareholder Name — distribution only */}
            {target.type === 'profit_distribution' && (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{t('add.shareholderLabel')}</Text>
                <TextInput
                  style={[styles.input, { borderBottomColor: colors.inputBorder, color: colors.text }]}
                  value={shareholderName}
                  onChangeText={setShareholderName}
                  placeholder={t('add.shareholderPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  returnKeyType="next"
                />
              </View>
            )}

            {/* Category — expense only */}
            {target.type === 'expense' && (
              <View style={styles.field}>
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
                      onPress={() => setCategory(cat.id)}
                    >
                      <SymbolView
                        name={cat.icon}
                        size={15}
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
              </View>
            )}

            {/* Amount */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('add.amount')}</Text>
              <View style={[styles.amountRow, { borderBottomColor: accentColor }]}>
                <Text style={[styles.eurSymbol, { color: colors.textMuted }]}>€</Text>
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
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{t('add.description')}</Text>
              <TextInput
                style={[styles.input, { borderBottomColor: colors.inputBorder, color: colors.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder={
                  target.type === 'income' ? t('add.descPlaceholderIncome')
                  : target.type === 'profit_distribution' ? t('add.descPlaceholderDist')
                  : t('add.descPlaceholderExpense')
                }
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttons}>
              <Pressable style={[styles.btn, styles.cancelBtn, { borderColor: colors.borderStrong }]} onPress={onClose}>
                <Text style={[styles.btnText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.saveBtn, { backgroundColor: accentColor }, saving && styles.btnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={[styles.btnText, styles.saveBtnText]}>
                  {saving ? t('add.saving') : t('edit.saveChanges')}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    kvContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '90%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderStrong,
    },
    accentBar: {
      width: 4,
      height: 20,
      borderRadius: 2,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
    },
    form: {
      padding: 20,
      gap: 20,
      paddingBottom: 36,
    },
    field: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    input: {
      fontSize: 15,
      borderBottomWidth: 1.5,
      paddingBottom: 6,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 2,
      paddingBottom: 4,
    },
    eurSymbol: {
      fontSize: 24,
      fontWeight: '300',
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
      fontSize: 28,
      fontWeight: '700',
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: 1.5,
      backgroundColor: colors.card,
    },
    chipLabel: {
      fontSize: 12,
    },
    buttons: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    btn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    cancelBtn: {
      borderWidth: 1.5,
    },
    saveBtn: {},
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      fontSize: 15,
      fontWeight: '600',
    },
    saveBtnText: {
      color: '#fff',
    },
  }), [colors]);
}
