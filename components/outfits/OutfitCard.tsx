import { Image } from 'expo-image';
import { Edit3, Heart } from 'lucide-react-native';
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
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth * 0.75;

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfits,
  onOutfitPress,
  onSaveOutfit,
  onEditOutfit,
  onCurrentIndexChange,
  onGoToIndex,
  currentIndex = 0,
  onFavoriteToggled,
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
      let realOutfitId = outfitId;

      // Handle AI generated outfits - need to save them first
      if (outfitId.startsWith('outfit-')) {
        const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
        const outfit = outfits[outfitIndex];

        if (!outfit) {
          console.error('Outfit not found at index:', outfitIndex);
          return;
        }

        // Save the outfit first using the new method
        const saveResult = await OutfitService.saveSingleGeneratedOutfit(
          outfit,
          `Generated Outfit ${outfitIndex + 1}`
        );

        if (saveResult.error || !saveResult.outfitId) {
          console.error(
            'Failed to save outfit before favoriting:',
            saveResult.error
          );
          return;
        }

        // Now favorite the saved outfit
        const favoriteResult = await OutfitService.toggleOutfitFavorite(
          saveResult.outfitId
        );

        if (favoriteResult.error) {
          console.error(
            'Failed to favorite saved outfit:',
            favoriteResult.error
          );
          return;
        }

        const newFavoriteStatus = favoriteResult.isFavorite || false;
        setFavorites(prev => ({ ...prev, [outfitId]: newFavoriteStatus }));

        if (onFavoriteToggled) {
          onFavoriteToggled(outfitId, newFavoriteStatus);
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
    length: cardWidth + Spacing.md,
    offset: index * (cardWidth + Spacing.md),
    index,
  });

  const onScrollToIndexFailed = (info: any) => {
    console.warn('ScrollToIndex failed:', info);
    // Fallback: scroll to approximate position
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({
        offset: info.index * (cardWidth + Spacing.md),
        animated: true,
      });
    }
  };

  const renderOutfitItem = ({ item: outfit }: { item: any }) => {
    const displayItems = (outfit.items || []).slice(0, 3);

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
              {onEditOutfit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => onEditOutfit(outfit.id)}
                >
                  <Edit3 size={16} color={Colors.primary[500]} />
                </TouchableOpacity>
              )}
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

        {/* Outfit Items Timeline */}
        <View style={styles.itemsContainer}>
          {displayItems.map((item: ClothingItem, index: number) => (
            <View key={item.id} style={styles.itemWrapper}>
              <View style={styles.itemImageContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
              </View>
              {index < displayItems.length - 1 && (
                <View style={styles.connector} />
              )}
            </View>
          ))}

          {outfit.items && outfit.items.length > 3 && (
            <View style={styles.moreItemsIndicator}>
              <Text style={styles.moreItemsText}>
                +{outfit.items.length - 3}
              </Text>
            </View>
          )}
        </View>

        {/* Score Breakdown */}
        <View style={styles.scoreBreakdown}>
          <View style={styles.scoreItem}>
            <View
              style={[
                styles.scoreDot,
                { backgroundColor: Colors.primary[500] },
              ]}
            />
            <Text style={styles.scoreLabel}>Style</Text>
            <Text style={styles.scoreValue}>
              {Math.round(
                (outfit.score.breakdown?.styleMatching ||
                  outfit.score.style ||
                  0.85) * 100
              )}
              %
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <View
              style={[
                styles.scoreDot,
                { backgroundColor: Colors.success[500] },
              ]}
            />
            <Text style={styles.scoreLabel}>Color</Text>
            <Text style={styles.scoreValue}>
              {Math.round(
                (outfit.score.breakdown?.colorHarmony ||
                  outfit.score.color ||
                  0.85) * 100
              )}
              %
            </Text>
          </View>
          <View style={styles.scoreItem}>
            <View
              style={[styles.scoreDot, { backgroundColor: Colors.info[500] }]}
            />
            <Text style={styles.scoreLabel}>Season</Text>
            <Text style={styles.scoreValue}>
              {Math.round(
                (outfit.score.breakdown?.seasonSuitability ||
                  outfit.score.season ||
                  0.85) * 100
              )}
              %
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleScroll = (event: any) => {
    if (onCurrentIndexChange) {
      const offsetX = event.nativeEvent.contentOffset.x;
      const currentIndex = Math.round(offsetX / (cardWidth + Spacing.md));
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
        snapToInterval={cardWidth + Spacing.md}
        decelerationRate="fast"
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.md }} />}
        keyExtractor={item => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 230,
    // paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: cardWidth,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.xl,
    padding: Spacing.md,
    ...Shadows.md,
    position: 'relative',
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  outfitName: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  itemsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    height: 70,
  },
  itemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImageContainer: {
    width: 55,
    height: 55,
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.surface.secondary,
    borderWidth: 2,
    borderColor: Colors.primary[200],
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  connector: {
    width: 20,
    height: 2,
    backgroundColor: Colors.primary[300],
    marginHorizontal: Spacing.xs,
  },
  moreItemsIndicator: {
    width: 35,
    height: 35,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  moreItemsText: {
    ...Typography.caption.small,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreItem: {
    alignItems: 'center',
    flex: 1,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: Spacing.xs,
  },
  scoreLabel: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  scoreValue: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  saveButton: {
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
});
