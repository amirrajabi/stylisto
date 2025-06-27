import { Image } from 'expo-image';
import {
  Check,
  Edit3,
  Palette,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useOutfitScoring } from '../../hooks/useOutfitScoring';
import { useWardrobe } from '../../hooks/useWardrobe';
import { ClothingCategory, ClothingItem } from '../../types/wardrobe';

interface OutfitEditModalProps {
  visible: boolean;
  onClose: () => void;
  outfit: {
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
  } | null;
  onSave: (updatedOutfit: any) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const OutfitEditModal: React.FC<OutfitEditModalProps> = ({
  visible,
  onClose,
  outfit,
  onSave,
}) => {
  const { filteredItems } = useWardrobe();
  const { calculateDetailedScore } = useOutfitScoring();

  const [editedName, setEditedName] = useState('');
  const [editedItems, setEditedItems] = useState<ClothingItem[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [updatedScore, setUpdatedScore] = useState<any>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<ClothingItem[]>([]);

  useEffect(() => {
    if (outfit) {
      setEditedName(outfit.name);
      setEditedItems([...outfit.items]);
      setUpdatedScore(outfit.score);
    }
  }, [outfit]);

  // Analyze outfit completeness and generate smart suggestions
  const analyzeOutfitAndGenerateSuggestions = useCallback(() => {
    if (editedItems.length === 0) {
      setSmartSuggestions([]);
      return;
    }

    // Check what essential categories are missing
    const hasTop = editedItems.some(
      item =>
        item.category === ClothingCategory.TOPS ||
        item.category === ClothingCategory.DRESSES
    );
    const hasBottom = editedItems.some(
      item =>
        item.category === ClothingCategory.BOTTOMS ||
        item.category === ClothingCategory.DRESSES
    );
    const hasShoes = editedItems.some(
      item => item.category === ClothingCategory.SHOES
    );
    const hasAccessory = editedItems.some(
      item =>
        item.category === ClothingCategory.ACCESSORIES ||
        item.category === ClothingCategory.JEWELRY ||
        item.category === ClothingCategory.BAGS ||
        item.category === ClothingCategory.BELTS ||
        item.category === ClothingCategory.HATS ||
        item.category === ClothingCategory.SCARVES
    );

    console.log(
      `🔍 Outfit analysis - Top: ${hasTop}, Bottom: ${hasBottom}, Shoes: ${hasShoes}, Accessory: ${hasAccessory}`
    );

    // Get available items that aren't already in the outfit
    const availableItems = filteredItems.filter(
      item => !editedItems.find(editedItem => editedItem.id === item.id)
    );

    let prioritizedItems: ClothingItem[] = [];

    // Prioritize missing essential categories
    if (
      !hasTop &&
      !editedItems.some(item => item.category === ClothingCategory.DRESSES)
    ) {
      const tops = availableItems.filter(
        item => item.category === ClothingCategory.TOPS
      );
      prioritizedItems.push(...tops.slice(0, 3));
    }

    if (
      !hasBottom &&
      !editedItems.some(item => item.category === ClothingCategory.DRESSES)
    ) {
      const bottoms = availableItems.filter(
        item => item.category === ClothingCategory.BOTTOMS
      );
      prioritizedItems.push(...bottoms.slice(0, 3));
    }

    if (!hasShoes) {
      const shoes = availableItems.filter(
        item => item.category === ClothingCategory.SHOES
      );
      prioritizedItems.push(...shoes.slice(0, 3));
    }

    // If missing accessories, prioritize them with fallback categories
    if (!hasAccessory) {
      console.log('🎯 Missing accessory, prioritizing accessory categories...');

      // Primary accessory category
      const accessories = availableItems.filter(
        item => item.category === ClothingCategory.ACCESSORIES
      );
      prioritizedItems.push(...accessories.slice(0, 2));

      // Fallback accessory categories if primary is empty
      if (accessories.length === 0) {
        console.log('⚠️ No primary accessories, using fallback categories...');

        const fallbackCategories = [
          ClothingCategory.JEWELRY,
          ClothingCategory.BAGS,
          ClothingCategory.BELTS,
          ClothingCategory.HATS,
          ClothingCategory.SCARVES,
        ];

        for (const category of fallbackCategories) {
          const items = availableItems.filter(
            item => item.category === category
          );
          if (items.length > 0) {
            prioritizedItems.push(...items.slice(0, 2));
            console.log(
              `✅ Found ${items.length} items in fallback category: ${category}`
            );
            break; // Only use one fallback category
          }
        }
      }
    }

    // Add other complementary items
    const remainingItems = availableItems.filter(
      item => !prioritizedItems.find(prioritized => prioritized.id === item.id)
    );

    // Sort remaining items by compatibility (you could implement a simple compatibility score here)
    const sortedRemainingItems = remainingItems.sort((a, b) => {
      // Simple priority based on category usefulness
      const categoryPriority: Record<ClothingCategory, number> = {
        [ClothingCategory.OUTERWEAR]: 8,
        [ClothingCategory.JEWELRY]: 7,
        [ClothingCategory.BAGS]: 7,
        [ClothingCategory.BELTS]: 6,
        [ClothingCategory.HATS]: 6,
        [ClothingCategory.SCARVES]: 6,
        [ClothingCategory.ACCESSORIES]: 9,
        [ClothingCategory.TOPS]: 5,
        [ClothingCategory.BOTTOMS]: 5,
        [ClothingCategory.SHOES]: 5,
        [ClothingCategory.DRESSES]: 4,
        [ClothingCategory.UNDERWEAR]: 1,
        [ClothingCategory.SOCKS]: 2,
        [ClothingCategory.UNDERSHIRTS]: 1,
        [ClothingCategory.BRAS]: 1,
        [ClothingCategory.SHORTS_UNDERWEAR]: 1,
        [ClothingCategory.ACTIVEWEAR]: 3,
        [ClothingCategory.SLEEPWEAR]: 2,
        [ClothingCategory.SWIMWEAR]: 2,
      };

      const aPriority = categoryPriority[a.category] || 0;
      const bPriority = categoryPriority[b.category] || 0;
      return bPriority - aPriority;
    });

    // Combine prioritized and remaining items
    const finalSuggestions = [
      ...prioritizedItems,
      ...sortedRemainingItems.slice(0, 10), // Limit to keep performance good
    ].slice(0, 20); // Total limit

    setSmartSuggestions(finalSuggestions);

    console.log(`💡 Generated ${finalSuggestions.length} smart suggestions`);
    console.log(
      `🎯 Prioritized missing categories: ${!hasTop ? 'TOPS ' : ''}${!hasBottom ? 'BOTTOMS ' : ''}${!hasShoes ? 'SHOES ' : ''}${!hasAccessory ? 'ACCESSORIES ' : ''}`
    );
  }, [editedItems, filteredItems]);

  useEffect(() => {
    analyzeOutfitAndGenerateSuggestions();
  }, [editedItems, analyzeOutfitAndGenerateSuggestions]);

  const recalculateScore = useCallback(() => {
    if (editedItems.length > 0) {
      try {
        const scoreData = calculateDetailedScore(editedItems);
        const formattedScore = {
          total: scoreData.total,
          color: scoreData.colorMatch,
          style: scoreData.styleHarmony,
          season: scoreData.seasonFit,
          occasion: scoreData.occasion,
        };
        setUpdatedScore(formattedScore);
      } catch (error) {
        console.warn('Error calculating outfit score:', error);
      }
    } else {
      setUpdatedScore(null);
    }
  }, [editedItems, calculateDetailedScore]);

  useEffect(() => {
    recalculateScore();
  }, [editedItems]);

  const handleSave = useCallback(() => {
    if (!outfit) return;

    const updatedOutfit = {
      ...outfit,
      name: editedName.trim() || outfit.name,
      items: editedItems,
      score: updatedScore || outfit.score,
    };

    onSave(updatedOutfit);
    onClose();
  }, [outfit, editedName, editedItems, updatedScore, onSave, onClose]);

  const handleRemoveItem = useCallback((itemId: string) => {
    setEditedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const handleAddItem = useCallback(
    (item: ClothingItem) => {
      if (!editedItems.find(existingItem => existingItem.id === item.id)) {
        setEditedItems(prev => [...prev, item]);
      }
      setShowItemSelector(false);
    },
    [editedItems]
  );

  // Use smart suggestions if available, otherwise fall back to all available items
  const itemsToDisplay =
    smartSuggestions.length > 0
      ? smartSuggestions
      : filteredItems.filter(
          item => !editedItems.find(editedItem => editedItem.id === item.id)
        );

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return Colors.success[500];
    if (score >= 0.6) return Colors.warning[500];
    return Colors.error[500];
  };

  if (!outfit) return null;

  const totalScore = updatedScore ? Math.round(updatedScore.total * 100) : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isEditingName ? (
              <View style={styles.nameEditContainer}>
                <TextInput
                  style={styles.nameInput}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Outfit name"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={() => setIsEditingName(false)}
                  maxLength={50}
                />
                <TouchableOpacity
                  style={styles.nameEditButton}
                  onPress={() => setIsEditingName(false)}
                >
                  <Check size={16} color={Colors.success[500]} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.nameContainer}
                onPress={() => setIsEditingName(true)}
              >
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {editedName}
                </Text>
                <Edit3 size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
            <View style={styles.totalScoreContainer}>
              <Star
                size={16}
                color={Colors.warning[500]}
                fill={Colors.warning[500]}
              />
              <Text style={styles.totalScoreText}>{totalScore}% Match</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={20} color={Colors.primary[500]} />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score Breakdown */}
          {updatedScore && (
            <View style={styles.scoresSection}>
              <Text style={styles.sectionTitle}>Updated Match Details</Text>
              <View style={styles.scoreGrid}>
                {[
                  {
                    key: 'style',
                    label: 'Style',
                    value: updatedScore.style,
                    icon: <Palette size={16} color={Colors.primary[500]} />,
                  },
                  {
                    key: 'color',
                    label: 'Color',
                    value: updatedScore.color,
                    icon: <Star size={16} color={Colors.success[500]} />,
                  },
                  {
                    key: 'season',
                    label: 'Season',
                    value: updatedScore.season,
                    icon: <Star size={16} color={Colors.info[500]} />,
                  },
                  {
                    key: 'occasion',
                    label: 'Occasion',
                    value: updatedScore.occasion,
                    icon: <Star size={16} color={Colors.warning[500]} />,
                  },
                ].map(scoreItem => (
                  <View key={scoreItem.key} style={styles.scoreCard}>
                    <View style={styles.scoreCardHeader}>
                      {scoreItem.icon}
                      <Text style={styles.scoreCardTitle}>
                        {scoreItem.label}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.scoreCardValue,
                        { color: getScoreColor(scoreItem.value) },
                      ]}
                    >
                      {Math.round(scoreItem.value * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Outfit Items with Edit Controls */}
          <View style={styles.itemsSection}>
            <View style={styles.itemsSectionHeader}>
              <Text style={styles.sectionTitle}>
                Outfit Items ({editedItems.length})
              </Text>
              <TouchableOpacity
                style={styles.addItemButton}
                onPress={() => setShowItemSelector(true)}
              >
                <Plus size={16} color={Colors.primary[500]} />
                <Text style={styles.addItemButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.itemsGrid}>
              {editedItems.map((item: ClothingItem, index: number) => (
                <View key={item.id} style={styles.editableItemCard}>
                  <View style={styles.itemImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeItemButton}
                      onPress={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 size={14} color={Colors.error[500]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCategory}>
                    {item.category.charAt(0).toUpperCase() +
                      item.category.slice(1)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Item Selector Modal */}
        <Modal
          visible={showItemSelector}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowItemSelector(false)}
        >
          <View style={styles.itemSelectorContainer}>
            <View style={styles.itemSelectorHeader}>
              <View style={styles.itemSelectorTitleContainer}>
                <Text style={styles.itemSelectorTitle}>
                  {smartSuggestions.length > 0
                    ? 'Smart Suggestions'
                    : 'Add Item to Outfit'}
                </Text>
                {smartSuggestions.length > 0 && (
                  <Text style={styles.itemSelectorSubtitle}>
                    Prioritized items to complete your outfit
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowItemSelector(false)}
              >
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={itemsToDisplay}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.itemSelectorList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectableItemCard}
                  onPress={() => handleAddItem(item)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.selectableItemImage}
                    contentFit="cover"
                  />
                  <Text style={styles.selectableItemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.selectableItemCategory}>
                    {item.category.charAt(0).toUpperCase() +
                      item.category.slice(1)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface.primary,
    ...Shadows.sm,
    zIndex: 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nameEditContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nameInput: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    marginRight: Spacing.sm,
  },
  nameEditButton: {
    width: 32,
    height: 32,
    backgroundColor: Colors.success[50],
    borderRadius: Layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    alignSelf: 'flex-start',
  },
  totalScoreText: {
    ...Typography.body.small,
    color: Colors.warning[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    marginRight: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.body.medium,
    color: Colors.surface.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  scoresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scoreCard: {
    flex: 1,
    minWidth: (screenWidth - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface.secondary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreCardTitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  scoreCardValue: {
    ...Typography.heading.h5,
    fontWeight: '700',
  },
  itemsSection: {
    marginBottom: Spacing.xl,
  },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  addItemButtonText: {
    ...Typography.body.small,
    color: Colors.primary[600],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  editableItemCard: {
    width: (screenWidth - Spacing.lg * 2 - Spacing.md * 2) / 3,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
  },
  itemImageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    marginBottom: Spacing.sm,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.md,
  },
  removeItemButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    backgroundColor: Colors.error[500],
    borderRadius: Layout.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  itemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  itemCategory: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  itemSelectorContainer: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  itemSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface.primary,
    ...Shadows.sm,
  },
  itemSelectorTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  itemSelectorTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  itemSelectorSubtitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  itemSelectorList: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  selectableItemCard: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  selectableItemImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.sm,
  },
  selectableItemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  selectableItemCategory: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
