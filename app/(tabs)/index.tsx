import { router } from 'expo-router';
import {
  Filter,
  RefreshCcw,
  Search,
  ShoppingBag,
  SortAsc,
} from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { FloatingActionButton } from '../../components/ui';
import { AddItemModal } from '../../components/wardrobe/AddItemModal';
import { ClothingItemCard } from '../../components/wardrobe/ClothingItemCard';
import { FilterModal } from '../../components/wardrobe/FilterModal';
import { Colors } from '../../constants/Colors';

import { useWardrobe } from '../../hooks/useWardrobe';
import { ClothingItem } from '../../types/wardrobe';

export default function WardrobeScreen() {
  const {
    filteredItems,
    selectedItems,
    filters,
    sortOptions,
    searchQuery,
    isLoading,
    error,
    actions,
  } = useWardrobe();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const allItems = filteredItems;
    return {
      colors: [...new Set(allItems.map(item => item.color))],
      brands: [
        ...new Set(
          allItems
            .map(item => item.brand)
            .filter((brand): brand is string => Boolean(brand))
        ),
      ],
      tags: [...new Set(allItems.flatMap(item => item.tags))],
    };
  }, [filteredItems]);

  const handleItemPress = (item: ClothingItem) => {
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id },
    });
  };

  const handleItemLongPress = (item: ClothingItem) => {
    if (selectedItems.includes(item.id)) {
      actions.deselectItem(item.id);
    } else {
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
        async buttonIndex => {
          if (buttonIndex === 0) {
            setEditingItem(item);
            setShowAddModal(true);
          } else if (buttonIndex === 1) {
            Alert.alert(
              'Delete Item',
              `How would you like to delete "${item.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Hide Only',
                  onPress: async () => {
                    const result = await actions.deleteItem(item.id);
                    if (!result.success) {
                      Alert.alert(
                        'Error',
                        result.error || 'Failed to hide item'
                      );
                    }
                  },
                },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Permanent Delete',
                      `This will permanently delete "${item.name}" and its image from the database. This action cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete Forever',
                          style: 'destructive',
                          onPress: async () => {
                            const result = await actions.permanentlyDeleteItem(
                              item.id
                            );
                            if (!result.success) {
                              Alert.alert(
                                'Error',
                                result.error ||
                                  'Failed to permanently delete item'
                              );
                            }
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          }
        }
      );
    } else {
      Alert.alert('Item Options', 'What would you like to do?', [
        {
          text: 'Edit',
          onPress: () => {
            setEditingItem(item);
            setShowAddModal(true);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Item',
              `How would you like to delete "${item.name}"?`,
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Hide Only',
                  onPress: async () => {
                    const result = await actions.deleteItem(item.id);
                    if (!result.success) {
                      Alert.alert(
                        'Error',
                        result.error || 'Failed to hide item'
                      );
                    }
                  },
                },
                {
                  text: 'Delete Permanently',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      'Permanent Delete',
                      `This will permanently delete "${item.name}" and its image from the database. This action cannot be undone.`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete Forever',
                          style: 'destructive',
                          onPress: async () => {
                            const result = await actions.permanentlyDeleteItem(
                              item.id
                            );
                            if (!result.success) {
                              Alert.alert(
                                'Error',
                                result.error ||
                                  'Failed to permanently delete item'
                              );
                            }
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleSort = () => {
    const sortMenuOptions = [
      {
        label: 'Name (A-Z)',
        field: 'name' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Name (Z-A)',
        field: 'name' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Category (A-Z)',
        field: 'category' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Category (Z-A)',
        field: 'category' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Brand (A-Z)',
        field: 'brand' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Brand (Z-A)',
        field: 'brand' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Date Added (Newest)',
        field: 'createdAt' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Date Added (Oldest)',
        field: 'createdAt' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Most Worn',
        field: 'timesWorn' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Least Worn',
        field: 'timesWorn' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Recently Worn',
        field: 'lastWorn' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Rarely Worn',
        field: 'lastWorn' as const,
        direction: 'asc' as const,
      },
      {
        label: 'Price (High to Low)',
        field: 'price' as const,
        direction: 'desc' as const,
      },
      {
        label: 'Price (Low to High)',
        field: 'price' as const,
        direction: 'asc' as const,
      },
    ];

    const options = [...sortMenuOptions.map(option => option.label), 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        buttonIndex => {
          if (buttonIndex < sortMenuOptions.length) {
            const selectedOption = sortMenuOptions[buttonIndex];
            actions.setSortOptions({
              field: selectedOption.field,
              direction: selectedOption.direction,
            });
          }
        }
      );
    }
  };

  const handleAddItem = async (item: ClothingItem) => {
    // Item is already saved to database via the modal, no additional action needed
    setEditingItem(undefined);
  };

  const handleRefresh = async () => {
    await actions.loadClothingItems();
  };

  const renderItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <ClothingItemCard
      item={item}
      index={index}
      isSelected={selectedItems.includes(item.id)}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      onToggleFavorite={async () => {
        const result = await actions.toggleFavorite(item.id);
        if (!result.success) {
          Alert.alert(
            'Error',
            result.error || 'Failed to update favorite status'
          );
        }
      }}
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => actions.loadClothingItems()}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Wardrobe</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCcw size={20} color={isLoading ? '#9ca3af' : '#6b7280'} />
          </TouchableOpacity>
          {/* View toggle button temporarily hidden */}
          {/* <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? (
              <List size={24} color="#6b7280" />
            ) : (
              <Grid size={24} color="#6b7280" />
            )}
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.headerButton} onPress={handleSort}>
            <SortAsc size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            value={searchQuery}
            onChangeText={actions.setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.activeFilterButton,
          ]}
          onPress={() => setShowFilterModal(true)}
        >
          <Filter
            size={20}
            color={activeFiltersCount > 0 ? '#ffffff' : '#6b7280'}
          />
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
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
            selected
          </Text>
          <TouchableOpacity
            style={styles.clearSelectionButton}
            onPress={actions.clearSelection}
          >
            <Text style={styles.clearSelectionText}>Clear</Text>
          </TouchableOpacity>
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
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Loading your wardrobe...</Text>
              <Text style={styles.emptySubtitle}>
                Setting up your clothing items from the database
              </Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <ShoppingBag size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || activeFiltersCount > 0
                  ? 'Try adjusting your search or filters'
                  : "Your wardrobe data is loading from the database. Try refreshing if items don't appear."}
              </Text>
              {!searchQuery && activeFiltersCount === 0 && (
                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowAddModal(true)}
                  >
                    <Text style={styles.emptyButtonText}>Add Item</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.emptyButton, styles.refreshButton]}
                    onPress={handleRefresh}
                  >
                    <Text style={styles.emptyButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )
        }
      />

      {/* Show loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      )}

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

      <AddItemModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(undefined);
        }}
        onAddItem={handleAddItem}
        editItem={editingItem}
      />

      <FloatingActionButton
        onPress={() => setShowAddModal(true)}
        size={64}
        iconSize={28}
        gradientColors={['#667eea', '#764ba2']}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface.primary,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  activeFilterButton: {
    backgroundColor: '#A428FC',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#A428FC',
    fontFamily: 'Inter-SemiBold',
  },
  clearSelectionButton: {
    padding: 4,
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: 'Inter-Regular',
  },
  emptyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 8,
  },
  emptyButton: {
    backgroundColor: '#A428FC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#10b981',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#A428FC',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
});
