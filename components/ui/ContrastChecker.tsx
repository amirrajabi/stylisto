import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface ContrastCheckerProps {
  foregroundColor: string;
  backgroundColor: string;
  fontSize?: number;
  isBold?: boolean;
}

export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  foregroundColor,
  backgroundColor,
  fontSize = 16,
  isBold = false,
}) => {
  // Calculate contrast ratio
  const contrastRatio = calculateContrastRatio(foregroundColor, backgroundColor);
  
  // Determine if the contrast meets WCAG standards
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
  const meetsAA = isLargeText ? contrastRatio >= 3 : contrastRatio >= 4.5;
  const meetsAAA = isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7;
  
  return (
    <View style={styles.container}>
      <View style={[styles.sampleContainer, { backgroundColor }]}>
        <Text style={[
          styles.sampleText, 
          { 
            color: foregroundColor,
            fontSize,
            fontWeight: isBold ? 'bold' : 'normal',
          }
        ]}>
          Sample Text
        </Text>
      </View>
      
      <View style={styles.resultsContainer}>
        <Text style={styles.contrastRatio}>
          Contrast Ratio: {contrastRatio.toFixed(2)}:1
        </Text>
        
        <View style={styles.complianceContainer}>
          <Text style={[
            styles.complianceText,
            { color: meetsAA ? '#22c55e' : '#ef4444' }
          ]}>
            WCAG AA: {meetsAA ? 'Pass ✓' : 'Fail ✗'}
          </Text>
          
          <Text style={[
            styles.complianceText,
            { color: meetsAAA ? '#22c55e' : '#ef4444' }
          ]}>
            WCAG AAA: {meetsAAA ? 'Pass ✓' : 'Fail ✗'}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Helper function to calculate relative luminance
const getLuminance = (color: string): number => {
  // Remove # if present
  color = color.replace('#', '');
  
  // Convert to RGB
  let r, g, b;
  if (color.length === 3) {
    r = parseInt(color.charAt(0) + color.charAt(0), 16) / 255;
    g = parseInt(color.charAt(1) + color.charAt(1), 16) / 255;
    b = parseInt(color.charAt(2) + color.charAt(2), 16) / 255;
  } else {
    r = parseInt(color.substring(0, 2), 16) / 255;
    g = parseInt(color.substring(2, 4), 16) / 255;
    b = parseInt(color.substring(4, 6), 16) / 255;
  }
  
  // Convert RGB to luminance
  r = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  g = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  b = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Calculate contrast ratio
const calculateContrastRatio = (foreground: string, background: string): number => {
  const foregroundLuminance = getLuminance(foreground);
  const backgroundLuminance = getLuminance(background);
  
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 10,
  },
  sampleContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleText: {
    textAlign: 'center',
  },
  resultsContainer: {
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  contrastRatio: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  complianceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  complianceText: {
    fontSize: 14,
  },
});