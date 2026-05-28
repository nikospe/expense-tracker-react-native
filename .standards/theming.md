---
name: theming
description: Color palettes, dark/light mode, how to access and use theme colors in components
type: reference
---

# Theming

## AppColors Interface (`lib/theme-colors.ts`)
```typescript
interface AppColors {
  background:    string;  // Screen/page background
  card:          string;  // Card/surface background
  text:          string;  // Primary text
  textSecondary: string;  // Labels, secondary text
  textMuted:     string;  // Placeholder, hint text
  border:        string;  // Subtle dividers
  borderStrong:  string;  // Visible borders, chip borders
  inputBorder:   string;  // Text input underline
  toggleBg:      string;  // Segmented control background
  accent:        string;  // App accent (green)
}
```

## Palette Values

| Token | Light | Dark |
|---|---|---|
| `background` | `#f9fafb` | `#0f172a` |
| `card` | `#ffffff` | `#1e293b` |
| `text` | `#111827` | `#f1f5f9` |
| `textSecondary` | `#6b7280` | `#94a3b8` |
| `textMuted` | `#9ca3af` | `#64748b` |
| `border` | `#f3f4f6` | `#1e293b` |
| `borderStrong` | `#e5e7eb` | `#334155` |
| `inputBorder` | `#e5e7eb` | `#334155` |
| `toggleBg` | `#f3f4f6` | `#1e293b` |
| `accent` | `#22c55e` | `#22c55e` |

## Accessing Colors in a Component

```typescript
// Inside a component:
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
      backgroundColor: colors.card,
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
    // ...
  }), [colors]);
}
```

Call it at the top of the component: `const styles = useStyles(colors);`

## Entry Type Accent Colors
These are not in `AppColors` — they are hardcoded per entry type:

| Type | Color | Usage |
|---|---|---|
| Income | `#22c55e` | Green |
| Expense | `#ef4444` | Red |
| Profit Distribution | `#a855f7` | Purple |

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
