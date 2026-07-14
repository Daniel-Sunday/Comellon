---
name: react-native-safe-area-context
description: Guidelines and code patterns for using react-native-safe-area-context in React Native and Expo Router applications.
---
# React Native Safe Area Context Customization Skill

This skill provides best practices and usage patterns for `react-native-safe-area-context` in this project.

## Core Concepts

1. **SafeAreaProvider**:
   * Wrap the root structure of the app (e.g. inside `_layout.tsx`) in a `<SafeAreaProvider>`.
   * Only define one provider at the root level.

2. **SafeAreaView Component**:
   * Use `<SafeAreaView>` from `react-native-safe-area-context` instead of the default React Native `SafeAreaView` (which is buggy and doesn't handle Android or landscape correctly).
   * Style it with `flex: 1` if it is a container.

3. **useSafeAreaInsets Hook**:
   * For complex layouts where views should align with the screen edges but need padding or margins based on notches/status bars, use the `useSafeAreaInsets` hook.
   * Destructure values: `const insets = useSafeAreaInsets();`
   * Apply dynamically: `style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}`

## Common Code Patterns

### Standard Component Wrapping
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
      {/* Content */}
    </SafeAreaView>
  );
}
```

### Custom Insets Mapping (Hook)
```tsx
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

export default function CustomPaddingScreen() {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
      {/* Content */}
    </View>
  );
}
```
