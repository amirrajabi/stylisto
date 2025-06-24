import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleButton } from '../../components/ui/AccessibleButton';
import { AccessibleInput } from '../../components/ui/AccessibleInput';
import { AccessibilityProvider } from '../../components/ui/AccessibilityProvider';

// Wrap components with AccessibilityProvider for testing
const renderWithProvider = (ui: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {ui}
    </AccessibilityProvider>
  );
};

describe('Screen Reader Accessibility Tests', () => {
  // Test accessible button
  test('AccessibleButton has proper accessibility attributes', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProvider(
      <AccessibleButton 
        title="Test Button" 
        onPress={onPress}
        accessibilityHint="This is a test button"
      />
    );
    
    const button = getByRole('button');
    
    // Check accessibility properties
    expect(button.props.accessibilityLabel).toBe('Test Button');
    expect(button.props.accessibilityHint).toBe('This is a test button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityState).toEqual({ disabled: false, busy: false });
    
    // Test interaction
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalled();
  });
  
  // Test disabled button
  test('Disabled button has correct accessibility state', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithProvider(
      <AccessibleButton 
        title="Disabled Button" 
        onPress={onPress}
        disabled={true}
      />
    );
    
    const button = getByRole('button');
    
    // Check accessibility state
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: false });
    
    // Test interaction (should not trigger onPress)
    fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
  
  // Test loading button
  test('Loading button has correct accessibility state', () => {
    const { getByRole } = renderWithProvider(
      <AccessibleButton 
        title="Loading Button" 
        onPress={() => {}}
        loading={true}
      />
    );
    
    const button = getByRole('button');
    
    // Check accessibility state
    expect(button.props.accessibilityState).toEqual({ disabled: true, busy: true });
  });
  
  // Test accessible input
  test('AccessibleInput has proper accessibility attributes', () => {
    const { getByLabelText } = renderWithProvider(
      <AccessibleInput 
        label="Email Address"
        placeholder="Enter your email"
        helperText="We'll never share your email"
        required={true}
      />
    );
    
    const input = getByLabelText('Email Address, required');
    
    // Check accessibility properties
    expect(input.props.accessibilityHint).toBe("We'll never share your email");
    expect(input.props.accessibilityState).toEqual({ 
      disabled: false, 
      required: true,
      invalid: false
    });
  });
  
  // Test input with error
  test('Input with error has correct accessibility attributes', () => {
    const { getByLabelText, getByText } = renderWithProvider(
      <AccessibleInput 
        label="Password"
        placeholder="Enter password"
        error="Password is too short"
        secureTextEntry={true}
      />
    );
    
    const input = getByLabelText('Password');
    
    // Check accessibility state
    expect(input.props.accessibilityState).toEqual({ 
      disabled: false, 
      required: false,
      invalid: true
    });
    
    // Check error message is accessible
    const errorMessage = getByText('Password is too short');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.props.accessibilityLabel).toBe('Error: Password is too short');
  });
  
  // Test password toggle
  test('Password toggle button has proper accessibility', () => {
    const { getByLabelText } = renderWithProvider(
      <AccessibleInput 
        label="Password"
        placeholder="Enter password"
        secureTextEntry={true}
        showPasswordToggle={true}
      />
    );
    
    const toggleButton = getByLabelText('Show password');
    expect(toggleButton).toBeTruthy();
    expect(toggleButton.props.accessibilityRole).toBe('button');
    
    // Test toggle functionality
    fireEvent.press(toggleButton);
    
    // After toggle, the button should change its label
    const updatedToggleButton = getByLabelText('Hide password');
    expect(updatedToggleButton).toBeTruthy();
  });
});