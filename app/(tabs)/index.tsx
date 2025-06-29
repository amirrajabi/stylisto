import { router, useFocusEffect } from 'expo-router';
import {
  Filter,
  Heart,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
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
import { SortDropdown, SortOption } from '../../components/ui/SortDropdown';
import { AddItemModal } from '../../components/wardrobe/AddItemModal';
import { ClothingItemCard } from '../../components/wardrobe/ClothingItemCard';
import { FilterModal } from '../../components/wardrobe/FilterModal';
import { Colors } from '../../constants/Colors';

import { useWardrobe } from '../../hooks/useWardrobe';
import { ClothingItem } from '../../types/wardrobe';

export default function WardrobeScreen() {
  const {
    items,
    filteredItems,
    selectedItems,
    filters,
    sortOptions,
    searchQuery,
    isLoading,
    error,
    favoriteLoading,
    actions,
  } = useWardrobe();

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const flatListRef = useRef<FlatList>(null);
  const isFirstRender = useRef(true);

  // Prevent reload on focus - only load once
  useFocusEffect(
    useCallback(() => {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      // Don't reload items when screen comes back into focus
    }, [])
  );

  // Sort options for the dropdown
  const sortMenuOptions: SortOption[] = useMemo(
    () => [
      {
        label: 'Name (A-Z)',
        field: 'name',
        direction: 'asc',
      },
      {
        label: 'Name (Z-A)',
        field: 'name',
        direction: 'desc',
      },
      {
        label: 'Category (A-Z)',
        field: 'category',
        direction: 'asc',
      },
      {
        label: 'Category (Z-A)',
        field: 'category',
        direction: 'desc',
      },
      {
        label: 'Brand (A-Z)',
        field: 'brand',
        direction: 'asc',
      },
      {
        label: 'Brand (Z-A)',
        field: 'brand',
        direction: 'desc',
      },
      {
        label: 'Date Added (Newest)',
        field: 'createdAt',
        direction: 'desc',
      },
      {
        label: 'Date Added (Oldest)',
        field: 'createdAt',
        direction: 'asc',
      },
      {
        label: 'Most Worn',
        field: 'timesWorn',
        direction: 'desc',
      },
      {
        label: 'Least Worn',
        field: 'timesWorn',
        direction: 'asc',
      },
      {
        label: 'Recently Worn',
        field: 'lastWorn',
        direction: 'desc',
      },
      {
        label: 'Rarely Worn',
        field: 'lastWorn',
        direction: 'asc',
      },
      {
        label: 'Price (High to Low)',
        field: 'price',
        direction: 'desc',
      },
      {
        label: 'Price (Low to High)',
        field: 'price',
        direction: 'asc',
      },
    ],
    []
  );

  // Get unique values for filter options from ALL items, not just filtered ones
  const filterOptions = useMemo(() => {
    const allItems = items; // Use all items, not filtered items
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
  }, [items]); // Depend on items, not filteredItems

  const handleItemPress = useCallback((item: ClothingItem) => {
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id },
    });
  }, []);

  const handleItemLongPress = useCallback(
    (item: ClothingItem) => {
      if (selectedItems.includes(item.id)) {
        actions.deselectItem(item.id);
      } else {
        actions.selectItem(item.id);
      }
    },
    [selectedItems, actions]
  );

  const handleToggleFavorite = useCallback(
    (itemId: string) => {
      actions.toggleFavorite(itemId);
    },
    [actions]
  );

  const handleMoreOptions = useCallback(
    (item: ClothingItem) => {
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
                `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const result = await actions.deleteItem(item.id);
                      if (!result.success) {
                        Alert.alert(
                          'Error',
                          result.error || 'Failed to delete item'
                        );
                      }
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
                `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      const result = await actions.deleteItem(item.id);
                      if (!result.success) {
                        Alert.alert(
                          'Error',
                          result.error || 'Failed to delete item'
                        );
                      }
                    },
                  },
                ]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]);
      }
    },
    [selectedItems, actions]
  );

  const handleSort = (option: SortOption) => {
    actions.setSortOptions({
      field: option.field,
      direction: option.direction,
    });
  };

  const handleAddItem = async (item: ClothingItem) => {
    // Item is already saved to database via the modal, no additional action needed
    setEditingItem(undefined);
  };

  const handleRefresh = async () => {
    await actions.loadClothingItems();
  };

  // Batch operations for selected items
  const handleBatchDelete = useCallback(() => {
    if (selectedItems.length === 0) return;

    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItems.length} selected item${selectedItems.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const itemId of selectedItems) {
                await actions.deleteItem(itemId);
              }
              actions.clearSelection();
              Alert.alert(
                'Success',
                `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} deleted successfully`
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to delete some items');
            }
          },
        },
      ]
    );
  }, [selectedItems, actions]);

  const handleBatchLike = useCallback(async () => {
    if (selectedItems.length === 0) return;

    try {
      for (const itemId of selectedItems) {
        await actions.toggleFavorite(itemId);
      }
      actions.clearSelection();
      Alert.alert(
        'Success',
        `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} ${selectedItems.length > 1 ? 'updated' : 'updated'} successfully`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update some items');
    }
  }, [selectedItems, actions]);

  const renderItem = useCallback(
    ({ item, index }: { item: ClothingItem; index: number }) => (
      <ClothingItemCard
        item={item}
        index={index}
        isSelected={selectedItems.includes(item.id)}
        onPress={() => handleItemPress(item)}
        onLongPress={() => handleItemLongPress(item)}
        onToggleFavorite={() => handleToggleFavorite(item.id)}
        onMoreOptions={() => handleMoreOptions(item)}
        showStats
        favoriteLoading={favoriteLoading[item.id] || false}
      />
    ),
    [
      selectedItems,
      handleItemPress,
      handleItemLongPress,
      handleToggleFavorite,
      handleMoreOptions,
      favoriteLoading,
    ]
  );

  const keyExtractor = useCallback((item: ClothingItem) => item.id, []);

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
      </View>

      {/* Search and Sort */}
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

        <View style={styles.actionButtonsContainer}>
          <SortDropdown
            options={sortMenuOptions}
            selectedOption={sortMenuOptions.find(
              option =>
                option.field === sortOptions.field &&
                option.direction === sortOptions.direction
            )}
            onSelect={handleSort}
            buttonStyle={styles.sortButton}
          />
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
      </View>

      {/* Selection Actions */}
      {selectedItems.length > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''}{' '}
            selected
          </Text>
          <View style={styles.selectionActions}>
            <TouchableOpacity
              style={styles.likeActionButton}
              onPress={handleBatchLike}
            >
              <Heart size={16} color="#ec4899" />
              <Text style={styles.likeActionText}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteActionButton}
              onPress={handleBatchDelete}
            >
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.deleteActionText}>Delete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.clearSelectionButton}
              onPress={actions.clearSelection}
            >
              <Text style={styles.clearSelectionText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Items List */}
      <FlatList
        ref={flatListRef}
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={false}
        maxToRenderPerBatch={8}
        windowSize={5}
        initialNumToRender={6}
        updateCellsBatchingPeriod={100}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
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
        size={56}
        iconSize={36}
        gradientColors={['#ffffff', '#ffffff']}
        icon="app-icon"
        style={styles.floatingButton}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.primary,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 9998,
    position: 'relative',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Regular',
    height: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 9999,
    position: 'relative',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minWidth: 140,
    maxWidth: 200,
    height: 44,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  filterButton: {
    position: 'relative',
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    height: 44,
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
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
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  likeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  likeActionText: {
    fontSize: 14,
    color: '#ef4444',
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
  },
  deleteActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteActionText: {
    fontSize: 14,
    color: '#ef4444',
    fontFamily: 'Inter-Regular',
    fontWeight: '500',
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
  floatingButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
  },
});
