export interface AppColors {
  // Backgrounds
  background:    string;
  surface:       string;  // Card / panel background
  surfaceAlt:    string;  // Chips, segment control, secondary surfaces

  // Text
  text:          string;
  textSecondary: string;  // Labels, captions
  textMuted:     string;  // Placeholders, hints

  // Borders
  border:        string;  // Subtle dividers
  borderStrong:  string;  // Visible borders, input underlines

  // Brand
  primary:       string;
  primaryDark:   string;
  secondary:     string;

  // Semantic states
  success:       string;
  danger:        string;
  warning:       string;
}

export const LightColors: AppColors = {
  background:    '#FAF5EC',
  surface:       '#FFFDF8',
  surfaceAlt:    '#EFE3D0',
  text:          '#15171A',
  textSecondary: '#6B5D4A',
  textMuted:     '#9E8B74',
  border:        '#E8DCCD',
  borderStrong:  '#D4C5B0',
  primary:       '#D89A32',
  primaryDark:   '#A96A1F',
  secondary:     '#5F8375',
  success:       '#16a34a',
  danger:        '#dc2626',
  warning:       '#d97706',
};

export const DarkColors: AppColors = {
  background:    '#0F1013',
  surface:       '#1B1D21',
  surfaceAlt:    '#292C31',
  text:          '#F0E3CE',
  textSecondary: '#A89880',
  textMuted:     '#6B5E50',
  border:        '#232529',
  borderStrong:  '#333740',
  primary:       '#EAB05A',
  primaryDark:   '#B97824',
  secondary:     '#5E796D',
  success:       '#4ade80',
  danger:        '#f87171',
  warning:       '#fbbf24',
};
