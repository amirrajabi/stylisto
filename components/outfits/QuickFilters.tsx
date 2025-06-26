import {
  Book,
  Briefcase,
  Circle,
  Coffee,
  Dumbbell,
  Filter,
  Flower2,
  Heart,
  Move,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react-native';
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
  {
    value: Occasion.CASUAL,
    label: 'Casual',
    icon: <Coffee size={16} color={Colors.primary[500]} />,
  },
  {
    value: Occasion.WORK,
    label: 'Work',
    icon: <Briefcase size={16} color={Colors.primary[500]} />,
  },
  {
    value: Occasion.FORMAL,
    label: 'Formal',
    icon: <ShoppingBag size={16} color={Colors.primary[500]} />,
  },
  {
    value: Occasion.DATE,
    label: 'Date',
    icon: <Heart size={16} color={Colors.primary[500]} />,
  },
  {
    value: Occasion.SPORT,
    label: 'Sport',
    icon: <Dumbbell size={16} color={Colors.primary[500]} />,
  },
  {
    value: Occasion.PARTY,
    label: 'Party',
    icon: <Sparkles size={16} color={Colors.primary[500]} />,
  },
];

const STYLES = [
  {
    value: 'minimalist',
    label: 'Minimalist',
    icon: <Circle size={16} color={Colors.primary[500]} />,
  },
  {
    value: 'classic',
    label: 'Classic',
    icon: <Book size={16} color={Colors.primary[500]} />,
  },
  {
    value: 'trendy',
    label: 'Trendy',
    icon: <TrendingUp size={16} color={Colors.primary[500]} />,
  },
  {
    value: 'edgy',
    label: 'Edgy',
    icon: <Zap size={16} color={Colors.primary[500]} />,
  },
  {
    value: 'romantic',
    label: 'Romantic',
    icon: <Flower2 size={16} color={Colors.primary[500]} />,
  },
  {
    value: 'sporty',
    label: 'Sporty',
    icon: <Move size={16} color={Colors.primary[500]} />,
  },
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
              <View style={styles.iconContainer}>
                {React.cloneElement(occasion.icon, {
                  color:
                    selectedOccasion === occasion.value
                      ? Colors.primary[700]
                      : Colors.primary[500],
                })}
              </View>
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
              <View style={styles.iconContainer}>
                {React.cloneElement(style.icon, {
                  color:
                    selectedStyle === style.value
                      ? Colors.primary[700]
                      : Colors.primary[500],
                })}
              </View>
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
  iconContainer: {
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
