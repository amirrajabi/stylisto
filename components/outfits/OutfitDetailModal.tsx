/*
 * OutfitDetailModal Component
 *
 * Features:
 * - Displays detailed outfit information including match scores
 * - Shows individual clothing items with their details
 * - Provides action buttons for save, share operations
 * - Shows "Try" button above Match Details section when onTry callback is provided
 * - Shows big attractive "Prove This Outfit" button for favorite outfits (isFavorite = true)
 * - Integrates Virtual Try-On functionality with FLUX API
 *
 * Props:
 * - onTry: Callback function when Try button is pressed
 * - onProve: Callback function when Prove button is pressed for favorite outfits
 * - outfit.isFavorite: Boolean flag to determine if outfit is favorited
 * - userImage: User's photo for virtual try-on
 *
 * Usage:
 * <OutfitDetailModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   outfit={{ ...outfitData, isFavorite: true }}
 *   userImage={userPhotoUrl}
 *   onTry={(outfitId) => handleTryOutfit(outfitId)}
 *   onProve={(outfitId) => handleProveOutfit(outfitId)}
 *   onSave={(outfitId) => handleSaveOutfit(outfitId)}
 *   onShare={(outfitId) => handleShareOutfit(outfitId)}
 * />
 */

import { Image } from 'expo-image';
import {
  Calendar,
  CheckCircle,
  Heart,
  Palette,
  Share2,
  Star,
  Sun,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
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

interface OutfitDetailModalProps {
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
  } | null;
  userImage?: string;
  onSave?: (outfitId: string) => void;
  onShare?: (outfitId: string) => void;
  onProve?: (outfitId: string) => void;
  onTry?: (outfitId: string) => void;
  onVirtualTryOnComplete?: (result: VirtualTryOnResult) => void;
  onVirtualTryOnSave?: (result: VirtualTryOnResult) => void;
  onVirtualTryOnShare?: (result: VirtualTryOnResult) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  visible,
  onClose,
  outfit,
  userImage,
  onSave,
  onShare,
  onProve,
  onTry,
  onVirtualTryOnComplete,
  onVirtualTryOnSave,
  onVirtualTryOnShare,
}) => {
  const [showVirtualTryOn, setShowVirtualTryOn] = useState(false);
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
    error,
    clearProcessingError,
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
    }
  }, [visible, outfit, updateCurrentOutfit, clearOutfit]);

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

    if (!isReadyForTryOn) {
      console.log('❌ Not ready for virtual try-on:', {
        hasUserImage: !!actualUserImage,
        hasOutfitItems: outfit.items.length > 0,
        isProcessing,
      });
      alert(
        'Virtual Try-On is not ready. Please ensure you have a full-body image and outfit items.'
      );
      return;
    }

    console.log('✅ User image available, starting virtual try-on...');
    console.log('📷 User image URL:', actualUserImage);
    console.log('👔 Outfit items:', outfit.items.length);

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
    console.log('Virtual try-on completed:', result);
    onVirtualTryOnComplete?.(result);
  };

  const handleVirtualTryOnSave = (result: VirtualTryOnResult) => {
    console.log('Saving virtual try-on result:', result);
    onVirtualTryOnSave?.(result);
  };

  const handleVirtualTryOnShare = (result: VirtualTryOnResult) => {
    console.log('Sharing virtual try-on result:', result);
    onVirtualTryOnShare?.(result);
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return Colors.success[500];
    if (score >= 0.6) return Colors.warning[500];
    return Colors.error[500];
  };

  const getScoreIcon = (type: string) => {
    switch (type) {
      case 'style':
        return <Star size={16} color={Colors.primary[500]} />;
      case 'color':
        return <Palette size={16} color={Colors.success[500]} />;
      case 'season':
        return <Sun size={16} color={Colors.info[500]} />;
      case 'occasion':
        return <Calendar size={16} color={Colors.warning[500]} />;
      default:
        return <Star size={16} color={Colors.text.secondary} />;
    }
  };

  const totalScore = Math.round((outfit.score?.total || 0) * 100);

  // Enhanced button text based on Redux state
  const getProveButtonText = () => {
    if (isProcessing) {
      return `${processingMessage} (${processingProgress}%)`;
    }
    if (lastGeneratedImageUrl) {
      return 'View Results';
    }
    return 'Prove This Outfit';
  };

  return (
    <>
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
              <Text style={styles.modalTitle} numberOfLines={1}>
                {outfit.name}
              </Text>
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
              {onShare && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onShare(outfit.id)}
                >
                  <Share2 size={20} color={Colors.text.secondary} />
                </TouchableOpacity>
              )}
              {onSave && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onSave(outfit.id)}
                >
                  <Heart size={20} color={Colors.error[500]} />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Try Button */}
            {onTry && (
              <TouchableOpacity
                style={styles.tryButton}
                onPress={() => onTry(outfit.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.tryButtonText}>Try</Text>
              </TouchableOpacity>
            )}

            {/* Score Breakdown */}
            <View style={styles.scoresSection}>
              <Text style={styles.sectionTitle}>Match Details</Text>

              {/* Enhanced Prove Button for All Outfits */}
              {onProve && (
                <TouchableOpacity
                  style={[
                    styles.bigProveButton,
                    isProcessing && styles.bigProveButtonProcessing,
                    !isReadyForTryOn && styles.bigProveButtonDisabled,
                  ]}
                  onPress={handleProveOutfit}
                  activeOpacity={0.8}
                  disabled={isProcessing}
                >
                  <View style={styles.bigProveContent}>
                    <CheckCircle
                      size={24}
                      color={
                        isProcessing
                          ? Colors.text.secondary
                          : Colors.surface.primary
                      }
                    />
                    <Text
                      style={[
                        styles.bigProveText,
                        isProcessing && styles.bigProveTextProcessing,
                      ]}
                    >
                      {getProveButtonText()}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Error Display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={clearProcessingError}>
                    <Text style={styles.errorDismiss}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.scoreGrid}>
                {[
                  {
                    key: 'style',
                    label: 'Style Harmony',
                    value: outfit.score?.style || 0,
                  },
                  {
                    key: 'color',
                    label: 'Color Match',
                    value: outfit.score?.color || 0,
                  },
                  {
                    key: 'season',
                    label: 'Season Fit',
                    value: outfit.score?.season || 0,
                  },
                  {
                    key: 'occasion',
                    label: 'Occasion',
                    value: outfit.score?.occasion || 0,
                  },
                ].map(item => (
                  <View key={item.key} style={styles.scoreItem}>
                    <View style={styles.scoreItemHeader}>
                      {getScoreIcon(item.key)}
                      <Text style={styles.scoreLabel}>{item.label}</Text>
                    </View>
                    <View style={styles.scoreBarContainer}>
                      <View
                        style={[
                          styles.scoreBar,
                          {
                            width: `${item.value * 100}%`,
                            backgroundColor: getScoreColor(item.value),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.scorePercentage}>
                      {Math.round(item.value * 100)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Outfit Preview Collage */}
            {(userFullBodyImageUrl || userImage) && outfit.items.length > 0 && (
              <View style={styles.collageSection}>
                <Text style={styles.sectionTitle}>Outfit Preview</Text>
                <View style={styles.collageContainer}>
                  <NativeCollageView
                    userImage={userFullBodyImageUrl || userImage || ''}
                    clothingImages={outfit.items.map(item => item.imageUrl)}
                    width={screenWidth - Spacing.md * 2}
                    height={(screenWidth - Spacing.md * 2) * 1.2}
                    viewShotRef={viewShotRef}
                  />
                </View>
              </View>
            )}

            {/* Outfit Items (2) */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>
                Outfit Items ({outfit.items.length})
              </Text>
              <View style={styles.itemsGrid}>
                {outfit.items.map((item, index) => (
                  <View key={item.id} style={styles.itemContainer}>
                    <View style={styles.itemNumberBadge}>
                      <Text style={styles.itemNumber}>{index + 1}</Text>
                    </View>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemCategory}>{item.category}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
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
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proveButton: {
    backgroundColor: Colors.success[50],
    borderWidth: 1,
    borderColor: Colors.success[200],
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  tryButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
    elevation: 2,
  },
  tryButtonText: {
    ...Typography.body.medium,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  scoresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  bigProveButton: {
    backgroundColor: Colors.success[500],
    borderRadius: Layout.borderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadows.md,
    elevation: 4,
  },
  bigProveContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  bigProveText: {
    ...Typography.heading.h4,
    color: Colors.surface.primary,
    fontWeight: '700',
  },
  scoreGrid: {
    gap: Spacing.md,
  },
  scoreItem: {
    marginBottom: Spacing.md,
  },
  scoreItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
  scoreBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 4,
  },
  scorePercentage: {
    ...Typography.body.small,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  itemsSection: {
    marginBottom: Spacing.xl,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  itemContainer: {
    width: (screenWidth - Spacing.md * 3) / 2,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
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
  },
  itemNumber: {
    ...Typography.caption.small,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  itemImage: {
    width: '100%',
    height: 120,
  },
  itemInfo: {
    padding: Spacing.sm,
  },
  itemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  itemCategory: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: Spacing.xs,
  },
  bigProveButtonProcessing: {
    backgroundColor: Colors.warning[500],
  },
  bigProveButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  bigProveTextProcessing: {
    color: Colors.text.secondary,
  },
  errorContainer: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
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
  },
  collageSection: {
    marginBottom: Spacing.xl,
  },
  collageContainer: {
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
});
