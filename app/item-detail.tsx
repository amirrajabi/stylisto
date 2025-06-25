import { router, useLocalSearchParams } from 'expo-router';
import {
  CreditCard as Edit,
  Heart,
  Share,
  Tag,
  Trash2,
} from 'lucide-react-native';
import React from 'react';
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
import { Colors } from '../constants/Colors';
import { Layout, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useWardrobe } from '../hooks/useWardrobe';
import {
  formatCurrency,
  formatDate,
  getOccasionColor,
  getSeasonColor,
} from '../utils/wardrobeUtils';

export default function ItemDetailScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { items, actions } = useWardrobe();

  const item = items.find(i => i.id === itemId);

  const handleEdit = () => {
    if (!item) return;

    router.push({
      pathname: '/wardrobe/add-item',
      params: { editItemId: item.id },
    });
  };

  const handleDelete = () => {
    if (!item) return;

    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}"?`,
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

  const handleShare = () => {
    if (!item) return;
    // Implement share functionality
    console.log('Share item:', item.name);
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
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

        {/* Content */}
        <View style={styles.detailsContainer}>
          {/* Header */}
          <View style={styles.header}>
            <H1 style={styles.title}>{item.name}</H1>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleShare}
              >
                <Share size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Edit size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color={Colors.error[500]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Basic Info */}
          <View style={styles.infoSection}>
            <View style={styles.infoRow}>
              <BodyMedium color="secondary">Category</BodyMedium>
              <BodyMedium>{item.category.replace('_', ' ')}</BodyMedium>
            </View>
            {item.brand && (
              <View style={styles.infoRow}>
                <BodyMedium color="secondary">Brand</BodyMedium>
                <BodyMedium>{item.brand}</BodyMedium>
              </View>
            )}
            {item.size && (
              <View style={styles.infoRow}>
                <BodyMedium color="secondary">Size</BodyMedium>
                <BodyMedium>{item.size}</BodyMedium>
              </View>
            )}
            <View style={styles.infoRow}>
              <BodyMedium color="secondary">Color</BodyMedium>
              <View style={styles.colorInfo}>
                <View
                  style={[styles.colorDot, { backgroundColor: item.color }]}
                />
                <BodyMedium>{item.color}</BodyMedium>
              </View>
            </View>
            {item.price && (
              <View style={styles.infoRow}>
                <BodyMedium color="secondary">Price</BodyMedium>
                <BodyMedium>{formatCurrency(item.price)}</BodyMedium>
              </View>
            )}
          </View>

          {/* Tags Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <H3 style={styles.sectionTitle}>Tags</H3>
              <TouchableOpacity
                style={styles.editTagsButton}
                onPress={handleEditTags}
              >
                <Tag size={16} color={Colors.primary[700]} />
                <Text style={styles.editTagsText}>Edit Tags</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {item.tags.length > 0 ? (
                item.tags.map(tag => (
                  <View key={tag} style={styles.customTag}>
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
            <View style={styles.section}>
              <H3 style={styles.sectionTitle}>Seasons</H3>
              <View style={styles.tagsContainer}>
                {item.season.map(season => (
                  <View
                    key={season}
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
            <View style={styles.section}>
              <H3 style={styles.sectionTitle}>Occasions</H3>
              <View style={styles.tagsContainer}>
                {item.occasion.map(occasion => (
                  <View
                    key={occasion}
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
          <View style={styles.section}>
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
            <View style={styles.section}>
              <H3 style={styles.sectionTitle}>Notes</H3>
              <BodyMedium>{item.notes}</BodyMedium>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    height: 400,
  },
  image: {
    width: '100%',
    height: '100%',
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
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    flex: 1,
    marginRight: Spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
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
