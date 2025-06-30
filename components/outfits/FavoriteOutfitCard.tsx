import { Image } from 'expo-image';
import { Heart, Sparkles, User } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
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
  is_favorite?: boolean;
}

interface FavoriteOutfitCardProps {
  outfit: FavoriteOutfit;
  onPress: (outfit: FavoriteOutfit) => void;
  onToggleFavorite: (outfitId: string) => void;
  style?: ViewStyle;
  showOnlyFavorites?: boolean;
}

export const FavoriteOutfitCard: React.FC<FavoriteOutfitCardProps> = ({
  outfit,
  onPress,
  onToggleFavorite,
  style,
  showOnlyFavorites = true,
}) => {
  const { colors } = useAccessibility();

  // Debug logging
  console.log(`🎯 FavoriteOutfitCard - ${outfit.name}:`, {
    is_favorite: outfit.is_favorite,
    showOnlyFavorites,
    shouldShowRed: showOnlyFavorites || outfit.is_favorite,
  });

  const displayItems = outfit.items?.slice(0, 4) || [];

  return (
    <TouchableOpacity
      style={[styles.modernCard, style]}
      onPress={() => onPress(outfit)}
      activeOpacity={0.95}
      accessibilityRole="button"
      accessibilityLabel={`View outfit ${outfit.name}`}
    >
      {/* Header with Title and Favorite */}
      <View style={styles.modernHeader}>
        <View style={styles.titleRow}>
          {outfit.source_type === 'ai_generated' && (
            <Sparkles size={12} color="#a855f7" style={styles.sourceIcon} />
          )}
          {outfit.source_type === 'manual' && (
            <User size={12} color="#a855f7" style={styles.sourceIcon} />
          )}
          <AccessibleText
            style={styles.modernOutfitName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {outfit.name}
          </AccessibleText>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavorite(outfit.id)}
          style={styles.modernFavoriteButton}
          accessibilityRole="button"
          accessibilityLabel={
            showOnlyFavorites || outfit.is_favorite
              ? 'Remove from favorites'
              : 'Add to favorites'
          }
        >
          <Heart
            size={16}
            color={
              showOnlyFavorites || outfit.is_favorite ? '#ef4444' : '#9ca3af'
            }
            fill={
              showOnlyFavorites || outfit.is_favorite
                ? '#ef4444'
                : 'transparent'
            }
            strokeWidth={1.5}
          />
        </TouchableOpacity>
      </View>

      {/* Modern Items Grid */}
      <View style={styles.modernItemsGrid}>
        {displayItems.length >= 2 ? (
          <>
            {/* Main item (larger) */}
            <View style={styles.mainItemContainer}>
              <Image
                source={{ uri: displayItems[0]?.imageUrl }}
                style={styles.mainItemImage}
                contentFit="cover"
                placeholder="Loading..."
              />
            </View>

            {/* Secondary items */}
            <View style={styles.secondaryItemsContainer}>
              {displayItems.slice(1, 4).map((item, index) => (
                <View
                  key={item.id || index}
                  style={styles.secondaryItemContainer}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.secondaryItemImage}
                    contentFit="cover"
                    placeholder="Loading..."
                  />
                </View>
              ))}

              {/* Fill remaining slots if needed */}
              {Array.from({
                length: Math.max(0, 3 - displayItems.slice(1).length),
              }).map((_, index) => (
                <View
                  key={`empty-${index}`}
                  style={[styles.secondaryItemContainer, styles.emptySlot]}
                />
              ))}
            </View>
          </>
        ) : displayItems.length === 1 ? (
          <View style={styles.singleItemContainer}>
            <Image
              source={{ uri: displayItems[0]?.imageUrl }}
              style={styles.singleItemImage}
              contentFit="cover"
              placeholder="Loading..."
            />
          </View>
        ) : (
          <View style={styles.emptyOutfitContainer}>
            <AccessibleText style={styles.emptyOutfitText}>
              No Items
            </AccessibleText>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.modernFooter}>
        <AccessibleText style={styles.modernDateText}>
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
  modernCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  modernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    marginRight: 4,
  },
  modernOutfitName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter-SemiBold',
    flex: 1,
  },
  modernFavoriteButton: {
    padding: 4,
  },
  modernItemsGrid: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    minHeight: 100,
  },
  mainItemContainer: {
    flex: 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  mainItemImage: {
    width: '100%',
    height: 100,
  },
  secondaryItemsContainer: {
    flex: 1,
    gap: 4,
  },
  secondaryItemContainer: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    minHeight: 30,
  },
  secondaryItemImage: {
    width: '100%',
    height: '100%',
  },
  singleItemContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  singleItemImage: {
    width: '100%',
    height: 100,
  },
  emptyOutfitContainer: {
    flex: 1,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  emptyOutfitText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Inter-Regular',
  },
  emptySlot: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  modernFooter: {
    alignItems: 'flex-end',
  },
  modernDateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: 'Inter-Regular',
  },
});
