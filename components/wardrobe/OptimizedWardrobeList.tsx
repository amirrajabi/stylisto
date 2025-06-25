import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useWardrobePerformance } from '../../hooks/useWardrobePerformance';
import { ClothingItem } from '../../types/wardrobe';
import { WardrobeEmptyState } from './WardrobeEmptyState';
import WardrobeItemCard from './WardrobeItemCard';
import { WardrobeLoadingState } from './WardrobeLoadingState';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define view types for RecyclerListView
const ViewTypes = {
  GRID_ITEM: 0,
  LIST_ITEM: 1,
  LOADING: 2,
  FOOTER: 3,
};

interface OptimizedWardrobeListProps {
  items: ClothingItem[];
  viewMode: 'grid' | 'list';
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onItemPress: (item: ClothingItem) => void;
  onItemLongPress?: (item: ClothingItem) => void;
  onToggleFavorite: (id: string) => void;
  onMoreOptions: (item: ClothingItem) => void;
  onDelete?: (item: ClothingItem) => void;
  selectedItems?: string[];
  emptyState?: {
    type: 'empty' | 'no-results' | 'filtered';
    searchQuery?: string;
    activeFiltersCount?: number;
    onAddItem?: () => void;
    onClearSearch?: () => void;
    onClearFilters?: () => void;
  };
  testID?: string;
}

// Memoized item renderer to prevent unnecessary re-renders
const MemoizedWardrobeItemCard = memo(WardrobeItemCard);

