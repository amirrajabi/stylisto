import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Heart, RefreshCw, Share2, Sparkles, ThermometerSun, Calendar, Tag } from 'lucide-react-native';
import { GeneratedOutfit } from '../../lib/outfitGenerator';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface OutfitRecommendationCardProps {
  outfit: GeneratedOutfit;
  onSave: () => void;
  onRefresh: () => void;
  onShare: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  weatherData?: {
    temperature: number;
    condition: string;
  };
  occasion?: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const OutfitRecommendationCard: React.FC<OutfitRecommendationCardProps> = ({
  outfit,
  onSave,
  onRefresh,
  onShare,
  onSwipeLeft,
  onSwipeRight,
  weatherData,
  occasion,
}) => {
  const translateX = useSharedValue(0);
  const cardRotate = useSharedValue(0);
  const cardScale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const refreshScale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  
  // Format score as percentage
  const matchScore = Math.round(outfit.score.total * 100);
  
  // Get primary item for display
  const primaryItem = outfit.items.find(item => 
    item.category === 'tops' || item.category === 'dresses'
  ) || outfit.items[0];
  
  // Get secondary items for display
  const secondaryItems = outfit.items.filter(item => item.id !== primaryItem.id);
  
  // Generate styling description
  const getStylingDescription = () => {
    const categories = outfit.items.map(item => item.category);
    const colors = outfit.items.map(item => item.color);
    
    let description = 'This outfit combines ';
    
    if (categories.includes('tops') && categories.includes('bottoms')) {
      description += 'a top with bottoms';
    } else if (categories.includes('dresses')) {
      description += 'a dress';
    } else {
      description += 'multiple pieces';
    }
    
    if (categories.includes('outerwear')) {
      description += ' and a layered outer piece';
    }
    
    if (categories.includes('accessories')) {
      description += ' with complementary accessories';
    }
    
    description += '. The color palette ';
    
    const colorHarmony = determineColorHarmony(colors);
    switch (colorHarmony) {
      case 'monochromatic':
        description += 'features a sophisticated monochromatic scheme';
        break;
      case 'analogous':
        description += 'uses harmonious analogous colors';
        break;
      case 'complementary':
        description += 'balances complementary colors for visual interest';
        break;
      case 'triadic':
        description += 'incorporates a dynamic triadic color arrangement';
        break;
      case 'neutral':
        description += 'relies on versatile neutral tones';
        break;
      default:
        description += 'creates a balanced visual appeal';
    }
    
    if (occasion) {
      description += `, perfect for ${occasion} occasions`;
    }
    
    if (weatherData) {
      description += `. Suitable for ${weatherData.temperature}°C ${weatherData.condition} weather`;
    }
    
    return description + '.';
  };
  
  // Determine color harmony type (simplified version)
  const determineColorHarmony = (colors: string[]): string => {
    // This is a simplified version - the full implementation would be in colorTheory.ts
    return 'complementary'; // Placeholder
  };

  // Gesture handler for swipe
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      cardRotate.value = event.translationX / 20;
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD && onSwipeRight) {
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(onSwipeRight)();
        });
      } else if (event.translationX < -SWIPE_THRESHOLD && onSwipeLeft) {
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 300 }, () => {
          runOnJS(onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        cardRotate.value = withSpring(0);
      }
    });

  // Button press animations
  const handleSavePress = useCallback(() => {
    heartScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    onSave();
  }, [onSave, heartScale]);

  const handleRefreshPress = useCallback(() => {
    refreshScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    onRefresh();
  }, [onRefresh, refreshScale]);

  const handleSharePress = useCallback(() => {
    shareScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    onShare();
  }, [onShare, shareScale]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { rotate: `${cardRotate.value}deg` },
        { scale: cardScale.value },
      ],
    };
  });

  const heartAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartScale.value }],
    };
  });

  const refreshAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: refreshScale.value }],
    };
  });

  const shareAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: shareScale.value }],
    };
  });

  // Like indicator styles
  const likeIndicatorStyle = useAnimatedStyle(() => {
    const opacity = translateX.value > SWIPE_THRESHOLD / 2 ? 
      withTiming(1, { duration: 200 }) : 
      withTiming(0, { duration: 200 });
    
    return {
      opacity,
      transform: [
        { scale: opacity },
        { rotate: '-30deg' },
      ],
    };
  });

  // Skip indicator styles
  const skipIndicatorStyle = useAnimatedStyle(() => {
    const opacity = translateX.value < -SWIPE_THRESHOLD / 2 ? 
      withTiming(1, { duration: 200 }) : 
      withTiming(0, { duration: 200 });
    
    return {
      opacity,
      transform: [
        { scale: opacity },
        { rotate: '30deg' },
      ],
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, cardAnimatedStyle]}>
        {/* Like Indicator */}
        <Animated.View style={[styles.indicator, styles.likeIndicator, likeIndicatorStyle]}>
          <Text style={styles.indicatorText}>LIKE</Text>
        </Animated.View>
        
        {/* Skip Indicator */}
        <Animated.View style={[styles.indicator, styles.skipIndicator, skipIndicatorStyle]}>
          <Text style={styles.indicatorText}>SKIP</Text>
        </Animated.View>
        
        <View style={styles.card}>
          {/* Header with match score and weather */}
          <View style={styles.header}>
            <View style={styles.matchScore}>
              <Sparkles size={16} color={Colors.primary[700]} />
              <Text style={styles.matchScoreText}>{matchScore}% Match</Text>
            </View>
            
            {weatherData && (
              <View style={styles.weatherInfo}>
                <ThermometerSun size={16} color={Colors.text.secondary} />
                <Text style={styles.weatherText}>
                  {weatherData.temperature}°C • {weatherData.condition}
                </Text>
              </View>
            )}
            
            {occasion && (
              <View style={styles.occasionTag}>
                <Calendar size={14} color={Colors.white} />
                <Text style={styles.occasionText}>{occasion}</Text>
              </View>
            )}
          </View>
          
          {/* Primary Item Image */}
          <View style={styles.primaryImageContainer}>
            <Image
              source={{ uri: primaryItem.imageUrl }}
              style={styles.primaryImage}
              contentFit="cover"
              transition={300}
            />
          </View>
          
          {/* Secondary Items */}
          <View style={styles.secondaryItemsContainer}>
            {secondaryItems.slice(0, 3).map((item, index) => (
              <View key={item.id} style={styles.secondaryItemWrapper}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.secondaryImage}
                  contentFit="cover"
                  transition={300}
                />
                <View style={styles.itemCategory}>
                  <Tag size={10} color={Colors.white} />
                  <Text style={styles.itemCategoryText}>{item.category}</Text>
                </View>
              </View>
            ))}
            
            {secondaryItems.length > 3 && (
              <View style={styles.moreItemsContainer}>
                <Text style={styles.moreItemsText}>+{secondaryItems.length - 3} more</Text>
              </View>
            )}
          </View>
          
          {/* Styling Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionText}>
              {getStylingDescription()}
            </Text>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <AnimatedTouchableOpacity 
              style={[styles.actionButton, styles.refreshButton, refreshAnimatedStyle]}
              onPress={handleRefreshPress}
            >
              <RefreshCw size={20} color={Colors.text.primary} />
            </AnimatedTouchableOpacity>
            
            <AnimatedTouchableOpacity 
              style={[styles.actionButton, styles.saveButton, heartAnimatedStyle]}
              onPress={handleSavePress}
            >
              <Heart size={24} color={Colors.error[500]} fill={Colors.error[500]} />
            </AnimatedTouchableOpacity>
            
            <AnimatedTouchableOpacity 
              style={[styles.actionButton, styles.shareButton, shareAnimatedStyle]}
              onPress={handleSharePress}
            >
              <Share2 size={20} color={Colors.text.primary} />
            </AnimatedTouchableOpacity>
          </View>
          
          {/* Score Breakdown */}
          <View style={styles.scoreBreakdown}>
            <Text style={styles.scoreBreakdownTitle}>Match Score Breakdown</Text>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Color Harmony</Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${outfit.score.breakdown.colorHarmony * 100}%` },
                    getScoreBarColor(outfit.score.breakdown.colorHarmony),
                  ]} 
                />
              </View>
              <Text style={styles.scoreItemValue}>
                {Math.round(outfit.score.breakdown.colorHarmony * 100)}%
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Style Matching</Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${outfit.score.breakdown.styleMatching * 100}%` },
                    getScoreBarColor(outfit.score.breakdown.styleMatching),
                  ]} 
                />
              </View>
              <Text style={styles.scoreItemValue}>
                {Math.round(outfit.score.breakdown.styleMatching * 100)}%
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Occasion</Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${outfit.score.breakdown.occasionSuitability * 100}%` },
                    getScoreBarColor(outfit.score.breakdown.occasionSuitability),
                  ]} 
                />
              </View>
              <Text style={styles.scoreItemValue}>
                {Math.round(outfit.score.breakdown.occasionSuitability * 100)}%
              </Text>
            </View>
            
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>Season</Text>
              <View style={styles.scoreBarContainer}>
                <View 
                  style={[
                    styles.scoreBar, 
                    { width: `${outfit.score.breakdown.seasonSuitability * 100}%` },
                    getScoreBarColor(outfit.score.breakdown.seasonSuitability),
                  ]} 
                />
              </View>
              <Text style={styles.scoreItemValue}>
                {Math.round(outfit.score.breakdown.seasonSuitability * 100)}%
              </Text>
            </View>
            
            {weatherData && (
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>Weather</Text>
                <View style={styles.scoreBarContainer}>
                  <View 
                    style={[
                      styles.scoreBar, 
                      { width: `${outfit.score.breakdown.weatherSuitability * 100}%` },
                      getScoreBarColor(outfit.score.breakdown.weatherSuitability),
                    ]} 
                  />
                </View>
                <Text style={styles.scoreItemValue}>
                  {Math.round(outfit.score.breakdown.weatherSuitability * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

// Helper function to get score bar color based on score
const getScoreBarColor = (score: number) => {
  if (score >= 0.8) return { backgroundColor: Colors.success[500] };
  if (score >= 0.6) return { backgroundColor: Colors.primary[500] };
  if (score >= 0.4) return { backgroundColor: Colors.warning[500] };
  return { backgroundColor: Colors.error[500] };
};

// Animation helper
const withSequence = (first: number, second: number) => {
  'worklet';
  return withTiming(first, { duration: 150 }, () => {
    return withTiming(second, { duration: 150 });
  });
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignSelf: 'center',
    position: 'relative',
  },
  card: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.xl,
    padding: Spacing.lg,
    ...Shadows.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  matchScore: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
  },
  matchScoreText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  weatherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  weatherText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  occasionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary[500],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
  },
  occasionText: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  primaryImageContainer: {
    height: 300,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  primaryImage: {
    width: '100%',
    height: '100%',
  },
  secondaryItemsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  secondaryItemWrapper: {
    flex: 1,
    height: 100,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  secondaryImage: {
    width: '100%',
    height: '100%',
  },
  itemCategory: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemCategoryText: {
    ...Typography.caption.small,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  moreItemsContainer: {
    flex: 1,
    height: 100,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  descriptionContainer: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  descriptionText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: Spacing.md,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  refreshButton: {
    backgroundColor: Colors.surface.secondary,
  },
  saveButton: {
    backgroundColor: Colors.white,
    width: 70,
    height: 70,
  },
  shareButton: {
    backgroundColor: Colors.surface.secondary,
  },
  scoreBreakdown: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
  },
  scoreBreakdownTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreItemLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    width: 100,
  },
  scoreBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    marginHorizontal: Spacing.sm,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  scoreItemValue: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    width: 40,
    textAlign: 'right',
  },
  indicator: {
    position: 'absolute',
    top: 40,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderWidth: 4,
    borderRadius: 75,
  },
  likeIndicator: {
    right: 10,
    borderColor: Colors.success[500],
    transform: [{ rotate: '-30deg' }],
  },
  skipIndicator: {
    left: 10,
    borderColor: Colors.error[500],
    transform: [{ rotate: '30deg' }],
  },
  indicatorText: {
    ...Typography.heading.h2,
    fontWeight: '800',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});