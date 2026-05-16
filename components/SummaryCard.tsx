import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import type { SFSymbol } from 'expo-symbols';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { formatEuro, MASKED } from '@/lib/calculations';
import type { AppColors } from '@/lib/theme-colors';

interface Props {
  label: string;
  amount: number;
  color: string;
  icon: SFSymbol;
  subtitle?: string;
}

export function SummaryCard({ label, amount, color, icon, subtitle }: Props) {
  const { colors, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '28' }]}>
        <SymbolView name={icon} size={22} tintColor={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, { color }]}>
        {amountsVisible ? formatEuro(amount) : MASKED}
      </Text>
      {subtitle && amountsVisible ? (
        <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 16,
      borderLeftWidth: 3.5,
      padding: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    iconBox: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    label: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 4,
    },
    amount: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 3,
    },
    subtitle: {
      fontSize: 11,
      color: colors.textMuted,
      lineHeight: 15,
    },
  }), [colors]);
}
