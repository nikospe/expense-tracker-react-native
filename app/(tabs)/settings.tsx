import { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SymbolView } from 'expo-symbols';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';
import type { ThemePreference, LanguagePreference } from '@/lib/settings-store';
import { PREPAYMENT_RATES, type PrepaymentRate } from '@/lib/types';
import { StandardIncomeSection } from '@/components/StandardIncomeSection';
import { StandardExpenseSection } from '@/components/StandardExpenseSection';
import { exportBackup, importBackup } from '@/lib/backup';
import { deleteAllData } from '@/lib/database';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const {
    themePreference, setThemePreference,
    languagePreference, setLanguagePreference,
    prepaymentEnabled, setPrepaymentEnabled,
    prepaymentRate, setPrepaymentRate,
    taxRate, setTaxRate,
    colors,
  } = useAppSettings();
  const styles = useStyles(colors);

  const [backupBusy, setBackupBusy] = useState(false);
  const [taxRateInput, setTaxRateInput] = useState(String(taxRate));

  const handleTaxRateChange = (text: string) => {
    setTaxRateInput(text);
    const parsed = parseFloat(text.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
      setTaxRate(parsed);
    }
  };
  // Incrementing this key forces StandardIncomeSection/StandardExpenseSection to re-mount after restore
  const [standardsKey, setStandardsKey] = useState(0);

  const handleExport = async () => {
    setBackupBusy(true);
    try {
      await exportBackup();
    } catch {
      Alert.alert(t('common.errorTitle'), t('settings.backupError'));
    } finally {
      setBackupBusy(false);
    }
  };

  const handleDeleteAll = () => {
    Alert.alert(
      t('settings.deleteAllTitle'),
      t('settings.deleteAllMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteAllConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllData();
              setStandardsKey((k) => k + 1);
              Alert.alert(t('common.done'), t('settings.deleteAllSuccess'));
            } catch {
              Alert.alert(t('common.errorTitle'), t('common.errorMsg'));
            }
          },
        },
      ],
    );
  };

  const handleImport = () => {
    Alert.alert(
      t('settings.importConfirmTitle'),
      t('settings.importConfirmMsg'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.importConfirmOk'),
          style: 'destructive',
          onPress: async () => {
            setBackupBusy(true);
            try {
              const result = await importBackup();
              if (result !== 'cancelled') {
                // Apply restored settings live so the UI updates immediately
                setThemePreference(result.settings.theme);
                setLanguagePreference(result.settings.language);
                setPrepaymentEnabled(result.settings.prepaymentEnabled);
                setPrepaymentRate(result.settings.prepaymentRate);
                setTaxRate(result.settings.taxRate ?? 22);
                setTaxRateInput(String(result.settings.taxRate ?? 22));
                // Force standard sections to re-mount and re-fetch from DB
                setStandardsKey((k) => k + 1);
                Alert.alert(t('common.done'), t('settings.importSuccess'));
              }
            } catch (err: unknown) {
              const msg = err instanceof Error && err.message === 'invalid_backup'
                ? t('settings.importInvalid')
                : t('settings.importError');
              Alert.alert(t('common.errorTitle'), msg);
            } finally {
              setBackupBusy(false);
            }
          },
        },
      ],
    );
  };

  const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
    { value: 'light',  label: t('settings.themeLight'),  icon: 'sun.max.fill' },
    { value: 'dark',   label: t('settings.themeDark'),   icon: 'moon.fill' },
    { value: 'device', label: t('settings.themeDevice'), icon: 'iphone' },
  ];

  const languageOptions: { value: LanguagePreference; label: string; badge: string }[] = [
    { value: 'en',     label: t('settings.langEnglish'), badge: 'EN' },
    { value: 'el',     label: t('settings.langGreek'),   badge: 'ΕΛ' },
    { value: 'device', label: t('settings.langDevice'),  badge: '⌘' },
  ];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>{t('settings.title')}</Text>

      {/* ── Appearance ── */}
      <Text style={styles.sectionLabel}>{t('settings.appearance')}</Text>
      <View style={styles.card}>
        <Text style={styles.optionTitle}>{t('settings.theme')}</Text>
        {themeOptions.map((opt, i) => (
          <Pressable
            key={opt.value}
            style={[styles.row, i < themeOptions.length - 1 && styles.rowBorder]}
            onPress={() => setThemePreference(opt.value)}
          >
            <SymbolView
              name={opt.icon as any}
              size={18}
              tintColor={themePreference === opt.value ? colors.accent : colors.textMuted}
            />
            <Text style={[styles.rowLabel, themePreference === opt.value && { color: colors.accent, fontWeight: '600' }]}>
              {opt.label}
            </Text>
            {themePreference === opt.value && (
              <SymbolView name="checkmark" size={16} tintColor={colors.accent} />
            )}
          </Pressable>
        ))}
      </View>

      {/* ── Language ── */}
      <Text style={styles.sectionLabel}>{t('settings.language')}</Text>
      <View style={styles.card}>
        <Text style={styles.optionTitle}>{t('settings.language')}</Text>
        {languageOptions.map((opt, i) => (
          <Pressable
            key={opt.value}
            style={[styles.row, i < languageOptions.length - 1 && styles.rowBorder]}
            onPress={() => setLanguagePreference(opt.value)}
          >
            <View style={[styles.badge, languagePreference === opt.value && { backgroundColor: colors.accent }]}>
              <Text style={[styles.badgeText, languagePreference === opt.value && { color: '#fff' }]}>
                {opt.badge}
              </Text>
            </View>
            <Text style={[styles.rowLabel, languagePreference === opt.value && { color: colors.accent, fontWeight: '600' }]}>
              {opt.label}
            </Text>
            {languagePreference === opt.value && (
              <SymbolView name="checkmark" size={16} tintColor={colors.accent} />
            )}
          </Pressable>
        ))}
      </View>

      {/* ── Standard Monthly Income ── */}
      <StandardIncomeSection key={`inc-${standardsKey}`} colors={colors} />

      {/* ── Standard Monthly Expenses ── */}
      <StandardExpenseSection key={`exp-${standardsKey}`} colors={colors} />

      {/* ── Tax Rate ── */}
      <Text style={styles.sectionLabel}>{t('settings.taxRateSection')}</Text>
      <View style={styles.card}>
        <Text style={styles.optionTitle}>{t('settings.taxRateLabel')}</Text>
        <View style={styles.taxRateRow}>
          <TextInput
            style={[styles.taxRateInput, { color: colors.text, borderBottomColor: colors.inputBorder }]}
            value={taxRateInput}
            onChangeText={handleTaxRateChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectTextOnFocus
          />
          <Text style={styles.taxRatePercent}>%</Text>
        </View>
        <Text style={styles.taxRateHint}>{t('settings.taxRateHint')}</Text>
      </View>

      {/* ── Προκαταβολή Φόρου ── */}
      <Text style={styles.sectionLabel}>{t('settings.prepaymentSection')}</Text>
      <View style={styles.card}>
        {/* Toggle */}
        <View style={[styles.row, prepaymentEnabled && styles.rowBorder]}>
          <SymbolView
            name="percent"
            size={18}
            tintColor={prepaymentEnabled ? '#a855f7' : colors.textMuted}
          />
          <Text style={[styles.rowLabel, prepaymentEnabled && { color: '#a855f7', fontWeight: '600' }]}>
            {t('settings.prepaymentEnable')}
          </Text>
          <Switch
            value={prepaymentEnabled}
            onValueChange={setPrepaymentEnabled}
            trackColor={{ false: colors.borderStrong, true: '#a855f7' }}
            thumbColor="#fff"
          />
        </View>

        {/* Rate picker — only when enabled */}
        {prepaymentEnabled && (
          <View style={styles.rateSection}>
            <Text style={styles.rateLabel}>{t('settings.prepaymentRate')}</Text>
            <View style={styles.rateGrid}>
              {PREPAYMENT_RATES.map((rate) => {
                const isSelected = prepaymentRate === rate;
                return (
                  <Pressable
                    key={rate}
                    style={[
                      styles.rateChip,
                      { borderColor: isSelected ? '#a855f7' : colors.borderStrong },
                      isSelected && { backgroundColor: '#a855f720' },
                    ]}
                    onPress={() => setPrepaymentRate(rate as PrepaymentRate)}
                  >
                    <Text style={[
                      styles.rateChipText,
                      { color: isSelected ? '#a855f7' : colors.textSecondary },
                      isSelected && { fontWeight: '700' },
                    ]}>
                      {(rate * 100).toFixed(0)}%
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </View>

      {/* ── Data Backup ── */}
      <Text style={styles.sectionLabel}>{t('settings.backupSection')}</Text>
      <View style={styles.card}>
        <Text style={styles.backupHint}>{t('settings.backupHint')}</Text>

        {backupBusy ? (
          <ActivityIndicator style={styles.backupLoader} color={colors.accent} />
        ) : (
          <View style={styles.backupButtons}>
            <Pressable style={[styles.backupBtn, styles.backupBtnExport]} onPress={handleExport}>
              <SymbolView name="square.and.arrow.up" size={17} tintColor="#fff" />
              <Text style={styles.backupBtnText}>{t('settings.exportBackup')}</Text>
            </Pressable>
            <Pressable style={[styles.backupBtn, styles.backupBtnImport]} onPress={handleImport}>
              <SymbolView name="square.and.arrow.down" size={17} tintColor="#fff" />
              <Text style={styles.backupBtnText}>{t('settings.importBackup')}</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Danger Zone ── */}
      <Text style={styles.sectionLabel}>{t('settings.dangerZone')}</Text>
      <View style={styles.card}>
        <Text style={styles.backupHint}>{t('settings.deleteAllHint')}</Text>
        <Pressable style={styles.deleteAllBtn} onPress={handleDeleteAll}>
          <SymbolView name="trash.fill" size={17} tintColor="#fff" />
          <Text style={styles.backupBtnText}>{t('settings.deleteAllBtn')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    container: { padding: 16, paddingBottom: 40 },
    heading: { fontSize: 26, fontWeight: '800', color: colors.text, marginBottom: 20 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: colors.textMuted,
      textTransform: 'uppercase', letterSpacing: 0.8,
      marginBottom: 8, marginTop: 4, marginLeft: 4,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    optionTitle: {
      fontSize: 13, fontWeight: '600', color: colors.textSecondary,
      marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
    rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    rowLabel: { flex: 1, fontSize: 15, color: colors.text },
    badge: {
      width: 32, height: 32, borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.border,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },

    // Prepayment rate picker
    rateSection: { paddingTop: 14, gap: 10 },
    rateLabel: {
      fontSize: 13, fontWeight: '600', color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    rateGrid: { flexDirection: 'row', gap: 10 },
    rateChip: {
      flex: 1, paddingVertical: 10,
      borderRadius: 10, borderWidth: 1.5,
      alignItems: 'center', justifyContent: 'center',
    },
    rateChipText: { fontSize: 16, fontWeight: '500' },

    // Tax rate
    taxRateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    taxRateInput: { fontSize: 28, fontWeight: '700', borderBottomWidth: 2, paddingBottom: 4, width: 80, textAlign: 'center' },
    taxRatePercent: { fontSize: 22, color: colors.textMuted },
    taxRateHint: { fontSize: 12, color: colors.textMuted, marginTop: 8 },

    // Backup
    backupHint: { fontSize: 13, color: colors.textMuted, lineHeight: 18, marginBottom: 16 },
    backupLoader: { marginVertical: 16 },
    backupButtons: { gap: 10 },
    backupBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, paddingVertical: 14,
    },
    backupBtnExport: { backgroundColor: '#22c55e' },
    backupBtnImport: { backgroundColor: '#3b82f6' },
    backupBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    deleteAllBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, paddingVertical: 14,
      backgroundColor: '#ef4444',
    },
  }), [colors]);
}
