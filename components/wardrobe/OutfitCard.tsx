import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  withDelay
} from 'react-native-reanimated';
import { Heart, MoveVertical as MoreVertical, Users, Calendar, Clock } from 'lucide-react-native';
import { Outfit } from '../../types/wardrobe';
import { formatDate, getOccasionColor } from '../../utils/wardrobeUtils';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface OutfitCardProps {
  outfit: Outfit;
  onPress: () => void;
  onToggleFavorite: () => void;
  onMoreOptions: () => void;
  showStats?: boolean;
  isHighlighted?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onPress,
  onToggleFavorite,
  onMoreOptions,
  showStats = false,
  isHighlighted = false,
}) => {
  const mainImage = outfit.items[0]?.imageUrl;
  const itemCount = outfit.items.length;
  
  // Animation values
  const scale = useSharedValue(isHighlighted ? 0.95 : 1);
  const highlight = useSharedValue(isHighlighted ? 1 : 0);
  
  // Apply highlight animation if needed
  React.useEffect(() => {
    if (isHighlighted) {
      scale.value = withSequence(
        withSpring(0.95, { damping: 10 }),
        withDelay(300, withSpring(1, { damping: 15 }))
      );
      
      highlight.value = withSequence(
        withSpring(1),
        withDelay(1000, withSpring(0, { damping: 20 }))
      );
    }
  }, [isHighlighted]);
  
  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      borderColor: highlight.value > 0 
        ? `rgba(59, 130, 246, ${highlight.value})` 
        : 'transparent',
      borderWidth: highlight.value > 0 ? 2 : 0,
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[styles.card, cardAnimatedStyle]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Users size={40} color="#9ca3af" />
          </View>
        )}
        
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={20}
              color={outfit.isFavorite ? '#ef4444' : '#ffffff'}
              fill={outfit.isFavorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={onMoreOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{itemCount} items</Text>
        </View>
        
        {/* Preview of other items in outfit */}
        {outfit.items.length > 1 && (
          <View style={styles.itemsPreview}>
            {outfit.items.slice(1, 4).map((item, index) => (
              <View key={item.id} style={[
                styles.previewItem,
                { right: index * 20 }
              ]}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.previewImage}
                  contentFit="cover"
                />
              </View>
            ))}
            
            {outfit.items.length > 4 && (
              <View style={[styles.previewItem, { right: 3 * 20 }]}>
                <View style={styles.moreItemsIndicator}>
                  <Text style={styles.moreItemsText}>+{outfit.items.length - 4}</Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {outfit.name}
        </Text>

        <View style={styles.occasionContainer}>
          {outfit.occasion.slice(0, 3).map((occasion, index) => (
            <View
              key={occasion}
              style={[styles.occasionTag, { backgroundColor: getOccasionColor(occasion) }]}
            >
              <Text style={styles.occasionText}>{occasion}</Text>
            </View>
          ))}
          
          {outfit.occasion.length > 3 && (
            <View style={styles.moreOccasionsTag}>
              <Text style={styles.moreOccasionsText}>+{outfit.occasion.length - 3}</Text>
            </View>
          )}
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Clock size={14} color={Colors.text.secondary} />
              <Text style={styles.statsText}>
                Worn {outfit.timesWorn} times
              </Text>
            </View>
            {outfit.lastWorn && (
              <View style={styles.statItem}>
                <Calendar size={14} color={Colors.text.secondary} />
                <Text style={styles.statsText}>
                  Last: {formatDate(outfit.lastWorn)}
                </Text>
              </View>
            )}
          </View>
        )}

        {outfit.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {outfit.notes}
          </Text>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  itemCountText: {
    ...Typography.caption.medium,
    color: Colors.white,
  },
  itemsPreview: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    height: 40,
  },
  previewItem: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 2,
    borderColor: Colors.white,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  moreItemsIndicator: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreItemsText: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  occasionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  occasionTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  occasionText: {
    ...Typography.caption.small,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  moreOccasionsTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.neutral[400],
  },
  moreOccasionsText: {
    ...Typography.caption.small,
    color: Colors.white,
  },
  statsContainer: {
    marginBottom: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  statsText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  notes: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
});