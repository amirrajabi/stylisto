import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibilityProvider, useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibilitySettings } from '../../components/ui/AccessibilitySettings';
import { calculateContrastRatio } from '../../utils/accessibilityUtils';

// Test component that uses the accessibility context
const TestComponent = () => {
  const { isHighContrastEnabled, colors } = useAccessibility();
  return (
    <>
      <Text style={{ color: colors.text.primary, backgroundColor: colors.background.primary }}>
        High Contrast: {isHighContrastEnabled ? 'On' : 'Off'}
      </Text>
      <Text style={{ color: colors.text.secondary, backgroundColor: colors.background.primary }}>
        Secondary Text
      </Text>
    </>
  );
};

// Import Text component
import { Text } from 'react-native';

describe('High Contrast Mode Tests', () => {
  // Test high contrast toggle
  test('high contrast mode can be toggled', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Initial high contrast should be off
    expect(getByText('High Contrast: Off')).toBeTruthy();
    
    // Toggle high contrast
    const highContrastSwitch = getByText('High Contrast Mode').parent?.parent;
    fireEvent(highContrastSwitch, 'valueChange', true);
    
    // High contrast should be on
    expect(getByText('High Contrast: On')).toBeTruthy();
  });
  
  // Test contrast ratios in high contrast mode
  test('high contrast mode improves contrast ratios', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Get initial colors
    const normalTextElement = getByText('High Contrast: Off');
    const normalSecondaryTextElement = getByText('Secondary Text');
    
    const normalTextColor = normalTextElement.props.style.color;
    const normalSecondaryTextColor = normalSecondaryTextElement.props.style.color;
    const normalBackgroundColor = normalTextElement.props.style.backgroundColor;
    
    // Calculate initial contrast ratios
    const normalContrastRatio = calculateContrastRatio(normalTextColor, normalBackgroundColor);
    const normalSecondaryContrastRatio = calculateContrastRatio(normalSecondaryTextColor, normalBackgroundColor);
    
    // Toggle high contrast
    const highContrastSwitch = getByText('High Contrast Mode').parent?.parent;
    fireEvent(highContrastSwitch, 'valueChange', true);
    
    // Get high contrast colors
    const highContrastTextElement = getByText('High Contrast: On');
    const highContrastSecondaryTextElement = getByText('Secondary Text');
    
    const highContrastTextColor = highContrastTextElement.props.style.color;
    const highContrastSecondaryTextColor = highContrastSecondaryTextElement.props.style.color;
    const highContrastBackgroundColor = highContrastTextElement.props.style.backgroundColor;
    
    // Calculate high contrast ratios
    const highContrastRatio = calculateContrastRatio(highContrastTextColor, highContrastBackgroundColor);
    const highContrastSecondaryRatio = calculateContrastRatio(highContrastSecondaryTextColor, highContrastBackgroundColor);
    
    // High contrast mode should improve contrast ratios
    expect(highContrastRatio).toBeGreaterThanOrEqual(normalContrastRatio);
    expect(highContrastSecondaryRatio).toBeGreaterThanOrEqual(normalSecondaryContrastRatio);
    
    // High contrast mode should meet WCAG AA requirements (4.5:1)
    expect(highContrastRatio).toBeGreaterThanOrEqual(4.5);
    expect(highContrastSecondaryRatio).toBeGreaterThanOrEqual(4.5);
  });
});