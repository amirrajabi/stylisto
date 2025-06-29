import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CreditCard as Edit,
  Heart,
  Trash2,
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BodyMedium, BodySmall, Button, H1, H3 } from '../components/ui';
import OptimizedImage from '../components/ui/OptimizedImage';
import { AddItemModal } from '../components/wardrobe/AddItemModal';
import { Colors } from '../constants/Colors';
import { Layout, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useWardrobe } from '../hooks/useWardrobe';
import { ClothingItem } from '../types/wardrobe';
import {
  formatCurrency,
  formatDate,
  getOccasionColor,
  getSeasonColor,
} from '../utils/wardrobeUtils';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { items, actions } = useWardrobe();
  const [showEditModal, setShowEditModal] = useState(false);

  const item = items.find(i => i.id === itemId);

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    if (!item) return;
    setShowEditModal(true);
  };

  const handleEditComplete = (updatedItem: ClothingItem) => {
    setShowEditModal(false);
    // The item will be automatically updated in the store via the modal's onAddItem
  };

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await actions.deleteItem(item.id);

              if (result.success) {
                router.back();
              } else {
                // Show specific error message
                let errorMessage = result.error || 'Failed to delete item';

                // Provide user-friendly error messages
                if (
                  errorMessage.includes('Permission denied') ||
                  errorMessage.includes('row-level security')
                ) {
                  errorMessage =
                    'You do not have permission to delete this item. Please make sure you are logged in.';
                } else if (errorMessage.includes('Item not found')) {
                  errorMessage =
                    'This item has already been deleted or does not exist.';
                } else if (errorMessage.includes('already deleted')) {
                  errorMessage = 'This item has already been deleted.';
                }

                Alert.alert('Delete Failed', errorMessage, [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Go back if item was already deleted
                      if (errorMessage.includes('already been deleted')) {
                        router.back();
                      }
                    },
                  },
                ]);
              }
            } catch (error) {
              Alert.alert(
                'Error',
                'An unexpected error occurred while deleting the item.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleEditTags = () => {
    if (!item) return;

    router.push({
      pathname: '/item-tag-editor',
      params: { itemId: item.id },
    });
  };

  // Show error state if no item is found
  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
          <Button title="Go Back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Image Section */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: item.imageUrl }}
          style={styles.image}
          contentFit="cover"
          priority="high"
          placeholder={{
            uri: 'https://via.placeholder.com/400x400/f5f5f5/999999?text=Loading',
          }}
          onLoad={() => {
            if (__DEV__) {
              console.log('Item image loaded successfully');
            }
          }}
          onError={error => {
            if (__DEV__) {
              console.warn('Failed to load item image:', {
                name: item.name,
                urlLength: item.imageUrl?.length,
                isSupabaseUrl: item.imageUrl?.includes('supabase'),
                errorType:
                  error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }}
        />
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => actions.toggleFavorite(item.id)}
        >
          <Heart
            size={24}
            color={item.isFavorite ? Colors.error[500] : Colors.white}
            fill={item.isFavorite ? Colors.error[500] : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content Section */}
      <View style={styles.detailsContainer}>
        <ScrollView
          style={styles.scrollableContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            <H1 style={styles.title} numberOfLines={2}>
              {item.name}
            </H1>
          </View>

          {/* Basic Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <BodyMedium color="secondary" style={styles.infoLabel}>
                Category
              </BodyMedium>
              <BodyMedium style={styles.infoValue}>
                {item.category.replace('_', ' ')}
              </BodyMedium>
            </View>
            {item.brand && (
              <View style={styles.infoRow}>
                <BodyMedium color="secondary" style={styles.infoLabel}>
                  Brand
                </BodyMedium>
                <BodyMedium style={styles.infoValue}>{item.brand}</BodyMedium>
              </View>
            )}
            {item.size && (
              <View style={styles.infoRow}>
                <BodyMedium color="secondary" style={styles.infoLabel}>
                  Size
                </BodyMedium>
                <BodyMedium style={styles.infoValue}>{item.size}</BodyMedium>
              </View>
            )}
            <View style={styles.infoRow}>
              <BodyMedium color="secondary" style={styles.infoLabel}>
                Color
              </BodyMedium>
              <View style={styles.colorInfo}>
                <View
                  style={[styles.colorDot, { backgroundColor: item.color }]}
                />
                <BodyMedium style={styles.infoValue}>{item.color}</BodyMedium>
              </View>
            </View>
            {item.price && (
              <View style={[styles.infoRow, styles.lastInfoRow]}>
                <BodyMedium color="secondary" style={styles.infoLabel}>
                  Price
                </BodyMedium>
                <BodyMedium style={[styles.infoValue, styles.priceValue]}>
                  {formatCurrency(item.price)}
                </BodyMedium>
              </View>
            )}
          </View>

          {/* Tags Section */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <H3 style={styles.sectionTitle}>Tags</H3>
            </View>
            <View style={styles.tagsContainer}>
              {item.tags.length > 0 ? (
                item.tags.map((tag, index) => (
                  <View key={`tag-${index}-${tag}`} style={styles.customTag}>
                    <Text style={styles.customTagText}>{tag}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noTagsText}>No tags added yet</Text>
              )}
            </View>
          </View>

          {/* Seasons */}
          {item.season.length > 0 && (
            <View style={styles.sectionCard}>
              <H3 style={styles.sectionTitle}>Seasons</H3>
              <View style={styles.tagsContainer}>
                {item.season.map((season, index) => (
                  <View
                    key={`season-${index}-${season}`}
                    style={[
                      styles.tag,
                      { backgroundColor: getSeasonColor(season) },
                    ]}
                  >
                    <Text style={styles.tagText}>{season}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Occasions */}
          {item.occasion.length > 0 && (
            <View style={styles.sectionCard}>
              <H3 style={styles.sectionTitle}>Occasions</H3>
              <View style={styles.tagsContainer}>
                {item.occasion.map((occasion, index) => (
                  <View
                    key={`occasion-${index}-${occasion}`}
                    style={[
                      styles.tag,
                      { backgroundColor: getOccasionColor(occasion) },
                    ]}
                  >
                    <Text style={styles.tagText}>{occasion}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Stats */}
          <View style={styles.sectionCard}>
            <H3 style={styles.sectionTitle}>Statistics</H3>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.timesWorn}</Text>
                <BodySmall color="secondary">Times Worn</BodySmall>
              </View>
              {item.lastWorn && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {formatDate(item.lastWorn)}
                  </Text>
                  <BodySmall color="secondary">Last Worn</BodySmall>
                </View>
              )}
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {item.createdAt ? formatDate(item.createdAt) : 'Unknown'}
                </Text>
                <BodySmall color="secondary">Added</BodySmall>
              </View>
            </View>
          </View>

          {/* Notes */}
          {item.notes && (
            <View style={styles.sectionCard}>
              <H3 style={styles.sectionTitle}>Notes</H3>
              <BodyMedium style={styles.notesText}>{item.notes}</BodyMedium>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <Button
              title="Edit Item"
              onPress={handleEdit}
              style={styles.editButton}
              textStyle={styles.editButtonText}
              leftIcon={<Edit size={20} color={Colors.white} />}
            />
            <Button
              title="Delete Item"
              onPress={handleDelete}
              variant="outline"
              style={styles.deleteButton}
              textStyle={styles.deleteButtonText}
              leftIcon={<Trash2 size={20} color={Colors.error[600]} />}
            />
          </View>
        </ScrollView>
      </View>

      {showEditModal && (
        <AddItemModal
          visible={showEditModal}
          onClose={() => setShowEditModal(false)}
          onAddItem={handleEditComplete}
          editItem={item}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  imageContainer: {
    position: 'relative',
    height: 350,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    marginTop: -20,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: 0,
  },
  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  priceValue: {
    color: Colors.primary[700],
    fontWeight: '700',
  },
  colorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: 0,
  },
  editTagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  editTagsText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.lg,
  },
  tagText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  customTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  customTagText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  noTagsText: {
    ...Typography.body.small,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  notesText: {
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  actionButtonsContainer: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  editButton: {
    backgroundColor: Colors.primary[600],
    borderWidth: 0,
    borderRadius: Layout.borderRadius.lg,
    minHeight: 52,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 16,
  },
  deleteButton: {
    borderColor: Colors.error[300],
    backgroundColor: Colors.surface.primary,
    borderWidth: 2,
    borderRadius: Layout.borderRadius.lg,
    minHeight: 52,
  },
  deleteButtonText: {
    color: Colors.error[600],
    fontWeight: '600',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
});
