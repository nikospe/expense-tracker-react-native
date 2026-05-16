import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { formatEuro, MASKED } from '@/lib/calculations';
import type { AppColors } from '@/lib/theme-colors';

interface Props {
  label: string;
  amount: number;
  color: string;
  subtitle?: string;
  large?: boolean;
}

export function SummaryCard({ label, amount, color, subtitle, large }: Props) {
  const { colors, amountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  return (
    <View style={[styles.card, large && styles.cardLarge]}>
      <View style={[styles.accent, { backgroundColor: color }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.amount, large && styles.amountLarge, { color }]}>
          {amountsVisible ? formatEuro(amount) : MASKED}
        </Text>
        {subtitle && amountsVisible ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 16,
      flexDirection: 'row',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
      marginBottom: 12,
    },
    cardLarge: {
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },
    accent: {
      width: 5,
    },
    content: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    label: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    amount: {
      fontSize: 22,
      fontWeight: '700',
    },
    amountLarge: {
      fontSize: 28,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
  }), [colors]);
}
