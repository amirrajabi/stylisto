import { Image } from 'expo-image';
import { Clock, Star, Trash2, X } from 'lucide-react-native';
import React from 'react';
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
import { VirtualTryOnResult } from '../../services/virtualTryOnService';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../../types/wardrobe';
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

  const mockClothingItems: ClothingItem[] = result.items_used
    ? result.items_used.map((item, index) => ({
        id: `item-${index}`,
        name: item,
        category: ClothingCategory.TOPS,
        subcategory: 'shirt',
        color: '#000000',
        size: 'M',
        season: [Season.SPRING],
        occasion: [Occasion.CASUAL],
        tags: [],
        imageUrl:
          'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isFavorite: false,
        timesWorn: 0,
        lastWorn: undefined,
        isForSale: false,
      }))
    : [];

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
            {result.items_used && result.items_used.length > 0 && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  Items Used
                </AccessibleText>
                <FlatList
                  data={mockClothingItems}
                  renderItem={renderClothingItem}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                  style={styles.itemsCarousel}
                />
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
    marginLeft: Spacing.md,
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
