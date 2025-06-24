import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibilityProvider, useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibilitySettings } from '../../components/ui/AccessibilitySettings';
import { AccessibleButton } from '../../components/ui/AccessibleButton';

// Test component that uses the accessibility context
const TestComponent = () => {
  const { isReducedMotionEnabled } = useAccessibility();
  return (
    <AccessibleButton
      title="Test Button"
      onPress={() => {}}
      testID="test-button"
    />
  );
};

describe('Reduced Motion Tests', () => {
  // Test reduced motion toggle
  test('reduced motion mode can be toggled', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Toggle reduced motion
    const reducedMotionSwitch = getByText('Reduced Motion').parent?.parent;
    
    // Initial state should be off
    expect(reducedMotionSwitch.props.accessibilityState.checked).toBe(false);
    
    // Toggle on
    fireEvent(reducedMotionSwitch, 'valueChange', true);
    
    // Should be on
    expect(reducedMotionSwitch.props.accessibilityState.checked).toBe(true);
  });
  
  // Test button animation behavior with reduced motion
  test('buttons respect reduced motion setting', () => {
    const { getByTestId, getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    const button = getByTestId('test-button');
    
    // Get initial style
    const initialStyle = button.props.style;
    
    // Toggle reduced motion on
    const reducedMotionSwitch = getByText('Reduced Motion').parent?.parent;
    fireEvent(reducedMotionSwitch, 'valueChange', true);
    
    // Press the button
    fireEvent(button, 'pressIn');
    
    // With reduced motion, the button should not have scale animation
    const pressedStyle = button.props.style;
    
    // The style should not include a scale transform when reduced motion is enabled
    expect(pressedStyle).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          transform: expect.arrayContaining([
            expect.objectContaining({ scale: expect.any(Number) })
          ])
        })
      ])
    );
  });
});