import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface AttributeSelectorProps {
  title: string;
  icon: React.ReactNode;
  options: string[];
  selectedOptions: string[];
  onToggleOption: (option: string) => void;
  getOptionColor?: (option: string, opacity?: number) => string;
}

export const AttributeSelector: React.FC<AttributeSelectorProps> = ({
  title,
  icon,
  options,
  selectedOptions,
  onToggleOption,
  getOptionColor,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {icon}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.optionsContainer}
      >
        {options.map((option) => {
          const isSelected = selectedOptions.includes(option);
          const backgroundColor = getOptionColor 
            ? getOptionColor(option, isSelected ? 0.4 : 0.2)
            : isSelected 
              ? Colors.primary[100] 
              : Colors.surface.secondary;
          
          const textColor = getOptionColor
            ? getOptionColor(option)
            : isSelected
              ? Colors.primary[700]
              : Colors.text.primary;
          
          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                { backgroundColor },
                isSelected && styles.selectedOptionButton,
                isSelected && !getOptionColor && { backgroundColor: Colors.primary[100] },
              ]}
              onPress={() => onToggleOption(option)}
            >
              <Text style={[
                styles.optionButtonText,
                { color: textColor },
                isSelected && styles.selectedOptionButtonText,
                isSelected && !getOptionColor && { color: Colors.primary[700] },
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
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
  optionsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedOptionButton: {
    borderColor: Colors.primary[700],
  },
  optionButtonText: {
    ...Typography.caption.medium,
    textTransform: 'capitalize',
  },
  selectedOptionButtonText: {
    fontWeight: '600',
  },
});