import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { GeneratedOutfit } from '../../lib/outfitGenerator';
import { OutfitRecommendationCard } from './OutfitRecommendationCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OutfitRecommendationCarouselProps {
  outfits: GeneratedOutfit[];
  onSaveOutfit: (index: number) => void;
  onRefreshOutfit: (index: number) => void;
  weatherData?: {
    temperature: number;
    condition: string;
  };
  occasion?: string;
  onSwipeEnd?: (index: number) => void;
}

interface PaginationDotProps {
  index: number;
  scrollX: Animated.SharedValue<number>;
  activeIndex: number;
}

const PaginationDot: React.FC<PaginationDotProps> = ({
  index,
  scrollX,
  activeIndex,
}) => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 16, 8],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolate.CLAMP
    );

    const backgroundColor =
      index === activeIndex ? Colors.primary[700] : Colors.neutral[300];

    return {
      width,
      opacity,
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.paginationDot, dotStyle]} />;
};

export const OutfitRecommendationCarousel: React.FC<
  OutfitRecommendationCarouselProps
> = ({
  outfits,
  onSaveOutfit,
  onRefreshOutfit,
  weatherData,
  occasion,
  onSwipeEnd,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Handle scroll events
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      scrollX.value = event.contentOffset.x;
    },
    onMomentumEnd: event => {
      const newIndex = Math.round(event.contentOffset.x / SCREEN_WIDTH);
      runOnJS(setActiveIndex)(newIndex);
      if (onSwipeEnd) {
        runOnJS(onSwipeEnd)(newIndex);
      }
    },
  });

  // Share outfit
  const handleShareOutfit = useCallback(
    async (index: number = activeIndex) => {
      try {
        const outfit = outfits[index];
        const message = `Check out this outfit I found on Stylisto!\n\n${outfit.items
          .map(item => `• ${item.name} (${item.category})`)
          .join('\n')}`;

        await Share.share({
          message,
          title: 'Stylisto Outfit',
          url: Platform.OS === 'web' ? window.location.href : undefined,
        });
      } catch (error) {
        console.error('Error sharing outfit:', error);
      }
    },
    [outfits, activeIndex]
  );

  // Handle swipe left/right
  const handleSwipeLeft = useCallback(
    (index: number) => {
      const nextIndex = Math.min(index + 1, outfits.length - 1);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    },
    [outfits.length]
  );

  const handleSwipeRight = useCallback((index: number) => {
    const prevIndex = Math.max(index - 1, 0);
    scrollViewRef.current?.scrollTo({
      x: prevIndex * SCREEN_WIDTH,
      animated: true,
    });
  }, []);

  // Pagination dots
  const renderPaginationDots = () => {
    return (
      <View style={styles.paginationContainer}>
        {outfits.map((_, index) => (
          <PaginationDot
            key={index}
            index={index}
            scrollX={scrollX}
            activeIndex={activeIndex}
          />
        ))}
      </View>
    );
  };

  if (outfits.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No outfits available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {outfits.map((outfit, index) => (
          <View key={index} style={styles.cardContainer}>
            <OutfitRecommendationCard
              outfit={outfit}
              onSave={() => onSaveOutfit(index)}
              onRefresh={() => onRefreshOutfit(index)}
              onShare={() => handleShareOutfit(index)}
              onSwipeLeft={() => handleSwipeLeft(index)}
              onSwipeRight={() => handleSwipeRight(index)}
              weatherData={weatherData}
              occasion={occasion}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {renderPaginationDots()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.xs,
  },
  cardContainer: {
    width: SCREEN_WIDTH,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    height: 16,
  },
  paginationDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
});
