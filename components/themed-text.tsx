import { StyleSheet, Text, type TextProps } from 'react-native';
import { useAppColors } from '@/contexts/AppSettingsContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
  colorVariant?: 'text' | 'textSecondary' | 'textMuted' | 'primary';
};

export function ThemedText({
  style,
  type = 'default',
  colorVariant = 'text',
  ...rest
}: ThemedTextProps) {
  const colors = useAppColors();
  const color = type === 'link' ? colors.primary : colors[colorVariant];

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default:          { fontSize: 16, lineHeight: 24 },
  defaultSemiBold:  { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  title:            { fontSize: 32, fontWeight: 'bold', lineHeight: 32 },
  subtitle:         { fontSize: 20, fontWeight: 'bold' },
  link:             { fontSize: 16, lineHeight: 30 },
});
