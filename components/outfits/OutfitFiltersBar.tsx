import { Filter, X } from 'lucide-react-native';
import React from 'react';
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
import { OutfitFilters } from './OutfitFiltersModal';

interface OutfitFiltersBarProps {
  filters: OutfitFilters;
  onOpenFilters: () => void;
  onClearFilter: (filterType: keyof OutfitFilters, value?: string) => void;
  onClearAllFilters: () => void;
}

const getOccasionLabel = (occasion: Occasion): string => {
  switch (occasion) {
    case Occasion.CASUAL:
      return 'Casual';
    case Occasion.WORK:
      return 'Work';
    case Occasion.FORMAL:
      return 'Formal';
    case Occasion.DATE:
      return 'Date';
    case Occasion.SPORT:
      return 'Sport';
    case Occasion.PARTY:
      return 'Party';
    default:
      return 'Unknown';
  }
};

const getStyleLabel = (style: string): string => {
  const labels: Record<string, string> = {
    minimalist: 'Minimalist',
    bohemian: 'Bohemian',
    classic: 'Classic',
    trendy: 'Trendy',
    edgy: 'Edgy',
    romantic: 'Romantic',
    sporty: 'Sporty',
    vintage: 'Vintage',
  };
  return labels[style] || style;
};

const getFormalityLabel = (formality: string): string => {
  const labels: Record<string, string> = {
    casual: 'Casual',
    'semi-formal': 'Semi-Formal',
    formal: 'Formal',
  };
  return labels[formality] || formality;
};

const getColorLabel = (color: string): string => {
  const labels: Record<string, string> = {
    neutrals: 'Neutrals',
    blues: 'Blues',
    greens: 'Greens',
    reds: 'Reds',
    blacks: 'Blacks',
    whites: 'Whites',
    pastels: 'Pastels',
    'earth-tones': 'Earth Tones',
  };
  return labels[color] || color;
};

export function OutfitFiltersBar({
  filters,
  onOpenFilters,
  onClearFilter,
  onClearAllFilters,
}: OutfitFiltersBarProps) {
  const hasActiveFilters =
    filters.occasion ||
    filters.style ||
    filters.formality ||
    filters.colors.length > 0 ||
    filters.includeWeather ||
    filters.stylePreferences.bodyType ||
    filters.stylePreferences.preferredFit ||
    (filters.stylePreferences.avoidPatterns?.length || 0) > 0 ||
    filters.stylePreferences.prioritizeComfort ||
    filters.weatherIntegration.enabled;

  const activeFilterCount =
    [
      filters.occasion,
      filters.style,
      filters.formality,
      filters.includeWeather,
      filters.stylePreferences.bodyType,
      filters.stylePreferences.preferredFit,
      filters.stylePreferences.prioritizeComfort,
      filters.weatherIntegration.enabled,
    ].filter(Boolean).length +
    filters.colors.length +
    (filters.stylePreferences.avoidPatterns?.length || 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.filterButton} onPress={onOpenFilters}>
          <Filter size={20} color={Colors.primary[500]} />
          <Text style={styles.filterButtonText}>
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Text>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={onClearAllFilters}
          >
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasActiveFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {filters.occasion && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {getOccasionLabel(filters.occasion)}
              </Text>
              <TouchableOpacity
                onPress={() => onClearFilter('occasion')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.style && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {getStyleLabel(filters.style)}
              </Text>
              <TouchableOpacity
                onPress={() => onClearFilter('style')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.formality && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {getFormalityLabel(filters.formality)}
              </Text>
              <TouchableOpacity
                onPress={() => onClearFilter('formality')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.colors.map(color => (
            <View key={color} style={styles.filterChip}>
              <Text style={styles.filterChipText}>{getColorLabel(color)}</Text>
              <TouchableOpacity
                onPress={() => onClearFilter('colors', color)}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}

          {filters.includeWeather && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Weather</Text>
              <TouchableOpacity
                onPress={() => onClearFilter('includeWeather')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.stylePreferences.bodyType && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {filters.stylePreferences.bodyType.charAt(0).toUpperCase() +
                  filters.stylePreferences.bodyType.slice(1)}
              </Text>
              <TouchableOpacity
                onPress={() => onClearFilter('stylePreferences', 'bodyType')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.stylePreferences.preferredFit && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                {filters.stylePreferences.preferredFit.charAt(0).toUpperCase() +
                  filters.stylePreferences.preferredFit.slice(1)}{' '}
                Fit
              </Text>
              <TouchableOpacity
                onPress={() =>
                  onClearFilter('stylePreferences', 'preferredFit')
                }
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.stylePreferences.prioritizeComfort && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Comfort Priority</Text>
              <TouchableOpacity
                onPress={() =>
                  onClearFilter('stylePreferences', 'prioritizeComfort')
                }
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}

          {filters.stylePreferences.avoidPatterns?.map(pattern => (
            <View key={`avoid-${pattern}`} style={styles.filterChip}>
              <Text style={styles.filterChipText}>
                Avoid {pattern.charAt(0).toUpperCase() + pattern.slice(1)}
              </Text>
              <TouchableOpacity
                onPress={() => onClearFilter('stylePreferences', pattern)}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))}

          {filters.weatherIntegration.enabled && (
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Weather Integration</Text>
              <TouchableOpacity
                onPress={() => onClearFilter('weatherIntegration', 'enabled')}
                style={styles.filterChipRemove}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  filterButtonText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  clearAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearAllText: {
    ...Typography.body.small,
    color: Colors.error[500],
    fontWeight: '600',
  },
  filtersScroll: {
    paddingBottom: Spacing.sm,
  },
  filtersScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[100],
    borderRadius: Layout.borderRadius.full,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary[300],
  },
  filterChipText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  filterChipRemove: {
    marginLeft: Spacing.xs,
    padding: 2,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[200],
  },
});
