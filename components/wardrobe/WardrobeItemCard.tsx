import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Heart, MoreVertical } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { ClothingItem } from '../../types/wardrobe';
import { formatDate, getSeasonColor } from '../../utils/wardrobeUtils';
import OptimizedImage from '../ui/OptimizedImage';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface WardrobeItemCardProps {
  item: ClothingItem;
  viewMode: 'grid' | 'list';
  isSelected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFavorite: () => void;
  onMoreOptions: () => void;
  showStats?: boolean;
  index: number;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const WardrobeItemCard: React.FC<WardrobeItemCardProps> = ({
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
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  // Initialize animations
  React.useEffect(() => {
    // Stagger animations based on index
    const delay = Math.min(index * 50, 500);
    
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 300 })
    );
    
    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: 300 })
    );
  }, [index]);
  
  // Handle press animations
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 10, stiffness: 200 });
  }, []);
  
  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, []);
  
  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));
  
  // Render grid or list view
  if (viewMode === 'list') {
    return (
      <AnimatedTouchableOpacity
        style={[styles.listCard, isSelected && styles.selectedCard, animatedStyle]}
        onPress={onPress}
        onLongPress={onLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        accessibilityLabel={`${item.name}, ${item.category}`}
        accessibilityHint="Double tap to view details, long press to select"
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.listImageContainer}>
          <OptimizedImage
            source={{ uri: item.imageUrl }}
            style={styles.listImage}
            contentFit="cover"
            transition={200}
            priority={index < 10 ? 'high' : 'normal'}
            placeholder={{ uri: 'https://via.placeholder.com/88?text=Loading' }}
          />
          
          {isSelected && (
            <View style={styles.selectionOverlay}>
              <View style={styles.checkmark} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text 
              style={styles.listTitle} 
              numberOfLines={1}
              accessibilityLabel={item.name}
            >
              {item.name}
            </Text>
            <View style={styles.listActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onToggleFavorite}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
                accessibilityRole="button"
              >
                <Heart
                  size={18}
                  color={item.isFavorite ? Colors.error[500] : Colors.text.tertiary}
                  fill={item.isFavorite ? Colors.error[500] : 'transparent'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={onMoreOptions}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="More options"
                accessibilityRole="button"
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
              <Text style={styles.statText}>
                Worn {item.timesWorn} times
              </Text>
              {item.lastWorn && (
                <Text style={styles.statText}>
                  Last: {formatDate(item.lastWorn)}
                </Text>
              )}
            </View>
          )}

          <View style={styles.listTags}>
            {item.season.slice(0, 2).map((season) => (
              <View
                key={season}
                style={[styles.seasonTag, { backgroundColor: getSeasonColor(season) }]}
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
      style={[styles.gridCard, isSelected && styles.selectedCard, animatedStyle]}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      accessibilityLabel={`${item.name}, ${item.category}`}
      accessibilityHint="Double tap to view details, long press to select"
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      <View style={styles.gridImageContainer}>
        <OptimizedImage
          source={{ uri: item.imageUrl }}
          style={styles.gridImage}
          contentFit="cover"
          transition={200}
          priority={index < 10 ? 'high' : 'normal'}
          placeholder={{ uri: 'https://via.placeholder.com/200?text=Loading' }}
        />
        
        <View style={styles.gridOverlay}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
            accessibilityRole="button"
          >
            <Heart
              size={16}
              color={item.isFavorite ? Colors.error[500] : Colors.white}
              fill={item.isFavorite ? Colors.error[500] : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={onMoreOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="More options"
            accessibilityRole="button"
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
        <Text 
          style={styles.gridTitle} 
          numberOfLines={2}
          accessibilityLabel={item.name}
        >
          {item.name}
        </Text>
        
        {item.brand && (
          <Text style={styles.gridBrand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}

        <View style={styles.gridTags}>
          {item.season.slice(0, 2).map((season) => (
            <View
              key={season}
              style={[styles.seasonTag, { backgroundColor: getSeasonColor(season) }]}
            >
              <Text style={styles.seasonText}>{season}</Text>
            </View>
          ))}
        </View>

        {showStats && (
          <View style={styles.gridStats}>
            <View style={styles.statRow}>
              <Text style={styles.gridStatText}>{item.timesWorn} worn</Text>
            </View>
            {item.price && (
              <Text style={styles.gridPrice}>${item.price}</Text>
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
};

const styles = StyleSheet.create({
  // Grid styles
  gridCard: {
    width: cardWidth,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  gridImageContainer: {
    position: 'relative',
    height: cardWidth * 1.2,
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
    height: 120,
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

export default memo(WardrobeItemCard);