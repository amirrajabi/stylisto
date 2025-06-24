# Stylisto Design System Documentation

## Overview

The Stylisto design system provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces. It includes a complete color palette, typography system, spacing guidelines, and reusable components.

## Accessibility Standards

All components in this design system meet WCAG 2.1 AA accessibility standards:

- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Touch Targets**: Minimum 44px for interactive elements
- **Screen Reader Support**: Proper accessibility labels and roles
- **Keyboard Navigation**: Full keyboard accessibility support

## Color System

### Primary Colors
- **Primary 700**: `#2D3748` - Main brand color
- **Secondary 400**: `#4299E1` - Secondary brand color

### Semantic Colors
- **Success**: Green palette for positive actions
- **Warning**: Yellow/Orange palette for cautions
- **Error**: Red palette for errors and destructive actions
- **Info**: Blue palette for informational content

### Usage Guidelines
```typescript
import { Colors } from '../constants/Colors';

// Use semantic colors for consistent meaning
backgroundColor: Colors.success[500] // For success states
backgroundColor: Colors.error[500]   // For error states
```

## Typography

### Font Families
- **iOS**: SF Pro Display/Text (system fonts)
- **Android**: Roboto (system font)
- **Web**: Inter (fallback)

### Type Scale
- Display: 60px, 48px, 36px
- Headings: 30px, 24px, 20px, 18px, 16px, 14px
- Body: 18px, 16px, 14px
- Captions: 14px, 12px, 10px

### Usage
```typescript
import { H1, BodyMedium } from '../components/ui';

<H1>Main Heading</H1>
<BodyMedium>Body text content</BodyMedium>
```

## Spacing System

Based on an 8px grid system:
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 40px
- **3xl**: 48px
- **4xl**: 64px

### Usage
```typescript
import { Spacing } from '../constants/Spacing';

marginTop: Spacing.md,     // 16px
paddingHorizontal: Spacing.lg, // 24px
```

## Components

### Button
Comprehensive button component with multiple variants:
- **Variants**: primary, secondary, outline, ghost, destructive
- **Sizes**: small, medium, large
- **States**: default, disabled, loading

```typescript
<Button
  title="Primary Action"
  variant="primary"
  size="medium"
  onPress={handlePress}
/>
```

### Input
Accessible input component with validation:
- **Variants**: default, filled, outline
- **States**: default, focused, error, success, disabled
- **Features**: labels, helper text, icons

```typescript
<Input
  label="Email Address"
  placeholder="Enter your email"
  variant="outline"
  required
  error={hasError}
  errorText="Please enter a valid email"
/>
```

### Card
Flexible container component:
- **Variants**: default, elevated, outlined, filled
- **Interactive**: Optional onPress for touchable cards

```typescript
<Card variant="elevated" onPress={handleCardPress}>
  <H3>Card Title</H3>
  <BodyMedium>Card content goes here</BodyMedium>
</Card>
```

### Modal
Accessible modal with backdrop and animations:
- **Sizes**: small, medium, large, fullscreen
- **Positions**: center, bottom, top
- **Features**: dismissible, close button, header

```typescript
<Modal
  visible={isVisible}
  title="Modal Title"
  size="medium"
  onClose={handleClose}
>
  <BodyMedium>Modal content</BodyMedium>
</Modal>
```

## Testing Strategy

### Visual Testing
1. **Cross-Platform**: Test on iOS, Android, and Web
2. **Device Sizes**: Test on various screen sizes and orientations
3. **Dark Mode**: Verify appearance in both light and dark themes

### Accessibility Testing
1. **Screen Readers**: Test with VoiceOver (iOS) and TalkBack (Android)
2. **Color Contrast**: Use tools like WebAIM Contrast Checker
3. **Touch Targets**: Verify minimum 44px touch areas
4. **Keyboard Navigation**: Test tab order and focus management

### Automated Testing
```typescript
// Example accessibility test
import { render } from '@testing-library/react-native';
import { Button } from '../components/ui';

test('Button has proper accessibility attributes', () => {
  const { getByRole } = render(
    <Button title="Test Button" onPress={() => {}} />
  );
  
  const button = getByRole('button');
  expect(button).toHaveAccessibilityState({ disabled: false });
  expect(button).toHaveAccessibilityLabel('Test Button');
});
```

## Implementation Guidelines

### Component Development
1. **Consistency**: Use design system tokens for all styling
2. **Accessibility**: Include proper ARIA attributes and roles
3. **Performance**: Optimize for smooth animations and interactions
4. **Documentation**: Document props and usage examples

### Color Usage
1. **Semantic Meaning**: Use semantic colors consistently
2. **Contrast**: Always check color contrast ratios
3. **Dark Mode**: Provide appropriate dark mode variants

### Typography
1. **Hierarchy**: Use consistent type scale for information hierarchy
2. **Readability**: Ensure proper line height and spacing
3. **Platform**: Leverage system fonts for native feel

### Spacing
1. **Grid System**: Stick to 8px grid for consistency
2. **Touch Targets**: Maintain minimum 44px for interactive elements
3. **Breathing Room**: Use adequate spacing for readability

## Migration Guide

When updating existing components to use the design system:

1. **Replace hardcoded colors** with design system tokens
2. **Update typography** to use system components
3. **Standardize spacing** using the spacing scale
4. **Add accessibility attributes** where missing
5. **Test thoroughly** across platforms and screen sizes

## Future Enhancements

- **Animation System**: Consistent motion and transitions
- **Icon Library**: Standardized icon set with proper sizing
- **Form Components**: Additional form controls (checkbox, radio, select)
- **Data Display**: Tables, lists, and data visualization components
- **Navigation**: Standardized navigation patterns and components