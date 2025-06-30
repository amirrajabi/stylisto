/*
 * OutfitGalleryModal Component
 *
 * Features:
 * - Displays outfit collage in full-height header
 * - Shows outfit name and horizontal scrolling items below
 * - Clean and minimal design focused on visual presentation
 * - Integrates Virtual Try-On functionality with FLUX API
 * - Used in gallery/collection views
 *
 * Props:
 * - onTry: Callback function when Try button is pressed
 * - onProve: Callback function when Prove button is pressed for favorite outfits
 * - outfit.isFavorite: Boolean flag to determine if outfit is favorited
 * - userImage: User's photo for virtual try-on
 *
 * Usage:
 * <OutfitGalleryModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   outfit={{ ...outfitData, isFavorite: true }}
 *   userImage={userPhotoUrl}
 *   onTry={(outfitId) => handleTryOutfit(outfitId)}
 *   onProve={(outfitId) => handleProveOutfit(outfitId)}
 *   onSave={(outfitId) => handleSaveOutfit(outfitId)}
 * />
 */

import { Image } from 'expo-image';
import { ArrowLeft, CheckCircle, Edit2, Heart } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot from 'react-native-view-shot';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useVirtualTryOnStore } from '../../hooks/useVirtualTryOnStore';
import { VirtualTryOnResult } from '../../lib/virtualTryOn';
import { ClothingItem } from '../../types/wardrobe';
import { NativeCollageView } from '../ui/NativeCollageView';
import { VirtualTryOnModal } from './VirtualTryOnModal';

