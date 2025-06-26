import { Filter } from 'lucide-react-native';
import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { Occasion } from '../../types/wardrobe';

interface QuickFiltersProps {
  onOccasionSelect: (occasion: Occasion) => void;
  onStyleSelect: (style: string) => void;
  onOpenAdvancedFilters: () => void;
  selectedOccasion?: Occasion | null;
  selectedStyle?: string | null;
}

const OCCASIONS = [
  { value: Occasion.CASUAL, label: 'Casual', emoji: '👕' },
  { value: Occasion.WORK, label: 'Work', emoji: '💼' },
  { value: Occasion.FORMAL, label: 'Formal', emoji: '🎩' },
  { value: Occasion.DATE, label: 'Date', emoji: '💕' },
  { value: Occasion.SPORT, label: 'Sport', emoji: '👟' },
  { value: Occasion.PARTY, label: 'Party', emoji: '🎉' },
];

const STYLES = [
  { value: 'minimalist', label: 'Minimalist', emoji: '⚪' },
  { value: 'classic', label: 'Classic', emoji: '📚' },
  { value: 'trendy', label: 'Trendy', emoji: '✨' },
  { value: 'edgy', label: 'Edgy', emoji: '🖤' },
  { value: 'romantic', label: 'Romantic', emoji: '🌸' },
  { value: 'sporty', label: 'Sporty', emoji: '⚡' },
];

export function QuickFilters({
  onOccasionSelect,
  onStyleSelect,
  onOpenAdvancedFilters,
  selectedOccasion,
  selectedStyle,
}: QuickFiltersProps) {
  const handleOccasionPress = useCallback(
    (occasion: Occasion) => {
      onOccasionSelect(occasion);
    },
    [onOccasionSelect]
  );

  const handleStylePress = useCallback(
    (style: string) => {
      onStyleSelect(style);
    },
    [onStyleSelect]
  );

  return (
    <View style={styles.container}>
      {/* Occasions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Occasion</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {OCCASIONS.map(occasion => (
            <TouchableOpacity
              key={occasion.value}
              style={[
                styles.filterChip,
                selectedOccasion === occasion.value && styles.selectedChip,
              ]}
              onPress={() => handleOccasionPress(occasion.value)}
            >
              <Text style={styles.emoji}>{occasion.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  selectedOccasion === occasion.value &&
                    styles.selectedChipText,
                ]}
              >
                {occasion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Styles */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {STYLES.map(style => (
            <TouchableOpacity
              key={style.value}
              style={[
                styles.filterChip,
                selectedStyle === style.value && styles.selectedChip,
              ]}
              onPress={() => handleStylePress(style.value)}
            >
              <Text style={styles.emoji}>{style.emoji}</Text>
              <Text
                style={[
                  styles.chipText,
                  selectedStyle === style.value && styles.selectedChipText,
                ]}
              >
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Advanced Filters Button */}
      <TouchableOpacity
        style={styles.advancedButton}
        onPress={onOpenAdvancedFilters}
      >
        <Filter size={16} color={Colors.primary[500]} />
        <Text style={styles.advancedButtonText}>More Filters</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    paddingVertical: Spacing.md,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginHorizontal: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  selectedChip: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[500],
  },
  emoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  chipText: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  selectedChipText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  advancedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  advancedButtonText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
});
