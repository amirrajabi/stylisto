import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibilityProvider, useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibleText } from '../../components/ui/AccessibleText';
import { AccessibilitySettings } from '../../components/ui/AccessibilitySettings';

// Test component that uses the accessibility context
const TestComponent = () => {
  const { fontScale } = useAccessibility();
  return (
    <AccessibleText variant="body" size="medium">
      Font Scale: {fontScale}
    </AccessibleText>
  );
};

describe('Dynamic Text Size Tests', () => {
  // Test font scaling
  test('font scale can be increased and decreased', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Initial font scale should be 1
    expect(getByText('Font Scale: 1')).toBeTruthy();
    
    // Increase font scale
    const increaseButton = getByText('Increase text size');
    fireEvent.press(increaseButton);
    
    // Font scale should be increased
    expect(getByText('Font Scale: 1.1')).toBeTruthy();
    
    // Decrease font scale
    const decreaseButton = getByText('Decrease text size');
    fireEvent.press(decreaseButton);
    
    // Font scale should be back to 1
    expect(getByText('Font Scale: 1')).toBeTruthy();
  });
  
  // Test font scale limits
  test('font scale respects min and max limits', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Initial font scale should be 1
    expect(getByText('Font Scale: 1')).toBeTruthy();
    
    // Try to decrease below minimum (0.8)
    const decreaseButton = getByText('Decrease text size');
    fireEvent.press(decreaseButton);
    fireEvent.press(decreaseButton);
    fireEvent.press(decreaseButton);
    
    // Font scale should be at minimum
    expect(getByText('Font Scale: 0.8')).toBeTruthy();
    
    // Try to increase above maximum (1.5)
    const increaseButton = getByText('Increase text size');
    for (let i = 0; i < 10; i++) {
      fireEvent.press(increaseButton);
    }
    
    // Font scale should be at maximum
    expect(getByText('Font Scale: 1.5')).toBeTruthy();
  });
  
  // Test font scale reset
  test('font scale can be reset', () => {
    const { getByText } = render(
      <AccessibilityProvider>
        <TestComponent />
        <AccessibilitySettings />
      </AccessibilityProvider>
    );
    
    // Increase font scale
    const increaseButton = getByText('Increase text size');
    fireEvent.press(increaseButton);
    fireEvent.press(increaseButton);
    
    // Font scale should be increased
    expect(getByText('Font Scale: 1.2')).toBeTruthy();
    
    // Reset font scale
    const resetButton = getByText('Reset text size');
    fireEvent.press(resetButton);
    
    // Font scale should be back to 1
    expect(getByText('Font Scale: 1')).toBeTruthy();
  });
  
  // Test text component with different font scales
  test('AccessibleText respects font scale', () => {
    const { getByText, rerender } = render(
      <AccessibilityProvider>
        <AccessibleText variant="body" size="medium" testID="test-text">
          Test Text
        </AccessibleText>
      </AccessibilityProvider>
    );
    
    const text = getByText('Test Text');
    const initialFontSize = text.props.style[0].fontSize;
    
    // Rerender with increased font scale
    rerender(
      <AccessibilityProvider>
        <AccessibleText variant="body" size="medium" testID="test-text" style={{ fontSize: initialFontSize * 1.5 }}>
          Test Text
        </AccessibleText>
      </AccessibilityProvider>
    );
    
    const updatedText = getByText('Test Text');
    const updatedFontSize = updatedText.props.style[0].fontSize;
    
    // Font size should be increased
    expect(updatedFontSize).toBeGreaterThan(initialFontSize);
  });
});