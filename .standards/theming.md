---
name: theming
description: Color palettes, dark/light mode, how to access and use theme colors in components
type: reference
---

# Theming

## AppColors Interface (`lib/theme-colors.ts`)
```typescript
interface AppColors {
  // Backgrounds
  background:    string;  // Screen / page background
  surface:       string;  // Card / panel background
  surfaceAlt:    string;  // Chips, segment controls, secondary surfaces

  // Text
  text:          string;  // Primary text
  textSecondary: string;  // Labels, captions
  textMuted:     string;  // Placeholders, hints

  // Borders
  border:        string;  // Subtle dividers
  borderStrong:  string;  // Visible borders, input underlines

  // Brand
  primary:       string;  // Brand accent
  primaryDark:   string;  // Pressed / darker accent
  secondary:     string;  // Secondary accent

  // Semantic states
  success:       string;
  danger:        string;
  warning:       string;
}
```

## Palette Values

| Token | Light | Dark |
|---|---|---|
| `background` | `#FAF5EC` | `#0F1013` |
| `surface` | `#FFFDF8` | `#1B1D21` |
| `surfaceAlt` | `#EFE3D0` | `#292C31` |
| `text` | `#15171A` | `#F0E3CE` |
| `textSecondary` | `#6B5D4A` | `#A89880` |
| `textMuted` | `#9E8B74` | `#6B5E50` |
| `border` | `#E8DCCD` | `#232529` |
| `borderStrong` | `#D4C5B0` | `#333740` |
| `primary` | `#D89A32` | `#EAB05A` |
| `primaryDark` | `#A96A1F` | `#B97824` |
| `secondary` | `#5F8375` | `#5E796D` |
| `success` | `#16a34a` | `#4ade80` |
| `danger` | `#dc2626` | `#f87171` |
| `warning` | `#d97706` | `#fbbf24` |

## Accessing Colors in a Component

```typescript
import { useAppColors } from '@/contexts/AppSettingsContext';
const colors = useAppColors();

// Or if you need other settings too:
import { useAppSettings } from '@/contexts/AppSettingsContext';
const { colors, isDark, amountsVisible } = useAppSettings();
```

## The useStyles Pattern
All components define styles inside a `useMemo`-wrapped `StyleSheet.create` call that takes `colors` as input. This ensures styles recompute only when the theme changes.

```typescript
function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 10,
    },
  }), [colors]);
}
```

Call it at the top of the component: `const styles = useStyles(colors);`

## Entry Type Accent Colors
These are **not** in `AppColors` — hardcoded per entry type:

| Type | Color | Usage |
|---|---|---|
| Income | `#22c55e` | Green |
| Expense | `#ef4444` | Red |
| Profit Distribution | `#a855f7` | Purple |

## ThemedView / ThemedText

```tsx
// ThemedView — variant controls background token
<ThemedView variant="surface"> ... </ThemedView>
// variants: 'background' (default) | 'surface' | 'surfaceAlt'

// ThemedText — type controls typography, colorVariant controls color token
<ThemedText type="defaultSemiBold" colorVariant="textSecondary">
  Label
</ThemedText>
// colorVariants: 'text' (default) | 'textSecondary' | 'textMuted' | 'primary'
// type 'link' always uses colors.primary automatically
```

## Card Shadow (Standard)
```typescript
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.06,
shadowRadius: 8,
elevation: 3,  // Android
```

## Standard Border Radius Values
- Cards: `borderRadius: 16`
- Chips / category pills: `borderRadius: 10`
- Buttons: `borderRadius: 12–14`
- Icon wrappers: `borderRadius: 8`
- Full pill: `borderRadius: 20`
