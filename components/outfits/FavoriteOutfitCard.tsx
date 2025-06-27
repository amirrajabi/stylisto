import { Image } from 'expo-image';
import { Heart, Sparkles, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { ClothingItem } from '../../types/wardrobe';
import { useAccessibility } from '../ui/AccessibilityProvider';
import { AccessibleText } from '../ui/AccessibleText';

interface FavoriteOutfit {
  id: string;
  name: string;
  items: ClothingItem[];
  created_at: string;
  occasion?: string;
  source_type?: 'ai_generated' | 'manual';
}

interface FavoriteOutfitCardProps {
  outfit: FavoriteOutfit;
  onPress: (outfit: FavoriteOutfit) => void;
  onToggleFavorite: (outfitId: string) => void;
  style?: ViewStyle;
}

export const FavoriteOutfitCard: React.FC<FavoriteOutfitCardProps> = ({
  outfit,
  onPress,
  onToggleFavorite,
  style,
}) => {
  const { colors } = useAccessibility();

  const displayItems = outfit.items?.slice(0, 4) || [];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface.primary,
          borderColor: colors.border.primary,
        },
        style,
      ]}
      onPress={() => onPress(outfit)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`View outfit ${outfit.name}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          {outfit.source_type === 'ai_generated' && (
            <Sparkles
              size={14}
              color={colors.primary[500]}
              style={styles.sourceIcon}
            />
          )}
          {outfit.source_type === 'manual' && (
            <User
              size={14}
              color={colors.secondary[500]}
              style={styles.sourceIcon}
            />
          )}
          <AccessibleText
            style={[styles.outfitName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {outfit.name}
          </AccessibleText>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavorite(outfit.id)}
          style={styles.favoriteButton}
          accessibilityRole="button"
          accessibilityLabel="Remove from favorites"
        >
          <Heart
            size={20}
            color={colors.error[500]}
            fill={colors.error[500]}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </View>

      {/* Items Grid */}
      <View style={styles.itemsGrid}>
        {displayItems.map((item, index) => (
          <View key={item.id || index} style={styles.itemContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
              placeholder="Loading..."
            />
          </View>
        ))}

        {/* Empty slots for consistent grid */}
        {Array.from({ length: Math.max(0, 4 - displayItems.length) }).map(
          (_, index) => (
            <View
              key={`empty-${index}`}
              style={[
                styles.itemContainer,
                styles.emptySlot,
                { backgroundColor: colors.surface.secondary },
              ]}
            />
          )
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {outfit.occasion && (
          <AccessibleText
            style={[styles.occasionText, { color: colors.text.secondary }]}
            numberOfLines={1}
          >
            {outfit.occasion}
          </AccessibleText>
        )}
        <AccessibleText
          style={[styles.dateText, { color: colors.text.tertiary }]}
        >
          {new Date(outfit.created_at).toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
          })}
        </AccessibleText>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    marginRight: Spacing.xs,
  },
  outfitName: {
    fontSize: Typography.body.medium.fontSize,
    fontWeight: Typography.body.medium.fontWeight,
    fontFamily: Typography.body.medium.fontFamily,
    flex: 1,
    marginRight: Spacing.sm,
  },
  favoriteButton: {
    padding: Spacing.xs,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  itemContainer: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: Spacing.xs,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  occasionText: {
    fontSize: Typography.caption.medium.fontSize,
    fontFamily: Typography.caption.medium.fontFamily,
    flex: 1,
  },
  dateText: {
    fontSize: Typography.caption.small.fontSize,
    fontFamily: Typography.caption.small.fontFamily,
  },
});
