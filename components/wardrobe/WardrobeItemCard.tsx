import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoveVertical as MoreVertical, Eye, Calendar, DollarSign } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface WardrobeItem {
  id: string;
  name: string;
  category: string;
  color: string;
  brand?: string;
  size?: string;
  image_url: string;
  is_favorite: boolean;
  times_worn: number;
  last_worn?: string;
  price?: number;
  seasons: string[];
  occasions: string[];
  tags: string[];
  created_at: string;
}

interface WardrobeItemCardProps {
  item: WardrobeItem;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFavorite: () => void;
  onMoreOptions: () => void;
  showStats?: boolean;
  index: number;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (screenWidth - Spacing.lg * 3) / 2;
const LIST_ITEM_HEIGHT = 120;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const WardrobeItemCard = memo<WardrobeItemCardProps>(({
  item,
  viewMode,
  isSelected = false,
  onPress,
  onLongPress,
  onToggleFavorite,
  onMoreOptions,
  showStats = false,
  index,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  React.useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 + index * 50 });
    translateY.value = withTiming(0, { duration: 300 + index * 50 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPrice = (price?: number) => {
    if (!price) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getSeasonColor = (season: string) => {
    const colors = {
      spring: Colors.success[400],
      summer: Colors.warning[400],
      fall: Colors.secondary[400],
      winter: Colors.info[400],
    };
    return colors[season as keyof typeof colors] || Colors.neutral[400];
  };

  if (viewMode === 'list') {
    return (
      <AnimatedTouchableOpacity
        style={[
          styles.listCard,
          isSelected && styles.selectedCard,
          animatedStyle,
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View style={styles.listImageContainer}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.listImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
          />
          {isSelected && (
            <View style={styles.selectionOverlay}>
              <View style={styles.checkmark} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={18}
                  color={item.is_favorite ? Colors.error[500] : Colors.text.tertiary}
                  fill={item.is_favorite ? Colors.error[500] : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onMoreOptions}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MoreVertical size={18} color={Colors.text.tertiary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.listMeta}>
            {item.brand && (
              <Text style={styles.listBrand} numberOfLines={1}>
                {item.brand}
              </Text>
            )}
            <Text style={styles.listCategory}>
              {item.category.replace('_', ' ')}
            </Text>
          </View>

          {showStats && (
            <View style={styles.listStats}>
              <View style={styles.statItem}>
                <Eye size={12} color={Colors.text.tertiary} />
                <Text style={styles.statText}>{item.times_worn}</Text>
              </View>
              <View style={styles.statItem}>
                <Calendar size={12} color={Colors.text.tertiary} />
                <Text style={styles.statText}>{formatDate(item.last_worn)}</Text>
              </View>
              {item.price && (
                <View style={styles.statItem}>
                  <DollarSign size={12} color={Colors.text.tertiary} />
                  <Text style={styles.statText}>{formatPrice(item.price)}</Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.listTags}>
            {item.seasons.slice(0, 2).map((season) => (
              <View
                key={season}
                style={[
                  styles.seasonTag,
                  { backgroundColor: getSeasonColor(season) },
                ]}
              >
                <Text style={styles.seasonText}>{season}</Text>
              </View>
            ))}
          </View>
        </View>
      </AnimatedTouchableOpacity>
    );
  }

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.gridCard,
        isSelected && styles.selectedCard,
        animatedStyle,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
    >
      <View style={styles.gridImageContainer}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        
        <View style={styles.gridOverlay}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={16}
              color={item.is_favorite ? Colors.error[500] : Colors.white}
              fill={item.is_favorite ? Colors.error[500] : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={onMoreOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={16} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.checkmark} />
          </View>
        )}
      </View>

      <View style={styles.gridContent}>
        <Text style={styles.gridTitle} numberOfLines={2}>
          {item.name}
        </Text>
        
        {item.brand && (
          <Text style={styles.gridBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}

        <View style={styles.gridTags}>
          {item.seasons.slice(0, 2).map((season) => (
            <View
              key={season}
              style={[
                styles.seasonTag,
                { backgroundColor: getSeasonColor(season) },
              ]}
            >
              <Text style={styles.seasonText}>{season}</Text>
            </View>
          ))}
        </View>

        {showStats && (
          <View style={styles.gridStats}>
            <View style={styles.statRow}>
              <Eye size={10} color={Colors.text.tertiary} />
              <Text style={styles.gridStatText}>{item.times_worn}</Text>
            </View>
            {item.price && (
              <Text style={styles.gridPrice}>{formatPrice(item.price)}</Text>
            )}
          </View>
        )}

        <View style={styles.colorIndicator}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.categoryText}>
            {item.category.replace('_', ' ')}
          </Text>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
});

const styles = StyleSheet.create({
  // Grid styles
  gridCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  gridImageContainer: {
    position: 'relative',
    height: GRID_ITEM_WIDTH * 1.2,
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContent: {
    padding: Spacing.md,
  },
  gridTitle: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  gridBrand: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  gridTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  gridStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  gridStatText: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
  },
  gridPrice: {
    ...Typography.caption.medium,
    color: Colors.success[600],
    fontWeight: '600',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  categoryText: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },

  // List styles
  listCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    height: LIST_ITEM_HEIGHT,
    ...Shadows.sm,
  },
  listImageContainer: {
    position: 'relative',
    width: 88,
    height: 88,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    marginRight: Spacing.md,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listTitle: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  listActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  listMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listBrand: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  listCategory: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    textTransform: 'capitalize',
  },
  listStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
  },
  listTags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },

  // Shared styles
  selectedCard: {
    borderWidth: 2,
    borderColor: Colors.primary[700],
  },
  selectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Layout.borderRadius.sm,
  },
  seasonText: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});