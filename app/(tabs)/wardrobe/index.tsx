import { router } from 'expo-router';
import {
  Camera,
  Filter,
  Grid2x2 as Grid,
  List,
  Plus,
  Search,
  Import as SortAsc,
  X,
} from 'lucide-react-native';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { H1 } from '../../../components/ui';
import OptimizedWardrobeList from '../../../components/wardrobe/OptimizedWardrobeList';
import { WardrobeFilters } from '../../../components/wardrobe/WardrobeFilters';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { useWardrobePerformance } from '../../../hooks/useWardrobePerformance';
import { ClothingItem } from '../../../types/wardrobe';

const { width: screenWidth } = Dimensions.get('window');
const ITEMS_PER_PAGE = 20;

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export default function WardrobeScreen() {
  const {
    filteredItems,
    selectedItems,
    filters,
    sortOptions,
    searchQuery,
    actions,
  } = useWardrobe();

  const {
    startRenderMeasurement,
    endRenderMeasurement,
    scheduleAfterInteractions,
    optimizeForLargeList,
  } = useWardrobePerformance();

  // UI State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const searchDebounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Start performance measurement
  useEffect(() => {
    startRenderMeasurement();
    return () => endRenderMeasurement('WardrobeScreen');
  }, []);

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
      seasons: [...new Set(allItems.flatMap(item => item.season))],
      occasions: [...new Set(allItems.flatMap(item => item.occasion))],
      colors: [...new Set(allItems.map(item => item.color))],
      brands: [
        ...new Set(
          allItems.map(item => item.brand).filter(Boolean) as string[]
        ),
      ],
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
  const handleItemPress = useCallback(
    (item: ClothingItem) => {
      if (selectedItems.length > 0) {
        // Multi-select mode
        if (selectedItems.includes(item.id)) {
          actions.deselectItem(item.id);
        } else {
          actions.selectItem(item.id);
        }
      } else {
        // Navigate to item detail
        scheduleAfterInteractions(() => {
          router.push({
            pathname: '/item-detail',
            params: { itemId: item.id },
          });
        });
      }
    },
    [selectedItems, actions, scheduleAfterInteractions]
  );

  const handleItemLongPress = useCallback(
    (item: ClothingItem) => {
      if (!selectedItems.includes(item.id)) {
        actions.selectItem(item.id);
      }
    },
    [selectedItems, actions]
  );

  const handleMoreOptions = useCallback(
    (item: ClothingItem) => {
      scheduleAfterInteractions(() => {
        if (Platform.OS === 'ios') {
          const { ActionSheetIOS } = require('react-native');
          ActionSheetIOS.showActionSheetWithOptions(
            {
              options: ['Edit', 'Delete', 'Cancel'],
              destructiveButtonIndex: 1,
              cancelButtonIndex: 2,
            },
            async (buttonIndex: number) => {
              if (buttonIndex === 0) {
                // Edit item
                router.push({
                  pathname: '/wardrobe/add-item',
                  params: { itemId: item.id },
                });
              } else if (buttonIndex === 1) {
                // Delete item
                const { Alert } = require('react-native');
                Alert.alert(
                  'Delete Item',
                  `Are you sure you want to delete "${item.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        const result = await actions.deleteItem(item.id);
                        if (!result.success) {
                          Alert.alert(
                            'Delete Failed',
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
          // Android Alert
          const { Alert } = require('react-native');
          Alert.alert('Item Options', 'What would you like to do?', [
            {
              text: 'Edit',
              onPress: () => {
                router.push({
                  pathname: '/wardrobe/add-item',
                  params: { itemId: item.id },
                });
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
                      onPress: async () => {
                        const result = await actions.deleteItem(item.id);
                        if (!result.success) {
                          Alert.alert(
                            'Delete Failed',
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
      });
    },
    [scheduleAfterInteractions, actions, router]
  );

  const handleSort = useCallback(() => {
    // Animate button press
    fabScale.value = withSpring(0.95, {}, () => {
      fabScale.value = withSpring(1);
    });

    // Show sort options
    scheduleAfterInteractions(() => {
      // Sort options implementation
    });
  }, [fabScale, scheduleAfterInteractions]);

  const handleAddItem = useCallback(() => {
    // Animate button press
    fabScale.value = withSpring(0.95, {}, () => {
      fabScale.value = withSpring(1);
    });

    scheduleAfterInteractions(() => {
      router.push('/wardrobe/add-item');
    });
  }, [fabScale, scheduleAfterInteractions]);

  const handleViewModeToggle = useCallback(() => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);

    // Animate header
    headerScale.value = withSpring(0.95, {}, () => {
      headerScale.value = withSpring(1);
    });
  }, [viewMode, headerScale]);

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

      // Load more items with a slight delay to prevent UI jank
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 300);
    }
  }, [hasMoreItems, isLoadingMore]);

  const handleSearchChange = useCallback(
    (text: string) => {
      setLocalSearchQuery(text);

      // Debounce search to prevent excessive re-renders
      if (searchDebounceTimeout.current) {
        clearTimeout(searchDebounceTimeout.current);
      }

      searchDebounceTimeout.current = setTimeout(() => {
        actions.setSearchQuery(text);
      }, 300);
    },
    [actions]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery('');
    actions.setSearchQuery('');
    setShowSearch(false);
  }, [actions]);

  const handleDeleteItem = useCallback(
    (item: ClothingItem) => {
      scheduleAfterInteractions(() => {
        Alert.alert(
          'Delete Item',
          `Are you sure you want to delete "${item.name}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                const result = await actions.deleteItem(item.id);
                if (!result.success) {
                  Alert.alert(
                    'Delete Failed',
                    result.error || 'Failed to delete item'
                  );
                }
              },
            },
          ]
        );
      });
    },
    [scheduleAfterInteractions, actions]
  );

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} testID="wardrobe-container">
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        {showSearch ? (
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.text.tertiary} />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                value={localSearchQuery}
                onChangeText={handleSearchChange}
                placeholder="Search your wardrobe..."
                placeholderTextColor={Colors.text.tertiary}
                autoFocus
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {localSearchQuery ? (
                <TouchableOpacity onPress={handleClearSearch}>
                  <X size={20} color={Colors.text.tertiary} />
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClearSearch}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
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
                style={styles.headerButton}
                onPress={() => setShowSearch(true)}
                accessibilityLabel="Search items"
              >
                <Search size={24} color={Colors.text.secondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cameraButton}
                onPress={() => router.push('/camera')}
                accessibilityLabel="Take photo of item"
              >
                <Camera size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </Animated.View>

      {/* Filter Button */}
      <View style={styles.filterButtonContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.activeFilterButton,
          ]}
          onPress={() => setShowFilterModal(true)}
          accessibilityLabel={`Filter items${activeFiltersCount > 0 ? `, ${activeFiltersCount} filters active` : ''}`}
        >
          <Filter
            size={20}
            color={
              activeFiltersCount > 0 ? Colors.white : Colors.text.secondary
            }
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
            accessibilityLabel="Clear selection"
          >
            <Text style={styles.clearSelectionText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Optimized Wardrobe List */}
      <OptimizedWardrobeList
        items={paginatedItems}
        viewMode={viewMode}
        isLoading={isLoading || isLoadingMore}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onItemPress={handleItemPress}
        onItemLongPress={handleItemLongPress}
        onToggleFavorite={actions.toggleFavorite}
        onMoreOptions={handleMoreOptions}
        onDelete={handleDeleteItem}
        selectedItems={selectedItems}
        emptyState={
          paginatedItems.length === 0
            ? {
                type: searchQuery
                  ? 'no-results'
                  : activeFiltersCount > 0
                    ? 'filtered'
                    : 'empty',
                searchQuery,
                activeFiltersCount,
                onAddItem: handleAddItem,
                onClearSearch: () => actions.setSearchQuery(''),
                onClearFilters: actions.clearFilters,
              }
            : undefined
        }
        testID="wardrobe-list"
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 0,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    paddingVertical: Platform.OS === 'ios' ? 0 : Spacing.sm,
  },
  cancelButton: {
    paddingHorizontal: Spacing.sm,
  },
  cancelText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
  },
  filterButtonContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    alignItems: 'flex-end',
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
  clearSelectionButton: {
    padding: Spacing.xs,
  },
  clearSelectionText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
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
