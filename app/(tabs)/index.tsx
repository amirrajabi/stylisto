import {
  Filter,
  Grid,
  List,
  Plus,
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
import { AddItemModal } from '../../components/wardrobe/AddItemModal';
import { ClothingItemCard } from '../../components/wardrobe/ClothingItemCard';
import { FilterModal } from '../../components/wardrobe/FilterModal';
import { useWardrobe } from '../../hooks/useWardrobe';
import { ClothingItem, SortOptions } from '../../types/wardrobe';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | undefined>();
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
      // Single item view - could navigate to detail screen
      console.log('View item details:', item.name);
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
        buttonIndex => {
          if (buttonIndex === 0) {
            setEditingItem(item);
            setShowAddModal(true);
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
    const sortFields: { label: string; value: SortOptions['field'] }[] = [
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
        buttonIndex => {
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

  const handleAddItem = (item: ClothingItem) => {
    if (editingItem) {
      actions.updateItem(item);
    } else {
      actions.addItem(item);
    }
    setEditingItem(undefined);
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
          >
            {viewMode === 'grid' ? (
              <List size={24} color="#6b7280" />
            ) : (
              <Grid size={24} color="#6b7280" />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleSort}>
            <SortAsc size={24} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#ffffff" />
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
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <ShoppingBag size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || activeFiltersCount > 0
                ? 'Try adjusting your search or filters'
                : 'Add your first clothing item to get started'}
            </Text>
            {!searchQuery && activeFiltersCount === 0 && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => setShowAddModal(true)}
              >
                <Text style={styles.emptyButtonText}>Add Item</Text>
              </TouchableOpacity>
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

      <AddItemModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingItem(undefined);
        }}
        onAddItem={handleAddItem}
        editItem={editingItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
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
  addButton: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#3b82f6',
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
    color: '#3b82f6',
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
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Inter-SemiBold',
  },
});
