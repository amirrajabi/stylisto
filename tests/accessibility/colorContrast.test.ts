import { calculateContrastRatio, meetsContrastRequirements } from '../../utils/accessibilityUtils';
import { Colors } from '../../constants/Colors';

describe('Color Contrast Tests', () => {
  // Test contrast ratio calculation
  test('calculates contrast ratio correctly', () => {
    // Black on white (should be 21:1)
    expect(calculateContrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    
    // White on black (should be 21:1)
    expect(calculateContrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 0);
    
    // Medium gray on white (should be around 4.5:1)
    expect(calculateContrastRatio('#767676', '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    
    // Light gray on white (should be less than 4.5:1)
    expect(calculateContrastRatio('#AAAAAA', '#FFFFFF')).toBeLessThan(4.5);
  });
  
  // Test WCAG compliance checks
  test('correctly determines WCAG AA compliance', () => {
    // Black on white - should pass AA for normal text
    expect(meetsContrastRequirements('#000000', '#FFFFFF', 'AA', false)).toBe(true);
    
    // Medium gray on white - should pass AA for normal text
    expect(meetsContrastRequirements('#767676', '#FFFFFF', 'AA', false)).toBe(true);
    
    // Light gray on white - should fail AA for normal text but pass for large text
    expect(meetsContrastRequirements('#AAAAAA', '#FFFFFF', 'AA', false)).toBe(false);
    expect(meetsContrastRequirements('#AAAAAA', '#FFFFFF', 'AA', true)).toBe(true);
  });
  
  // Test WCAG AAA compliance checks
  test('correctly determines WCAG AAA compliance', () => {
    // Black on white - should pass AAA for normal text
    expect(meetsContrastRequirements('#000000', '#FFFFFF', 'AAA', false)).toBe(true);
    
    // Medium gray on white - should fail AAA for normal text
    expect(meetsContrastRequirements('#767676', '#FFFFFF', 'AAA', false)).toBe(false);
    
    // Medium gray on white - should pass AAA for large text
    expect(meetsContrastRequirements('#767676', '#FFFFFF', 'AAA', true)).toBe(true);
  });
  
  // Test app color palette for compliance
  test('app primary colors meet WCAG AA requirements', () => {
    // Primary color on white
    expect(meetsContrastRequirements(Colors.primary[700], Colors.white)).toBe(true);
    
    // Primary color on black
    expect(meetsContrastRequirements(Colors.primary[700], Colors.black)).toBe(true);
    
    // Text colors on background
    expect(meetsContrastRequirements(Colors.text.primary, Colors.background.primary)).toBe(true);
    expect(meetsContrastRequirements(Colors.text.secondary, Colors.background.primary)).toBe(true);
  });
  
  // Test error states for compliance
  test('error states meet WCAG AA requirements', () => {
    // Error color on white
    expect(meetsContrastRequirements(Colors.error[600], Colors.white)).toBe(true);
    
    // White on error color
    expect(meetsContrastRequirements(Colors.white, Colors.error[600])).toBe(true);
  });
});