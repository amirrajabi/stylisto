import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Palette } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
  predefinedColors?: string[];
}

// Default color palette
const DEFAULT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#808080', // Gray
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#FFC0CB', // Pink
  '#A52A2A', // Brown
  '#000080', // Navy
  '#008000', // Dark Green
  '#800000', // Maroon
];

// Color name mapping
const COLOR_NAMES: Record<string, string> = {
  '#000000': 'Black',
  '#FFFFFF': 'White',
  '#808080': 'Gray',
  '#FF0000': 'Red',
  '#00FF00': 'Green',
  '#0000FF': 'Blue',
  '#FFFF00': 'Yellow',
  '#FF00FF': 'Magenta',
  '#00FFFF': 'Cyan',
  '#FFA500': 'Orange',
  '#800080': 'Purple',
  '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown',
  '#000080': 'Navy',
  '#008000': 'Dark Green',
  '#800000': 'Maroon',
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onColorChange,
  predefinedColors = DEFAULT_COLORS,
}) => {
  const [inputValue, setInputValue] = useState(color);
  
  // Handle input change
  const handleInputChange = (text: string) => {
    setInputValue(text);
    
    // If input is a valid color name or hex code, update the color
    if (text.startsWith('#') && /^#([0-9A-F]{3}){1,2}$/i.test(text)) {
      onColorChange(text);
    } else {
      // Check if it's a known color name
      const hexCode = Object.entries(COLOR_NAMES).find(
        ([_, name]) => name.toLowerCase() === text.toLowerCase()
      )?.[0];
      
      if (hexCode) {
        onColorChange(hexCode);
      }
    }
  };
  
  // Get color name from hex
  const getColorName = (hexCode: string): string => {
    return COLOR_NAMES[hexCode.toUpperCase()] || hexCode;
  };
  
  // Handle color selection
  const handleColorSelect = (selectedColor: string) => {
    onColorChange(selectedColor);
    setInputValue(getColorName(selectedColor));
  };
  
  // Handle input blur
  const handleInputBlur = () => {
    // Reset input to current color if invalid
    if (color !== inputValue) {
      setInputValue(getColorName(color));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Palette size={18} color={Colors.text.primary} />
          <Text style={styles.title}>Color</Text>
        </View>
      </View>
      
      <View style={styles.colorInputContainer}>
        <TextInput
          style={styles.colorInput}
          value={inputValue}
          onChangeText={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="Enter color name or hex code"
          placeholderTextColor={Colors.text.tertiary}
        />
        <View 
          style={[
            styles.colorPreview, 
            { backgroundColor: color },
            color.toLowerCase() === '#ffffff' && styles.whiteColorPreview,
          ]} 
        />
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.colorPalette}
      >
        {predefinedColors.map((colorOption) => (
          <TouchableOpacity
            key={colorOption}
            style={[
              styles.colorOption,
              { backgroundColor: colorOption },
              colorOption.toLowerCase() === '#ffffff' && styles.whiteColorOption,
              color === colorOption && styles.selectedColorOption,
            ]}
            onPress={() => handleColorSelect(colorOption)}
          />
        ))}
      </ScrollView>
      
      <View style={styles.colorNamesContainer}>
        <Text style={styles.colorNamesTitle}>Common Colors:</Text>
        <View style={styles.colorNames}>
          {Object.entries(COLOR_NAMES).slice(0, 8).map(([hex, name]) => (
            <TouchableOpacity
              key={hex}
              style={styles.colorNameButton}
              onPress={() => handleColorSelect(hex)}
            >
              <Text style={[
                styles.colorNameText,
                color === hex && styles.selectedColorNameText,
              ]}>
                {name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  colorInput: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  whiteColorPreview: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  colorPalette: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  whiteColorOption: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: Colors.primary[700],
  },
  colorNamesContainer: {
    marginTop: Spacing.md,
  },
  colorNamesTitle: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  colorNames: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorNameButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  colorNameText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
  },
  selectedColorNameText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
});