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

import { ArrowLeft, Brain, Edit2, Heart } from 'lucide-react-native';
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
import { ClothingItemCard } from '../wardrobe/ClothingItemCard';
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
                height={screenHeight * 0.5}
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
              {/* Outfit Name and AI Proven Button */}
              <View style={styles.titleContainer}>
                <Text style={styles.outfitName}>{outfit.name}</Text>
                {onProve && (
                  <TouchableOpacity
                    style={[
                      styles.aiProvenButton,
                      isProcessing && styles.aiProvenButtonProcessing,
                      !isReadyForTryOn && styles.aiProvenButtonDisabled,
                    ]}
                    onPress={handleProveOutfit}
                    activeOpacity={0.8}
                    disabled={isProcessing}
                  >
                    <Brain
                      size={14}
                      color={
                        isProcessing
                          ? Colors.text.secondary
                          : Colors.surface.primary
                      }
                    />
                    <Text
                      style={[
                        styles.aiProvenButtonText,
                        isProcessing && styles.aiProvenButtonTextProcessing,
                      ]}
                    >
                      {isProcessing
                        ? (processingPhase || 'Processing') + '...'
                        : 'AI Try-On'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Items Horizontal Scroll */}
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
                    <View key={item.id} style={styles.horizontalItemContainer}>
                      <ClothingItemCard
                        item={item}
                        index={index}
                        onPress={() => {}}
                        onToggleFavorite={() => {}}
                        onMoreOptions={() => {}}
                        showStats={false}
                      />
                    </View>
                  ))}
                </ScrollView>
              </View>

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
    height: screenHeight * 0.5,
    position: 'relative',
    backgroundColor: Colors.background.secondary,
    paddingBottom: Spacing.xl,
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  outfitName: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
    fontWeight: '700',
    flex: 1,
    textAlign: 'left',
  },
  aiProvenButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginLeft: Spacing.md,
    ...Shadows.sm,
  },
  aiProvenButtonProcessing: {
    backgroundColor: Colors.surface.secondary,
  },
  aiProvenButtonDisabled: {
    backgroundColor: Colors.surface.disabled,
  },
  aiProvenButtonText: {
    ...Typography.caption.medium,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  aiProvenButtonTextProcessing: {
    color: Colors.text.secondary,
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
  horizontalItemContainer: {
    width: 180,
    marginRight: Spacing.md,
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
