---
name: conventions
description: Code patterns, naming rules, and style conventions used throughout the project
type: reference
---

# Code Conventions

## Styling — The `useStyles` Pattern
Every component that needs styles defines them in a memoised function at the bottom of the file:

```typescript
function useStyles(colors: AppColors) {
  return useMemo(() => StyleSheet.create({
    // styles here
  }), [colors]);
}
```

Called at the top of the component: `const styles = useStyles(colors);`
Never create styles inline in JSX. Never use `StyleSheet.create` outside a `useMemo`.

## Color Access
```typescript
const colors = useAppColors();          // theme colors only
const { colors, amountsVisible } = useAppSettings();  // when you need other settings too
```

Never hardcode `#ffffff` / `#000000` or similar. Always use `colors.card`, `colors.text`, etc.
Exception: entry type accent colors (`#22c55e`, `#ef4444`, `#a855f7`) are hardcoded by convention.

## Database Operations
- Always `await` DB calls
- DB functions are in `lib/database.ts` — never write raw SQL in components or screens
- New schema columns: add `ALTER TABLE` migration in `initSchema()` with `try/catch`
- Backup compatibility: always use `?? ''` fallback when reading new columns from backup JSON

## i18n — Translations
- Always use `t('key')` — never hardcode user-facing strings
- Add keys to **both** `en` and `el` objects in `lib/i18n.ts` at the same time
- Brand names (OpenAI, Claude Code, Apple Developer, etc.) stay in English in both languages

## Component Structure Order
1. Imports
2. Types / interfaces
3. Default export (main component)
4. Sub-components
5. `useStyles` function at the bottom

## TypeScript
- Use `type` for unions and aliases, `interface` for object shapes
- Always type function parameters — avoid `any`
- Export only what other files need

## Alerts
Use the same two-alert patterns throughout:
```typescript
// Validation error
Alert.alert(t('add.invalidAmountTitle'), t('add.invalidAmountMsg'));

// Success
Alert.alert(t('add.savedTitle'), t('add.savedMsg', { type: typeLabel }));

// Generic error
Alert.alert(t('common.errorTitle'), t('common.errorMsg'));

// Destructive confirmation (delete)
Alert.alert(title, msg, [
  { text: t('common.cancel'), style: 'cancel' },
  { text: t('common.delete'), style: 'destructive', onPress: onConfirm },
]);
```

## Amount Formatting
```typescript
// In entry lists / dashboard (respects amountsVisible):
import { formatEuro, MASKED } from '@/lib/calculations';
amountsVisible ? formatEuro(amount) : MASKED

// In chips / compact displays:
`€${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`

// Large numbers in explore screen:
formatEuroCompact(amount)  // → "€1.5k"
```

## Amount Input Parsing
```typescript
const parsed = parseFloat(amount.replace(',', '.'));
if (!amount || isNaN(parsed) || parsed <= 0) { /* show validation alert */ }
```

## Long Press / Haptics
Long press duration: **600ms** (`delayLongPress={600}`).
Always fire `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` before the action.
Provide visual feedback with `({ pressed }) => [styles.row, pressed && styles.rowPressed]` (opacity: 0.6).

## Saving State Pattern
```typescript
const [saving, setSaving] = useState(false);

const handleSave = async () => {
  // validate first
  setSaving(true);
  try {
    await dbOperation();
    // show success alert
    // clear fields / call callback
  } catch {
    Alert.alert(t('common.errorTitle'), t('common.errorMsg'));
  } finally {
    setSaving(false);
  }
};
```

## File Naming
- Screens: `kebab-case.tsx` inside `app/(tabs)/`
- Components: `PascalCase.tsx` inside `components/`
- Hooks: `use-kebab-case.ts` inside `hooks/`
- Lib modules: `kebab-case.ts` inside `lib/`

## Imports
Use `@/` path alias for everything from the project root:
```typescript
import { useAppColors } from '@/contexts/AppSettingsContext';
import { addIncome } from '@/lib/database';
import type { Income } from '@/lib/types';
```
