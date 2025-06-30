/*
 * OutfitStylistModal Component
 *
 * Features:
 * - Filter modal-like design for stylist page
 * - Shows outfit name in header
 * - Displays outfit items with detailed cards similar to wardrobe view
 * - Includes action buttons: delete, edit (if owner), like
 * - Used in stylist/professional views
 *
 * Props:
 * - outfit: The outfit to display
 * - isOwner: Whether current user owns this outfit
 * - onDelete: Callback for delete action
 * - onEdit: Callback for edit action
 * - onLike: Callback for like action
 * - onClose: Callback for closing modal
 *
 * Usage:
 * <OutfitStylistModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   outfit={selectedOutfit}
 *   isOwner={currentUser.id === outfit.createdBy}
 *   onDelete={handleDelete}
 *   onEdit={handleEdit}
 *   onLike={handleLike}
 * />
 */

import { Edit2, Heart, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { ClothingItem } from '../../types/wardrobe';
import OptimizedImage from '../ui/OptimizedImage';

export interface OutfitStylistModalProps {
  visible: boolean;
  onClose: () => void;
  outfit: {
    id: string;
    name: string;
    items: ClothingItem[];
    score?: {
      total: number;
      color: number;
      style: number;
      season: number;
      occasion: number;
    };
    isFavorite?: boolean;
    createdBy?: string;
    createdAt?: string;
    source_type?: 'manual' | 'ai_generated';
  } | null;
  isOwner?: boolean;
  onDelete?: (outfitId: string) => void;
  onEdit?: (outfitId: string) => void;
  onLike?: (outfitId: string) => void;
  currentUserId?: string;
}

export const OutfitStylistModal: React.FC<OutfitStylistModalProps> = ({
  visible,
  onClose,
  outfit,
  isOwner = false,
  onDelete,
  onEdit,
  onLike,
  currentUserId,
}) => {
  const [isLiked, setIsLiked] = useState(outfit?.isFavorite || false);

  if (!outfit) {
    return null;
  }

  // Check if outfit is saved in database (not on-the-fly generated)
  const isSavedOutfit = () => {
    // On-the-fly outfits have IDs like "outfit-0", "outfit-1", etc.
    // Saved outfits have database UUIDs or IDs like "manual-db-xxx"
    return (
      !outfit.id.startsWith('outfit-') || outfit.id.startsWith('manual-db-')
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(outfit.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit?.(outfit.id);
    onClose();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    onLike?.(outfit.id);
  };

  const renderItemCard = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemImageContainer}>
        <OptimizedImage
          source={{ uri: item.imageUrl || '' }}
          style={styles.itemImage}
          contentFit="cover"
          transition={200}
          priority={index < 3 ? 'high' : 'normal'}
        />
        <View style={styles.itemNumberBadge}>
          <Text style={styles.itemNumber}>{index + 1}</Text>
        </View>
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.itemCategory}>{item.category}</Text>
        </View>

        <View style={styles.itemDetails}>
          {item.brand && (
            <Text style={styles.itemDetailText}>Brand: {item.brand}</Text>
          )}
          {item.color && (
            <Text style={styles.itemDetailText}>Color: {item.color}</Text>
          )}
          {item.size && (
            <Text style={styles.itemDetailText}>Size: {item.size}</Text>
          )}
        </View>

        <View style={styles.itemTags}>
          {item.season && item.season.length > 0 && (
            <View style={styles.tagContainer}>
              {item.season.slice(0, 2).map((season, idx) => (
                <View key={idx} style={styles.tag}>
                  <Text style={styles.tagText}>{season}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={styles.itemNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {outfit.name}
            </Text>
            <Text style={styles.itemCount}>
              {outfit.items.length}{' '}
              {outfit.items.length === 1 ? 'item' : 'items'}
              {outfit.source_type === 'ai_generated' && ' • AI Generated'}
            </Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.likeButton, isLiked && styles.likeButtonActive]}
              onPress={handleLike}
            >
              <Heart
                size={20}
                color={isLiked ? Colors.surface.primary : Colors.error[500]}
                fill={isLiked ? Colors.error[500] : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Items List */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Outfit Items</Text>
          <FlatList
            data={outfit.items}
            renderItem={renderItemCard}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>

        {/* Footer Actions */}
        {isOwner && (onEdit || onDelete) && (
          <View style={styles.footer}>
            <View style={styles.footerButtons}>
              {onEdit && outfit.source_type !== 'ai_generated' && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.editButton]}
                  onPress={handleEdit}
                >
                  <Edit2 size={20} color={Colors.primary[500]} />
                  <Text
                    style={[styles.footerButtonText, styles.editButtonText]}
                  >
                    Edit
                  </Text>
                </TouchableOpacity>
              )}

              {onDelete && isSavedOutfit() && (
                <TouchableOpacity
                  style={[styles.footerButton, styles.deleteButton]}
                  onPress={handleDelete}
                >
                  <Trash2 size={20} color={Colors.error[500]} />
                  <Text
                    style={[styles.footerButtonText, styles.deleteButtonText]}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  itemCount: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  likeButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButtonActive: {
    backgroundColor: Colors.error[500],
    borderColor: Colors.error[500],
  },
  editButton: {
    borderColor: Colors.primary[200],
    backgroundColor: Colors.primary[50],
  },
  deleteButton: {
    borderColor: Colors.error[200],
    backgroundColor: Colors.error[50],
  },
  footerButtonText: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  editButtonText: {
    color: Colors.primary[700],
  },
  deleteButtonText: {
    color: Colors.error[700],
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  separator: {
    height: Spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  itemImageContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius.md,
  },
  itemNumberBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  itemNumber: {
    ...Typography.caption.small,
    color: Colors.surface.primary,
    fontWeight: '700',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemHeader: {
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  itemCategory: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  itemDetails: {
    marginBottom: Spacing.xs,
  },
  itemDetailText: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  itemTags: {
    marginBottom: Spacing.xs,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs / 2,
  },
  tag: {
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Layout.borderRadius.sm,
  },
  tagText: {
    ...Typography.caption.small,
    color: Colors.primary[700],
    textTransform: 'capitalize',
  },
  itemNotes: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
});
