import { Image } from 'expo-image';
import { Heart } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { OutfitService } from '../../lib/outfitService';
import { ClothingItem } from '../../types/wardrobe';
import { generateOutfitName } from '../../utils/outfitNaming';

interface OutfitCardProps {
  outfits: {
    id: string;
    name: string;
    items: ClothingItem[];
    score: {
      total: number;
      color: number;
      style: number;
      season: number;
      occasion: number;
    };
    isFavorite?: boolean;
  }[];
  onOutfitPress: (outfitId: string) => void;
  onSaveOutfit?: (outfitId: string) => void;
  onEditOutfit?: (outfitId: string) => void;
  onCurrentIndexChange?: (index: number) => void;
  onGoToIndex?: (index: number) => void;
  currentIndex?: number;
  onFavoriteToggled?: (outfitId: string, isFavorite: boolean) => void;
  onAIOutfitFavorited?: (outfitIndex: number) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.85;

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfits,
  onOutfitPress,
  onSaveOutfit,
  onEditOutfit,
  onCurrentIndexChange,
  onGoToIndex,
  currentIndex = 0,
  onFavoriteToggled,
  onAIOutfitFavorited,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [favoriteLoading, setFavoriteLoading] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const initialFavorites: Record<string, boolean> = {};
    outfits.forEach(outfit => {
      initialFavorites[outfit.id] = outfit.isFavorite || false;
    });
    setFavorites(initialFavorites);
  }, [outfits]);

  const handleToggleFavorite = async (outfitId: string) => {
    if (favoriteLoading[outfitId]) return;

    setFavoriteLoading(prev => ({ ...prev, [outfitId]: true }));

    try {
      // Use onSaveOutfit if available (this will show toast notifications)
      if (onSaveOutfit) {
        await onSaveOutfit(outfitId);

        // Update local favorite state
        setFavorites(prev => ({ ...prev, [outfitId]: true }));

        if (onFavoriteToggled) {
          onFavoriteToggled(outfitId, true);
        }

        // For AI generated outfits, trigger the callback to remove from memory
        if (outfitId.startsWith('outfit-') && onAIOutfitFavorited) {
          const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
          onAIOutfitFavorited(outfitIndex);
        }

        return;
      }

      // Fallback to direct OutfitService call if onSaveOutfit is not available
      let realOutfitId = outfitId;

      // Handle AI generated outfits - need to save them first
      if (outfitId.startsWith('outfit-')) {
        const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
        const outfit = outfits[outfitIndex];

        if (!outfit) {
          console.error('Outfit not found at index:', outfitIndex);
          return;
        }

        // Get existing outfit names to prevent duplicates
        const existingNames = outfits
          .filter((o, index) => index !== outfitIndex) // Exclude current outfit
          .map(o => o.name);
        const outfitName = generateOutfitName(outfit.items, existingNames);

        // Save the outfit first using the new method
        const saveResult = await OutfitService.saveSingleGeneratedOutfit(
          outfit,
          outfitName
        );

        if (saveResult.error || !saveResult.outfitId) {
          console.error(
            'Failed to save outfit before favoriting:',
            saveResult.error
          );
          return;
        }

        // Outfit is already saved as favorite, no need to toggle
        const newFavoriteStatus = true;
        setFavorites(prev => ({ ...prev, [outfitId]: newFavoriteStatus }));

        if (onFavoriteToggled) {
          onFavoriteToggled(outfitId, newFavoriteStatus);
        }

        if (onAIOutfitFavorited) {
          onAIOutfitFavorited(outfitIndex);
        }
        return;
      }

      // Handle manual outfits - extract real ID
      if (outfitId.startsWith('manual-db-')) {
        realOutfitId = outfitId.replace('manual-db-', '');
      }

      const result = await OutfitService.toggleOutfitFavorite(realOutfitId);

      if (result.error) {
        console.error('Failed to toggle favorite:', result.error);
        return;
      }

      const newFavoriteStatus = result.isFavorite || false;
      setFavorites(prev => ({ ...prev, [outfitId]: newFavoriteStatus }));

      if (onFavoriteToggled) {
        onFavoriteToggled(outfitId, newFavoriteStatus);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [outfitId]: false }));
    }
  };

  // Effect to scroll to currentIndex when it changes externally
  useEffect(() => {
    if (
      flatListRef.current &&
      currentIndex >= 0 &&
      currentIndex < outfits.length
    ) {
      flatListRef.current.scrollToIndex({
        index: currentIndex,
        animated: true,
      });
    }
  }, [currentIndex, outfits.length]);

  const getItemLayout = (data: any, index: number) => ({
    length: cardWidth + Spacing.sm,
    offset: index * (cardWidth + Spacing.sm),
    index,
  });

  const onScrollToIndexFailed = (info: any) => {
    console.warn('ScrollToIndex failed:', info);
    // Fallback: scroll to approximate position
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: info.index * (cardWidth + Spacing.sm),
        animated: true,
      });
    }
  };

  const renderOutfitItem = ({ item: outfit }: { item: any }) => {
    const allItems = outfit.items || [];
    const isManualOutfit =
      outfit.id.startsWith('manual-') ||
      (!outfit.id.startsWith('outfit-') && !outfit.id.includes('manual-'));

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          console.log('🔍 OutfitCard - outfit pressed:', outfit.id);
          onOutfitPress(outfit.id);
        }}
        activeOpacity={0.8}
      >
        {/* Header with name and action buttons */}
        <View style={styles.cardHeader}>
          <Text
            style={styles.outfitName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {outfit.name}
          </Text>
          <View style={styles.headerActions}>
            <View style={styles.actionButtons}>
              {onSaveOutfit && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => handleToggleFavorite(outfit.id)}
                  disabled={favoriteLoading[outfit.id]}
                >
                  <Heart
                    size={16}
                    color={
                      favorites[outfit.id]
                        ? Colors.error[500]
                        : Colors.neutral[400]
                    }
                    fill={
                      favorites[outfit.id] ? Colors.error[500] : 'transparent'
                    }
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Outfit Items Row */}
        <View style={styles.itemsContainer}>
          <View style={styles.horizontalItemsRow}>
            {allItems.slice(0, 4).map((item: ClothingItem, index: number) => (
              <View key={item.id} style={styles.itemContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
              </View>
            ))}
            {allItems.length > 4 && (
              <View style={styles.moreItemsCounter}>
                <Text style={styles.moreItemsText}>+{allItems.length - 4}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleScroll = (event: any) => {
    if (onCurrentIndexChange) {
      const offsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(offsetX / (cardWidth + Spacing.sm));
      onCurrentIndexChange(currentIndex);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={outfits}
        renderItem={renderOutfitItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + Spacing.sm}
        decelerationRate="fast"
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
        keyExtractor={item => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    paddingVertical: Spacing.sm,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: cardWidth,
    height: 160,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
    position: 'relative',
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  outfitName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalItemsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  itemContainer: {
    width: 50,
    height: 50,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.border.primary,
    ...Shadows.sm,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  moreItemsCounter: {
    width: 50,
    height: 50,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
    ...Shadows.sm,
  },
  moreItemsText: {
    ...Typography.caption.small,
    color: Colors.primary[600],
    fontWeight: '600',
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  saveButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: Colors.border.secondary,
    ...Shadows.sm,
  },
});
