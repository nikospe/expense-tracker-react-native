import { View, type ViewProps } from 'react-native';
import { useAppColors } from '@/contexts/AppSettingsContext';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'surface' | 'surfaceAlt';
};

export function ThemedView({ style, variant = 'background', ...otherProps }: ThemedViewProps) {
  const colors = useAppColors();
  return <View style={[{ backgroundColor: colors[variant] }, style]} {...otherProps} />;
}
