# Status Bar Management Guide

This guide explains how to properly manage the status bar appearance across the Stylisto app using Expo packages.

## Overview

The app uses a combination of `expo-status-bar` and `expo-system-ui` to provide consistent status bar behavior across all platforms, with special attention to iOS compatibility.

## Configuration

### App Configuration (`app.config.js`)

```javascript
{
  ios: {
    infoPlist: {
      UIViewControllerBasedStatusBarAppearance: false,
    },
  },
  plugins: [
    'expo-system-ui', // Added for enhanced status bar control
    // ... other plugins
  ],
}
```

**Important**: `UIViewControllerBasedStatusBarAppearance` is set to `false` to prevent conflicts between React Navigation Screens and expo-status-bar.

## Custom Hook Usage

### `useStatusBar` Hook

A custom hook that provides consistent status bar configuration:

```typescript
import { useStatusBarForScreen } from '../hooks/useStatusBar';

// For different screen types
const statusBarConfig = useStatusBarForScreen('dark'); // 'light' | 'dark' | 'camera' | 'modal'
```

### Screen-Specific Configurations

#### Dark Theme Screens (Default)

- Style: `light` (white content)
- Background: `#1a1a1a`
- Translucent: `true`

#### Light Theme Screens

- Style: `dark` (dark content)
- Background: `#ffffff`
- Translucent: `true`

#### Camera Screens

- Style: `light` (white content)
- Background: `#000000`
- Translucent: `false`

#### Modal Screens

- Style: `dark` (dark content)
- Background: `#ffffff`
- Translucent: `false`

## Implementation Examples

### Root Layout (`app/_layout.tsx`)

```tsx
import { useStatusBarForScreen } from '../hooks/useStatusBar';

export default function RootLayout() {
  const statusBarConfig = useStatusBarForScreen('dark');

  return (
    <GestureHandlerRootView>
      {/* Navigation Stack */}
      <StatusBar
        style={statusBarConfig.style}
        backgroundColor={statusBarConfig.backgroundColor}
        translucent={statusBarConfig.translucent}
        hidden={statusBarConfig.hidden}
      />
    </GestureHandlerRootView>
  );
}
```

### Camera Screen (`app/camera.tsx`)

```tsx
import { useStatusBarForScreen } from '../hooks/useStatusBar';

export default function CameraScreen() {
  const statusBarConfig = useStatusBarForScreen('camera');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        style={statusBarConfig.style}
        backgroundColor={statusBarConfig.backgroundColor}
        translucent={statusBarConfig.translucent}
        hidden={statusBarConfig.hidden}
      />
      {/* Camera content */}
    </SafeAreaView>
  );
}
```

## Platform-Specific Behavior

### iOS

- Uses `expo-status-bar` for style management
- `expo-system-ui` handles background colors
- `UIViewControllerBasedStatusBarAppearance: false` prevents conflicts

### Android

- Uses `expo-system-ui` for background color changes
- Status bar style is controlled by `expo-status-bar`
- Edge-to-edge mode is enabled in app config

### Web

- Status bar settings are ignored on web
- No additional configuration needed

## Best Practices

1. **Always use the custom hook**: Don't manually configure status bar props
2. **Choose appropriate screen types**: Use the predefined screen types for consistency
3. **Test on both platforms**: Status bar behavior can vary between iOS and Android
4. **Handle safe areas**: Use `SafeAreaView` appropriately with translucent status bars

## Troubleshooting

### Common Issues

1. **Status bar not changing**: Ensure `UIViewControllerBasedStatusBarAppearance` is `false`
2. **Conflicts with React Navigation**: Use the custom hook instead of navigation options
3. **Android color not updating**: Check if `expo-system-ui` plugin is added to app config

### Debugging

- Check if the status bar plugin is correctly added to `app.config.js`
- Verify that the custom hook is being used correctly
- Test on physical devices, as emulators may not reflect actual behavior

## Migration Notes

If migrating from direct `StatusBar` usage:

1. Replace direct `StatusBar` imports with the custom hook
2. Remove status bar options from navigation screen options
3. Use `useStatusBarForScreen` with appropriate screen type
4. Test thoroughly on both platforms