const OptimizedWardrobeList: React.FC<OptimizedWardrobeListProps> = ({
  items,
  viewMode,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onEndReached,
  onItemPress,
  onItemLongPress,
  onToggleFavorite,
  onMoreOptions,
  onDelete,
  selectedItems = [],
  emptyState,
  testID,
}) => {
  const {
    startRenderMeasurement,
    endRenderMeasurement,
    optimizeForLargeList,
    measureScrollPerformance,
  } = useWardrobePerformance();

  // Track if component is mounted
  const isMounted = useRef(true);

  // Track scroll performance
  const scrollStartTime = useRef(0);
  const scrollEndTime = useRef(0);
  const scrollFrames = useRef(0);

  // Animation values
  const listOpacity = useSharedValue(0);
  const listScale = useSharedValue(0.98);

  // RecyclerListView data provider
  const [dataProvider, setDataProvider] = useState(
    new DataProvider((r1, r2) => r1.id !== r2.id).cloneWithRows(items)
  );

  // Update data provider when items change
  useEffect(() => {
    if (isMounted.current) {
      setDataProvider(
        new DataProvider((r1, r2) => r1.id !== r2.id).cloneWithRows(items)
      );
    }
  }, [items]);

  // Start performance measurement on mount
  useEffect(() => {
    startRenderMeasurement();

    // Animate in the list
    listOpacity.value = withTiming(1, { duration: 300 });
    listScale.value = withSpring(1, { damping: 15, stiffness: 150 });

    return () => {
      isMounted.current = false;
      endRenderMeasurement('OptimizedWardrobeList');
    };
  }, []);

  // Calculate item dimensions based on view mode
  const getItemDimensions = useCallback(() => {
    if (viewMode === 'grid') {
      const gridSpacing = Spacing.md;
      const numColumns = SCREEN_WIDTH >= 768 ? 3 : 2;
      const itemWidth =
        (SCREEN_WIDTH - gridSpacing * (numColumns + 1)) / numColumns;
      const itemHeight = itemWidth * 1.65; // Adjusted to accommodate image + content
      return { itemWidth, itemHeight, numColumns };
    } else {
      return {
        itemWidth: SCREEN_WIDTH - Spacing.md * 2,
        itemHeight: 120,
        numColumns: 1,
      };
    }
  }, [viewMode, SCREEN_WIDTH]);

  const { itemWidth, itemHeight, numColumns } = getItemDimensions();

  // Layout provider for RecyclerListView - recreate when dimensions change
  const layoutProvider = useMemo(
    () =>
      new LayoutProvider(
        index => {
          if (index === items.length && items.length > 0) {
            return ViewTypes.FOOTER;
          }
          return viewMode === 'grid'
            ? ViewTypes.GRID_ITEM
            : ViewTypes.LIST_ITEM;
        },
        (type, dim) => {
          switch (type) {
            case ViewTypes.GRID_ITEM:
              dim.width = itemWidth;
              dim.height = itemHeight;
              break;
            case ViewTypes.LIST_ITEM:
              dim.width = itemWidth;
              dim.height = itemHeight;
              break;
            case ViewTypes.FOOTER:
              dim.width = SCREEN_WIDTH;
              dim.height = 80;
              break;
            default:
              dim.width = 0;
              dim.height = 0;
              break;
          }
        }
      ),
    [itemWidth, itemHeight, viewMode, items.length]
  );

  // Row renderer for RecyclerListView
  const rowRenderer = useCallback(
    (type: any, item: ClothingItem, index: number) => {
      if (type === ViewTypes.FOOTER) {
        return (
          <View style={styles.footer}>
            {isLoading && (
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            )}
          </View>
        );
      }

      return (
        <MemoizedWardrobeItemCard
          item={item}
          viewMode={viewMode}
          isSelected={selectedItems.includes(item.id)}
          onPress={() => onItemPress(item)}
          onLongPress={() => onItemLongPress?.(item)}
          onToggleFavorite={() => onToggleFavorite(item.id)}
          onMoreOptions={() => onMoreOptions(item)}
          onDelete={onDelete}
          showStats
          index={index}
        />
      );
    },
    [
      viewMode,
      selectedItems,
      onItemPress,
      onItemLongPress,
      onToggleFavorite,
      onMoreOptions,
      onDelete,
      isLoading,
    ]
  );

  // Handle scroll performance measurement
  const handleScrollStart = useCallback(() => {
    scrollStartTime.current = performance.now();
    scrollFrames.current = 0;
  }, []);

  const handleScrollEnd = useCallback(() => {
    scrollEndTime.current = performance.now();
    const scrollDuration = scrollEndTime.current - scrollStartTime.current;

    if (scrollDuration > 0 && scrollFrames.current > 0) {
      const fps = Math.round((scrollFrames.current * 1000) / scrollDuration);
      console.log(`Scroll performance: ${fps} FPS`);

      // Report slow scrolling
      if (fps < 30) {
        console.warn(`Slow scrolling detected: ${fps} FPS`);
      }
    }
  }, []);

  const handleScroll = useCallback(() => {
    scrollFrames.current++;
  }, []);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ scale: listScale.value }],
  }));

  // Render empty state if no items
  if (items.length === 0 && !isLoading) {
    return (
      <WardrobeEmptyState
        type={emptyState?.type || 'empty'}
        searchQuery={emptyState?.searchQuery}
        activeFiltersCount={emptyState?.activeFiltersCount}
        onAddItem={emptyState?.onAddItem}
        onClearSearch={emptyState?.onClearSearch}
        onClearFilters={emptyState?.onClearFilters}
      />
    );
  }

  // Render loading state
  if (isLoading && items.length === 0) {
    return <WardrobeLoadingState viewMode={viewMode} />;
  }

  // Get optimization props based on list size
  const optimizationProps = optimizeForLargeList(items.length);

  return (
    <Animated.View style={[styles.container, animatedStyle]} testID={testID}>
      <RecyclerListView
        dataProvider={dataProvider}
        layoutProvider={layoutProvider}
        rowRenderer={rowRenderer}
        renderFooter={() =>
          isLoading ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" color={Colors.primary[500]} />
            </View>
          ) : null
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        renderAheadOffset={1000}
        scrollViewProps={{
          refreshControl: onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary[500]]}
              tintColor={Colors.primary[500]}
            />
          ) : undefined,
          onScrollBeginDrag: handleScrollStart,
          onScrollEndDrag: handleScrollEnd,
          onScroll: handleScroll,
          scrollEventThrottle: 16,
        }}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        {...optimizationProps}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default memo(OptimizedWardrobeList);
