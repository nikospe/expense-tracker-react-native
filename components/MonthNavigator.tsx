import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { useTranslation } from 'react-i18next';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import type { AppColors } from '@/lib/theme-colors';

interface Props {
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthNavigator({ year, month, onPrev, onNext }: Props) {
  const { t } = useTranslation();
  const { colors, amountsVisible, toggleAmountsVisible } = useAppSettings();
  const styles = useStyles(colors);

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <View style={styles.container}>
      <View style={styles.sideLeft}>
        <Pressable onPress={onPrev} style={styles.arrow} hitSlop={12}>
          <SymbolView name="chevron.left" size={20} tintColor={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.month}>{t(`months.${month}`)}</Text>
        <Text style={styles.year}>{year}</Text>
        {isCurrentMonth && <View style={styles.dot} />}
        <Pressable onPress={toggleAmountsVisible} hitSlop={12} style={styles.eyeBtn}>
          <SymbolView
            name={amountsVisible ? 'eye' : 'eye.slash'}
            size={22}
            tintColor={amountsVisible ? colors.textSecondary : colors.accent}
          />
        </Pressable>
      </View>

      <View style={styles.sideRight}>
        <Pressable
          onPress={onNext}
          style={[styles.arrow, isCurrentMonth && styles.arrowDisabled]}
          disabled={isCurrentMonth}
          hitSlop={12}
        >
          <SymbolView
            name="chevron.right"
            size={20}
            tintColor={isCurrentMonth ? colors.border : colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
}

function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
    },
    sideLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    sideRight: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    arrow: {
      padding: 8,
    },
    arrowDisabled: {
      opacity: 0.4,
    },
    eyeBtn: {
      padding: 6,
      marginLeft: 2,
    },
    center: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    month: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    year: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#22c55e',
      marginLeft: -4,
    },
  }), [colors]);
}