export interface OutfitGalleryModalProps {
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
    isFavorite?: boolean;
    source_type?: 'manual' | 'ai_generated';
  } | null;
  userImage?: string;
  onSave?: (outfitId: string) => void;
  onEdit?: (outfitId: string) => void;
  onProve?: (outfitId: string) => void;
  onTry?: (outfitId: string) => void;
  onVirtualTryOnComplete?: (result: VirtualTryOnResult) => void;
  onVirtualTryOnSave?: (result: VirtualTryOnResult) => void;
  onVirtualTryOnShare?: (result: VirtualTryOnResult) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const OutfitGalleryModal: React.FC<OutfitGalleryModalProps> = ({
  visible,
  onClose,
  outfit,
  userImage,
  onSave,
  onEdit,
  onProve,
  onTry,
  onVirtualTryOnComplete,
  onVirtualTryOnSave,
  onVirtualTryOnShare,
}) => {
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
  const [gptGeneratedPrompt, setGptGeneratedPrompt] = useState<string>('');
  const viewShotRef = useRef<ViewShot | null>(null);

  const {
    userFullBodyImageUrl,
    isReadyForTryOn,
    updateCurrentOutfit,
    clearOutfit,
    processVirtualTryOn,
    isProcessing,
    processingPhase,
    processingProgress,
    processingMessage,
    lastGeneratedImageUrl,
    lastGeneratedPrompt,
    error,
    clearProcessingError,
    history,
  } = useVirtualTryOnStore();

  // Auto-sync outfit data with Redux store when outfit changes
  useEffect(() => {
    if (visible && outfit) {
      console.log(
        '👔 OutfitDetailModal: Syncing outfit to Virtual Try-On store',
        {
          outfitId: outfit.id,
          outfitName: outfit.name,
          itemCount: outfit.items.length,
        }
      );

      updateCurrentOutfit(outfit.id, outfit.name, outfit.items);
    } else if (!visible) {
      // Clear outfit when modal closes
      clearOutfit();
      setGptGeneratedPrompt('');
    }
  }, [visible, outfit, updateCurrentOutfit, clearOutfit]);

  // Get the latest prompt from history or processing result
  useEffect(() => {
    if (lastGeneratedPrompt) {
      setGptGeneratedPrompt(lastGeneratedPrompt);
    }
  }, [lastGeneratedPrompt]);

  if (!outfit) {
    return null;
  }

  const handleProveOutfit = () => {
    console.log('🚀 Prove outfit function called - checking prerequisites...');

    // If results are already available, show them instead of starting new process
    if (lastGeneratedImageUrl) {
      console.log(
        '📸 Results available, showing Virtual Try-On modal with results',
        {
          lastGeneratedImageUrl,
          showVirtualTryOn,
          outfitId: outfit.id,
        }
      );
      setShowVirtualTryOn(true);
      console.log('✅ setShowVirtualTryOn(true) called');
      return;
    }

    // Use Redux store data for better accuracy
    const actualUserImage = userFullBodyImageUrl || userImage;

    if (!actualUserImage) {
      console.log('❌ No user image available for virtual try-on');
      alert(
        'Virtual Try-On requires a full-body photo.\n\n' +
          'Please go to Profile → Edit Profile → Upload Full Body Image to use this feature.'
      );
      return;
    }

    console.log('✅ All prerequisites met, starting virtual try-on...');
    setShowVirtualTryOn(true);

    // Start the virtual try-on process
    processVirtualTryOn()
      .then(result => {
        if (result) {
          console.log('🎉 Virtual try-on completed successfully!');
          onVirtualTryOnComplete?.(result);
        }
      })
      .catch(error => {
        console.error('💥 Virtual try-on failed:', error);
      });

    if (onProve) {
      onProve(outfit.id);
    }
  };

  const handleVirtualTryOnComplete = (result: VirtualTryOnResult) => {
    onVirtualTryOnComplete?.(result);
  };

  const handleVirtualTryOnSave = (result: VirtualTryOnResult) => {
    onVirtualTryOnSave?.(result);
  };

  const handleVirtualTryOnShare = (result: VirtualTryOnResult) => {
    onVirtualTryOnShare?.(result);
  };

  const handleEditOutfit = () => {
    console.log('📝 Edit outfit function called for outfit:', outfit.id);
    if (onEdit) {
      onEdit(outfit.id);
    }
  };

  const getProveButtonText = () => {
    if (isProcessing) {
      return `${processingPhase || 'Processing'}...`;
    }
    if (lastGeneratedImageUrl) {
      return 'View Results';
    }
    return 'Prove This Outfit';
  };

  // Check if we have user image and outfit items for collage
  const hasCollageData =
    (userFullBodyImageUrl || userImage) && outfit.items.length > 0;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container}>
          {/* Collage Header Section */}
          <View style={styles.collageSection}>
            {hasCollageData ? (
              <NativeCollageView
                userImage={userFullBodyImageUrl || userImage || ''}
                clothingImages={outfit.items.map(item => item.imageUrl)}
                width={screenWidth}
                height={screenHeight * 0.6}
                viewShotRef={viewShotRef}
              />
            ) : (
              <View style={styles.placeholderCollage}>
                <Text style={styles.placeholderText}>No Preview Available</Text>
              </View>
            )}

            {/* Overlay Controls */}
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.white} />
            </TouchableOpacity>

            {onSave && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => onSave(outfit.id)}
              >
                <Heart size={20} color={Colors.white} />
              </TouchableOpacity>
            )}
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <ScrollView
              style={styles.scrollableContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Outfit Name */}
              <Text style={styles.outfitName}>{outfit.name}</Text>

              {/* Source Type Indicator */}
              {outfit.source_type === 'ai_generated' && (
                <View style={styles.sourceTypeContainer}>
                  <Text style={styles.sourceTypeText}>AI Generated</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {onTry && (
                  <TouchableOpacity
                    style={styles.tryButton}
                    onPress={() => onTry(outfit.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tryButtonText}>Try</Text>
                  </TouchableOpacity>
                )}

                {false && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={handleEditOutfit}
                    activeOpacity={0.8}
                  >
                    <View style={styles.editButtonContent}>
                      <Edit2 size={20} color={Colors.primary[500]} />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {onProve && (
                  <TouchableOpacity
                    style={[
                      styles.proveButton,
                      isProcessing && styles.proveButtonProcessing,
                      !isReadyForTryOn && styles.proveButtonDisabled,
                    ]}
                    onPress={handleProveOutfit}
                    activeOpacity={0.8}
                    disabled={isProcessing}
                  >
                    <View style={styles.proveButtonContent}>
                      <CheckCircle
                        size={20}
                        color={
                          isProcessing
                            ? Colors.text.secondary
                            : Colors.surface.primary
                        }
                      />
                      <Text
                        style={[
                          styles.proveButtonText,
                          isProcessing && styles.proveButtonTextProcessing,
                        ]}
                      >
                        {getProveButtonText()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={clearProcessingError}>
                    <Text style={styles.errorDismiss}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Horizontal Items Scroll */}
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>
                  Items in this Outfit
                  {outfit.source_type === 'ai_generated' && (
                    <Text style={styles.itemsTitleSubtext}>
                      {' '}
                      • AI Generated
                    </Text>
                  )}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalItemsContent}
                  style={styles.horizontalItemsScroll}
                >
                  {outfit.items.map((item, index) => (
                    <View key={item.id} style={styles.horizontalItemCard}>
                      <View style={styles.itemNumberBadge}>
                        <Text style={styles.itemNumber}>{index + 1}</Text>
                      </View>
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.horizontalItemImage}
                        contentFit="cover"
                      />
                      <View style={styles.horizontalItemInfo}>
                        <Text
                          style={styles.horizontalItemName}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <Text style={styles.horizontalItemCategory}>
                          {item.category}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Virtual Try-On Modal */}
      <VirtualTryOnModal
        visible={showVirtualTryOn}
        onClose={() => setShowVirtualTryOn(false)}
        outfitId={outfit.id}
        clothingItems={outfit.items}
        userImage={userFullBodyImageUrl || userImage}
        existingResult={
          lastGeneratedImageUrl
            ? {
                generatedImageUrl: lastGeneratedImageUrl,
                processingTime: 30000,
                confidence: 0.85,
                metadata: {
                  prompt: `Virtual try-on of ${outfit.name}`,
                  styleInstructions: 'natural fit, professional photography',
                  itemsUsed: outfit.items.map(item => item.name),
                  timestamp: new Date().toISOString(),
                },
              }
            : undefined
        }
        onComplete={handleVirtualTryOnComplete}
        onSave={handleVirtualTryOnSave}
        onShare={handleVirtualTryOnShare}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  collageSection: {
    height: screenHeight * 0.6,
    position: 'relative',
    backgroundColor: Colors.background.secondary,
  },
  placeholderCollage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
  },
  placeholderText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  saveButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  contentSection: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    marginTop: -Layout.borderRadius.xl,
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  outfitName: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  actionButtonsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  tryButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    elevation: 2,
  },
  tryButtonText: {
    ...Typography.body.large,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  editButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    elevation: 2,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  editButtonText: {
    ...Typography.body.large,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  proveButton: {
    backgroundColor: Colors.success[500],
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadows.md,
    elevation: 4,
  },
  proveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  proveButtonText: {
    ...Typography.body.large,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  proveButtonProcessing: {
    backgroundColor: Colors.warning[500],
  },
  proveButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  proveButtonTextProcessing: {
    color: Colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error[700],
    fontWeight: '600',
  },
  errorDismiss: {
    ...Typography.body.small,
    color: Colors.error[500],
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  itemsContainer: {
    marginBottom: Spacing.xl,
  },
  itemsTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  horizontalItemsScroll: {
    flexGrow: 0,
  },
  horizontalItemsContent: {
    paddingRight: Spacing.md,
  },
  horizontalItemCard: {
    width: 140,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginRight: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  itemNumberBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  itemNumber: {
    ...Typography.caption.small,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  horizontalItemImage: {
    width: '100%',
    height: 100,
  },
  horizontalItemInfo: {
    padding: Spacing.sm,
  },
  horizontalItemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  horizontalItemCategory: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  sourceTypeContainer: {
    alignSelf: 'center',
    backgroundColor: Colors.primary[100],
    borderRadius: Layout.borderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  sourceTypeText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  itemsTitleSubtext: {
    ...Typography.heading.h4,
    color: Colors.text.secondary,
    fontWeight: '400',
  },
});

// Backward compatibility export
export const OutfitDetailModal = OutfitGalleryModal;
export type OutfitDetailModalProps = OutfitGalleryModalProps;
