import { Image } from 'expo-image';
import { Clock, Star, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { supabase } from '../../lib/supabase';
import { VirtualTryOnResult } from '../../services/virtualTryOnService';
import { ClothingCategory, ClothingItem } from '../../types/wardrobe';
import { AccessibleText } from '../ui/AccessibleText';
import { ClothingItemCard } from '../wardrobe/ClothingItemCard';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VirtualTryOnModalProps {
  visible: boolean;
  result: VirtualTryOnResult | null;
  onClose: () => void;
  onDelete?: (result: VirtualTryOnResult) => void;
}

export function VirtualTryOnModal({
  visible,
  result,
  onClose,
  onDelete,
}: VirtualTryOnModalProps) {
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetchOutfitItems = async (outfitId: string) => {
    try {
      setLoadingItems(true);

      const { data: outfitData, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          *,
          outfit_items (
            clothing_items (
              id,
              name,
              category,
              subcategory,
              color,
              brand,
              size,
              seasons,
              occasions,
              image_url,
              tags,
              is_favorite,
              last_worn,
              times_worn,
              purchase_date,
              price,
              notes,
              description_with_ai,
              created_at,
              updated_at
            )
          )
        `
        )
        .eq('id', outfitId)
        .single();

      if (error) {
        console.error('Error fetching outfit items:', error);
        return;
      }

      const items: ClothingItem[] = outfitData.outfit_items
        .map((oi: any) => oi.clothing_items)
        .filter(Boolean)
        .map((item: any) => ({
          id: item.id,
          name: item.name,
          category: item.category as ClothingCategory,
          subcategory: item.subcategory,
          color: item.color,
          brand: item.brand,
          size: item.size,
          season: item.seasons || [],
          occasion: item.occasions || [],
          imageUrl: item.image_url,
          tags: item.tags || [],
          isFavorite: item.is_favorite || false,
          lastWorn: item.last_worn,
          timesWorn: item.times_worn || 0,
          purchaseDate: item.purchase_date,
          price: item.price,
          notes: item.notes,
          description_with_ai: item.description_with_ai,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

      setOutfitItems(items);
    } catch (error) {
      console.error('Error fetching outfit items:', error);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (visible && result?.outfit_id) {
      fetchOutfitItems(result.outfit_id);
    } else {
      setOutfitItems([]);
    }
  }, [visible, result?.outfit_id]);

  if (!result) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatProcessingTime = (timeMs: number) => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Virtual Try-On',
      'Are you sure you want to delete this virtual try-on result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(result);
            onClose();
          },
        },
      ]
    );
  };

  const renderClothingItem = ({ item }: { item: ClothingItem }) => (
    <View style={styles.clothingItemContainer}>
      <ClothingItemCard
        item={item}
        onPress={() => {}}
        onToggleFavorite={() => {}}
        onMoreOptions={() => {}}
        showStats={false}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Simplified Header - close button moved to right */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <AccessibleText style={styles.headerTitle} numberOfLines={1}>
              {result.outfit_name}
            </AccessibleText>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Confidence Score - moved below header */}
        <View style={styles.confidenceSection}>
          <View style={styles.confidenceContainer}>
            <Star size={16} color={Colors.warning[600]} />
            <AccessibleText style={styles.confidenceText}>
              {Math.round(result.confidence_score * 100)}% confidence
            </AccessibleText>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Full Size Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: result.generated_image_url }}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Date and Processing Time */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Clock size={16} color={Colors.text.secondary} />
                <AccessibleText style={styles.metaText}>
                  Created {formatDate(result.created_at)}
                </AccessibleText>
              </View>
              <AccessibleText style={styles.processingText}>
                Processing time:{' '}
                {formatProcessingTime(result.processing_time_ms)}
              </AccessibleText>
            </View>

            {/* Items Used - with horizontal ClothingItemCard */}
            {outfitItems.length > 0 && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  Items Used
                </AccessibleText>
                {loadingItems ? (
                  <AccessibleText style={styles.loadingText}>
                    Loading items...
                  </AccessibleText>
                ) : (
                  <FlatList
                    data={outfitItems}
                    renderItem={renderClothingItem}
                    keyExtractor={item => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.horizontalList}
                    style={styles.itemsCarousel}
                  />
                )}
              </View>
            )}

            {/* Style Instructions */}
            {result.style_instructions && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  Style Instructions
                </AccessibleText>
                <AccessibleText style={styles.instructionsText}>
                  {result.style_instructions}
                </AccessibleText>
              </View>
            )}

            {/* Prompt Used */}
            {result.prompt_used && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  AI Prompt
                </AccessibleText>
                <AccessibleText style={styles.promptText}>
                  {result.prompt_used}
                </AccessibleText>
              </View>
            )}

            {/* Delete Button - moved to end of information */}
            <View style={styles.deleteSection}>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color={Colors.error[500]} />
                <AccessibleText style={styles.deleteButtonText}>
                  Delete Virtual Try-On
                </AccessibleText>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  closeButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  confidenceSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  confidenceText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: screenHeight * 0.5,
    backgroundColor: Colors.neutral[50],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: Spacing.lg,
  },
  metaSection: {
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  processingText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  itemsCarousel: {
    marginHorizontal: -Spacing.lg,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
    paddingRight: Spacing.lg + 8,
  },
  clothingItemContainer: {
    marginRight: Spacing.sm,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  promptText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  deleteSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error[200],
    backgroundColor: Colors.error[50],
  },
  deleteButtonText: {
    fontSize: 14,
    color: Colors.error[600],
    fontWeight: '500',
  },
});
