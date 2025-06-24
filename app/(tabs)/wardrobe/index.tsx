import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActionSheetIOS,
  Platform,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Grid2x2 as Grid, List, Import as SortAsc, Camera, Plus, Filter, MoveVertical as MoreVertical } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { WardrobeItemCard } from '../../../components/wardrobe/WardrobeItemCard';
import { WardrobeFilters } from '../../../components/wardrobe/WardrobeFilters';
import { WardrobeSearch } from '../../../components/wardrobe/WardrobeSearch';
import { WardrobeEmptyState } from '../../../components/wardrobe/WardrobeEmptyState';
import { WardrobeLoadingState } from '../../../components/wardrobe/WardrobeLoadingState';
import { ClothingItem, SortOptions } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { Button, H1 } from '../../../components/ui';

const { width: screenWidth } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;

interface FilterOptions {
  categories: string[];
  seasons: string[];
  occasions: string[];
  colors: string[];
  brands: string[];
  priceRange: [number, number] | null;
  favorites: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function WardrobeScreen() {
  const {
    filteredItems,
    selectedItems,
    filters,
    sortOptions,
    searchQuery,
    actions,
    stats,
  } = useWardrobe();

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Refs
  const flatListRef = useRef<FlatList>(null);

  // Animations
  const headerScale = useSharedValue(1);
  const fabScale = useSharedValue(1);

  // Pagination
  const paginatedItems = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, endIndex);
  }, [filteredItems, currentPage]);

  const hasMoreItems = useMemo(() => {
    return filteredItems.length > currentPage * ITEMS_PER_PAGE;
  }, [filteredItems.length, currentPage]);

  // Filter options for modal
  const filterOptions = useMemo(() => {
    const allItems = filteredItems;
    return {
      categories: [...new Set(allItems.map(item => item.category))],
      seasons: ['spring', 'summer', 'fall', 'winter'],
      occasions: ['casual', 'work', 'formal', 'party', 'sport', 'travel', 'date', 'special'],
      colors: [...new Set(allItems.map(item => item.color))],
      brands: [...new Set(allItems.map(item => item.brand).filter(Boolean))],
    };
  }, [filteredItems]);

  const activeFiltersCount = useMemo(() => {
    return Object.values(filters).reduce((count, filter) => {
      if (Array.isArray(filter)) {
        return count + filter.length;
      }
      return count + (filter ? 1 : 0);
    }, 0);
  }, [filters]);

  // Handlers
  const handleItemPress = useCallback((item: ClothingItem) => {
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
  }, [selectedItems, actions]);

  const handleItemLongPress = useCallback((item: ClothingItem) => {
    if (!selectedItems.includes(item.id)) {
      actions.selectItem(item.id);
    }
  }, [selectedItems, actions]);

  const handleMoreOptions = useCallback((item: ClothingItem) => {
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
  }, [actions]);

  const handleSort = useCallback(() => {
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
  }, [actions]);

  const handleAddItem = useCallback(() => {
    router.push('/wardrobe/add-item');
  }, []);

  const handleCameraPress = useCallback(() => {
    router.push('/camera');
  }, []);

  const handleViewModeToggle = useCallback(() => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    
    // Animate header
    headerScale.value = withSpring(0.95, {}, () => {
      headerScale.value = withSpring(1);
    });
  }, [viewMode]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => {
      setIsRefreshing(false);
      setCurrentPage(1);
    }, 1000);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (hasMoreItems && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  }, [hasMoreItems, isLoadingMore]);

  const handleCreateOutfit = useCallback(() => {
    if (selectedItems.length > 0) {
      router.push('/outfit-builder');
    }
  }, [selectedItems]);

  // Render functions
  const renderItem = useCallback(({ item, index }: { item: ClothingItem; index: number }) => (
    <WardrobeItemCard
      item={item}
      viewMode={viewMode}
      isSelected={selectedItems.includes(item.id)}
      onPress={() => handleItemPress(item)}
      onLongPress={() => handleItemLongPress(item)}
      onToggleFavorite={() => actions.toggleFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      showStats
      index={index}
    />
  ), [viewMode, selectedItems, handleItemPress, handleItemLongPress, handleMoreOptions, actions]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return <WardrobeLoadingState viewMode={viewMode} itemCount={4} />;
  }, [isLoadingMore, viewMode]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return <WardrobeLoadingState viewMode={viewMode} />;
    }

    if (searchQuery || activeFiltersCount > 0) {
      return (
        <WardrobeEmptyState
          type={searchQuery ? 'no-results' : 'filtered'}
          searchQuery={searchQuery}
          activeFiltersCount={activeFiltersCount}
          onAddItem={handleAddItem}
          onClearSearch={() => actions.setSearchQuery('')}
          onClearFilters={() => actions.clearFilters()}
        />
      );
    }

    return (
      <WardrobeEmptyState
        type="empty"
        onAddItem={handleAddItem}
      />
    );
  }, [isLoading, searchQuery, activeFiltersCount, viewMode, handleAddItem, actions]);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <H1 style={styles.title}>My Wardrobe</H1>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleViewModeToggle}
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
        </View>
      </Animated.View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <WardrobeSearch
            value={searchQuery}
            onChangeText={actions.setSearchQuery}
            placeholder="Search your wardrobe..."
          />
        </View>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.activeFilterButton
          ]}
          onPress={() => setShowFilterModal(true)}
          accessibilityLabel={`Filter items${activeFiltersCount > 0 ? `, ${activeFiltersCount} filters active` : ''}`}
        >
          <Filter 
            size={20} 
            color={activeFiltersCount > 0 ? Colors.white : Colors.text.secondary} 
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
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </Text>
          <View style={styles.selectionActions}>
            <Button
              title="Create Outfit"
              size="small"
              variant="secondary"
              onPress={handleCreateOutfit}
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
        ref={flatListRef}
        data={paginatedItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        contentContainerStyle={[
          styles.listContainer,
          paginatedItems.length === 0 && styles.emptyListContainer,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary[700]}
            colors={[Colors.primary[700]]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={8}
        getItemLayout={viewMode === 'list' ? (data, index) => ({
          length: 120 + Spacing.md,
          offset: (120 + Spacing.md) * index,
          index,
        }) : undefined}
      />

      {/* Floating Action Button */}
      <AnimatedTouchableOpacity
        style={[styles.fab, fabAnimatedStyle]}
        onPress={handleAddItem}
        accessibilityLabel="Add new item"
      >
        <Plus size={24} color={Colors.white} />
      </AnimatedTouchableOpacity>

      {/* Filter Modal */}
      <WardrobeFilters
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        onApplyFilters={actions.setFilters}
        availableOptions={filterOptions}
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    gap: Spacing.md,
  },
  searchWrapper: {
    flex: 1,
  },
  filterButton: {
    position: 'relative',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyListContainer: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
});