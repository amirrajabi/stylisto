import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useWardrobe } from '../../hooks/useWardrobe';

interface WardrobeItemCounterProps {
  showDetails?: boolean;
}

export const WardrobeItemCounter: React.FC<WardrobeItemCounterProps> = ({
  showDetails = false,
}) => {
  const { items, filteredItems, filters, searchQuery, actions } = useWardrobe();

  const categoryCounts = filteredItems.reduce(
    (acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const hasActiveFilters =
    Object.values(filters).some(filter => {
      if (Array.isArray(filter)) return filter.length > 0;
      if (typeof filter === 'boolean') return filter;
      if (filter && typeof filter === 'object') return true;
      return false;
    }) || Boolean(searchQuery);

  const clearAllFilters = () => {
    actions.clearFilters();
    actions.setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Items: {filteredItems.length} / {items.length}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearAllFilters}
            style={styles.clearButton}
          >
            <Text style={styles.clearButtonText}>Clear Filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {hasActiveFilters && (
        <Text style={styles.filterWarning}>
          ⚠️ Filters are active - showing {filteredItems.length} of{' '}
          {items.length} items
        </Text>
      )}

      {showDetails && filteredItems.length > 0 && (
        <View style={styles.details}>
          {Object.entries(categoryCounts).map(([category, count]) => (
            <Text key={category} style={styles.categoryText}>
              {category}: {count}
            </Text>
          ))}
        </View>
      )}

      {filteredItems.length < 2 && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            ⚠️ Need at least 2 items to generate outfits
          </Text>
          {hasActiveFilters && (
            <Text style={styles.suggestionText}>
              Try clearing filters above or add more items to your wardrobe
            </Text>
          )}
        </View>
      )}

      {showDetails && searchQuery && (
        <Text style={styles.searchInfo}>🔍 Search: {searchQuery}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  clearButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  clearButtonText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
  },
  filterWarning: {
    ...Typography.caption.medium,
    color: Colors.warning[600],
    fontWeight: '500',
    marginBottom: Spacing.xs,
    backgroundColor: Colors.warning[50],
    padding: Spacing.xs,
    borderRadius: 4,
  },
  details: {
    marginTop: Spacing.xs,
  },
  categoryText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  warningContainer: {
    marginTop: Spacing.xs,
    padding: Spacing.xs,
    backgroundColor: Colors.error[50],
    borderRadius: 4,
  },
  warningText: {
    ...Typography.caption.medium,
    color: Colors.error[600],
    fontWeight: '500',
  },
  suggestionText: {
    ...Typography.caption.small,
    color: Colors.error[500],
    marginTop: 4,
  },
  searchInfo: {
    ...Typography.caption.medium,
    color: Colors.info[600],
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
});
