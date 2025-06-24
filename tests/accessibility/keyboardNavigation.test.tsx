import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { AccessibleButton } from '../../components/ui/AccessibleButton';
import { AccessibleInput } from '../../components/ui/AccessibleInput';
import { FocusTrap } from '../../components/ui/FocusTrap';
import { AccessibilityProvider } from '../../components/ui/AccessibilityProvider';

// Mock Platform.OS to test web-specific behavior
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'web',
  select: jest.fn((obj) => obj.web),
}));

// Wrap components with AccessibilityProvider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {ui}
    </AccessibilityProvider>
  );
};

describe('Keyboard Navigation Tests', () => {
  // Only run these tests in web environment
  if (Platform.OS === 'web') {
    // Test tab navigation
    test('Components can be focused with tab key', () => {
      const { getByTestId } = renderWithProvider(
        <>
          <AccessibleButton 
            title="First Button" 
            onPress={() => {}}
            testID="button1"
          />
          <AccessibleInput 
            label="Test Input"
            testID="input1"
          />
          <AccessibleButton 
            title="Second Button" 
            onPress={() => {}}
            testID="button2"
          />
        </>
      );
      
      const button1 = getByTestId('button1');
      const input = getByTestId('input1');
      const button2 = getByTestId('button2');
      
      // Check tabIndex
      expect(button1.props.tabIndex).toBe(0);
      expect(input.props.tabIndex).toBe(0);
      expect(button2.props.tabIndex).toBe(0);
      
      // Simulate tab navigation
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      // Tab to next element
      fireEvent.keyDown(button1, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(input);
      
      // Tab to next element
      fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(button2);
    });
    
    // Test disabled elements are skipped in tab order
    test('Disabled elements are skipped in tab order', () => {
      const { getByTestId } = renderWithProvider(
        <>
          <AccessibleButton 
            title="First Button" 
            onPress={() => {}}
            testID="button1"
          />
          <AccessibleButton 
            title="Disabled Button" 
            onPress={() => {}}
            disabled={true}
            testID="buttonDisabled"
          />
          <AccessibleButton 
            title="Second Button" 
            onPress={() => {}}
            testID="button2"
          />
        </>
      );
      
      const button1 = getByTestId('button1');
      const buttonDisabled = getByTestId('buttonDisabled');
      const button2 = getByTestId('button2');
      
      // Check tabIndex
      expect(button1.props.tabIndex).toBe(0);
      expect(buttonDisabled.props.tabIndex).toBe(-1);
      expect(button2.props.tabIndex).toBe(0);
      
      // Simulate tab navigation
      button1.focus();
      expect(document.activeElement).toBe(button1);
      
      // Tab should skip disabled button
      fireEvent.keyDown(button1, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(button2);
    });
    
    // Test focus trap
    test('FocusTrap keeps focus within container', () => {
      const { getByTestId } = renderWithProvider(
        <FocusTrap testID="focusTrap">
          <AccessibleButton 
            title="First Button" 
            onPress={() => {}}
            testID="button1"
          />
          <AccessibleInput 
            label="Test Input"
            testID="input1"
          />
          <AccessibleButton 
            title="Last Button" 
            onPress={() => {}}
            testID="button2"
          />
        </FocusTrap>
      );
      
      const button1 = getByTestId('button1');
      const button2 = getByTestId('button2');
      
      // Focus last element
      button2.focus();
      expect(document.activeElement).toBe(button2);
      
      // Tab should wrap to first element
      fireEvent.keyDown(button2, { key: 'Tab', code: 'Tab' });
      expect(document.activeElement).toBe(button1);
      
      // Shift+Tab from first element should go to last element
      fireEvent.keyDown(button1, { key: 'Tab', code: 'Tab', shiftKey: true });
      expect(document.activeElement).toBe(button2);
    });
    
    // Test keyboard activation
    test('Buttons can be activated with Enter and Space keys', () => {
      const onPress = jest.fn();
      const { getByTestId } = renderWithProvider(
        <AccessibleButton 
          title="Test Button" 
          onPress={onPress}
          testID="button"
        />
      );
      
      const button = getByTestId('button');
      
      // Focus the button
      button.focus();
      
      // Press Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      expect(onPress).toHaveBeenCalledTimes(1);
      
      // Press Space key
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      expect(onPress).toHaveBeenCalledTimes(2);
    });
  }
});