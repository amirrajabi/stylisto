import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Search, Filter, Plus, Grid, List, SortAsc, Camera } from 'lucide-react-native';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { ClothingItemCard } from '../../../components/wardrobe/ClothingItemCard';
import { FilterModal } from '../../../components/wardrobe/FilterModal';
import { ClothingItem, SortOptions } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { Button } from '../../../components/ui';

export default function WardrobeScreen() {
  const {
    filteredItems,
    selectedItems,
    filters,
    sortOptions,
    searchQuery,
    actions,
  } = useWardrobe();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const allItems = filteredItems;
    return {
      colors: [...new Set(allItems.map(item => item.color))],
      brands: [...new Set(allItems.map(item => item.brand).filter(Boolean))],
      tags: [...new Set(allItems.flatMap(item => item.tags))],
    };
  }, [filteredItems]);

  const handleItemPress = (item: ClothingItem) => {
    if (selectedItems.length > 0) {
      // Multi-select mode
      if (selectedItems.includes(item.id)) {
        actions.deselectItem(item.id);
      } else {
        actions.selectItem(item.id);
      }
    } else {
      // Navigate to item detail
      router.push({
        pathname: '/item-detail',
        params: { itemId: item.id }
      });
    }
  };

  const handleItemLongPress = (item: ClothingItem) => {
    if (!selectedItems.includes(item.id)) {
      actions.selectItem(item.id);
    }
  };

  const handleMoreOptions = (item: ClothingItem) => {
    const options = ['Edit', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 1;
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            router.push({
              pathname: '/wardrobe/add-item',
              params: { editItemId: item.id }
            });
          } else if (buttonIndex === 1) {
            Alert.alert(
              'Delete Item',
              `Are you sure you want to delete "${item.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => actions.deleteItem(item.id),
                },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert(
        'Item Options',
        `What would you like to do with "${item.name}"?`,
        [
          { text: 'Edit', onPress: () => {
            router.push({
              pathname: '/wardrobe/add-item',
              params: { editItemId: item.id }
            });
          }},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Item',
                `Are you sure you want to delete "${item.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => actions.deleteItem(item.id),
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleSort = () => {
    const sortFields: Array<{ label: string; value: SortOptions['field'] }> = [
      { label: 'Name', value: 'name' },
      { label: 'Category', value: 'category' },
      { label: 'Brand', value: 'brand' },
      { label: 'Date Added', value: 'createdAt' },
      { label: 'Times Worn', value: 'timesWorn' },
      { label: 'Last Worn', value: 'lastWorn' },
      { label: 'Price', value: 'price' },
    ];

    const options = [
      ...sortFields.map(field => `${field.label} (A-Z)`),
      ...sortFields.map(field => `${field.label} (Z-A)`),
      'Cancel',
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          if (buttonIndex < sortFields.length * 2) {
            const fieldIndex = buttonIndex % sortFields.length;
            const direction = buttonIndex < sortFields.length ? 'asc' : 'desc';
            actions.setSortOptions({
              field: sortFields[fieldIndex].value,
              direction,
            });
          }
        }
      );
    }
  };

  const handleAddItem = () => {
    router.push('/wardrobe/add-item');
  };

  const handleCameraPress = () => {
    router.push('/camera');
  };

  const renderItem = ({ item }: { item: ClothingItem }) => (
    <ClothingItemCard
      item={item}
      isSelected={selectedItems.includes(item.id)}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      onToggleFavorite={() => actions.toggleFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      showStats
    />
  );

  const activeFiltersCount = Object.values(filters).reduce((count, filter) => {
    if (Array.isArray(filter)) {
      return count + filter.length;
    }
    return count + (filter ? 1 : 0);
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            accessibilityLabel={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            {viewMode === 'grid' ? (
              <List size={24} color={Colors.text.secondary} />
            ) : (
              <Grid size={24} color={Colors.text.secondary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleSort}
            accessibilityLabel="Sort items"
          >
            <SortAsc size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleCameraPress}
            accessibilityLabel="Take photo of item"
          >
            <Camera size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddItem}
            accessibilityLabel="Add new item"
          >
            <Plus size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={actions.setSearchQuery}
            placeholderTextColor={Colors.text.tertiary}
            accessibilityLabel="Search wardrobe items"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, activeFiltersCount > 0 && styles.activeFilterButton]}
          onPress={() => setShowFilterModal(true)}
          accessibilityLabel={`Filter items${activeFiltersCount > 0 ? `, ${activeFiltersCount} filters active` : ''}`}
        >
          <Filter size={20} color={activeFiltersCount > 0 ? Colors.white : Colors.text.secondary} />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </Text>
          <View style={styles.selectionActions}>
            <Button
              title="Create Outfit"
              size="small"
              variant="secondary"
              onPress={() => router.push('/outfit-builder')}
            />
            <TouchableOpacity
              style={styles.clearSelectionButton}
              onPress={actions.clearSelection}
              accessibilityLabel="Clear selection"
            >
              <Text style={styles.clearSelectionText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Items List */}
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Shirt size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'Add your first clothing item to get started'}
            </Text>
            {!searchQuery && activeFiltersCount === 0 && (
              <Button
                title="Add Item"
                onPress={handleAddItem}
                style={styles.emptyButton}
              />
            )}
          </View>
        }
      />

      {/* Modals */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={actions.setFilters}
        availableColors={filterOptions.colors}
        availableBrands={filterOptions.brands}
        availableTags={filterOptions.tags}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  title: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  cameraButton: {
    backgroundColor: Colors.secondary[400],
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  addButton: {
    backgroundColor: Colors.primary[700],
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    gap: Spacing.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  filterButton: {
    position: 'relative',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface.secondary,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary[700],
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error[500],
    borderRadius: Layout.borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '600',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.info[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  selectionText: {
    ...Typography.body.medium,
    color: Colors.info[700],
    fontWeight: '500',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  clearSelectionButton: {
    padding: Spacing.xs,
  },
  clearSelectionText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.md,
  },
});