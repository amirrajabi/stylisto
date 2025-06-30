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

import {
  ArrowLeft,
  Brain,
  Download,
  Edit2,
  Heart,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import { useAuth } from '../../hooks/useAuth';
import { useVirtualTryOn } from '../../hooks/useVirtualTryOn';
import { useVirtualTryOnStore } from '../../hooks/useVirtualTryOnStore';
import { storageService } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import { VirtualTryOnResult } from '../../lib/virtualTryOn';
import { ClothingItem } from '../../types/wardrobe';
import { NativeCollageView } from '../ui/NativeCollageView';
import { ProgressBar } from '../ui/ProgressBar';
import { Toast } from '../ui/Toast';
import { ZoomableImage } from '../ui/ZoomableImage';
import { ClothingItemCard } from '../wardrobe/ClothingItemCard';

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

type ModalViewState = 'outfit' | 'processing' | 'result';

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
  const [modalViewState, setModalViewState] =
    useState<ModalViewState>('outfit');
  const [tryOnResult, setTryOnResult] = useState<VirtualTryOnResult | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [hasExistingTryOn, setHasExistingTryOn] = useState(false);
  const viewShotRef = useRef<ViewShot | null>(null);

  const { user } = useAuth();

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

  const {
    startVirtualTryOn,
    resetVirtualTryOn,
    isProcessing: hookIsProcessing,
    progress: hookProgress,
    error: hookError,
    result: hookResult,
  } = useVirtualTryOn();

  // Animation values for processing view
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sparkleRotateAnim = useRef(new Animated.Value(0)).current;

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
      clearOutfit();
      resetVirtualTryOn();
      setModalViewState('outfit');
      setTryOnResult(null);
      setHasExistingTryOn(false);
    }
  }, [visible, outfit, updateCurrentOutfit, clearOutfit, resetVirtualTryOn]);

  // Handle try-on result updates
  useEffect(() => {
    if (hookResult) {
      setTryOnResult(hookResult);
      setModalViewState('result');
      setHasExistingTryOn(true);
      onVirtualTryOnComplete?.(hookResult);
    }
  }, [hookResult, onVirtualTryOnComplete]);

  // Handle processing state
  useEffect(() => {
    if (hookIsProcessing) {
      setModalViewState('processing');
    }
  }, [hookIsProcessing]);

  // Processing view animations
  useEffect(() => {
    if (modalViewState === 'processing') {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Continuous pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );

      // Continuous sparkle rotation
      const sparkleAnimation = Animated.loop(
        Animated.timing(sparkleRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      pulseAnimation.start();
      sparkleAnimation.start();

      return () => {
        pulseAnimation.stop();
        sparkleAnimation.stop();
      };
    } else {
      fadeAnim.setValue(0);
      pulseAnim.setValue(1);
      sparkleRotateAnim.setValue(0);
    }
  }, [modalViewState, fadeAnim, pulseAnim, sparkleRotateAnim]);

  // Handle existing results from store
  useEffect(() => {
    if (lastGeneratedImageUrl && modalViewState === 'outfit') {
      const storeResult: VirtualTryOnResult = {
        generatedImageUrl: lastGeneratedImageUrl,
        processingTime: 30000,
        confidence: 0.85,
        metadata: {
          prompt: lastGeneratedPrompt || `Virtual try-on of ${outfit?.name}`,
          styleInstructions: 'natural fit, professional photography',
          itemsUsed: outfit?.items.map(item => item.name) || [],
          timestamp: new Date().toISOString(),
        },
      };
      setTryOnResult(storeResult);
    }
  }, [lastGeneratedImageUrl, lastGeneratedPrompt, outfit, modalViewState]);

  // Check for existing virtual try-on results for this outfit
  useEffect(() => {
    const checkExistingTryOn = async () => {
      if (!outfit?.id || !user?.id || !visible) {
        setHasExistingTryOn(false);
        return;
      }

      try {
        console.log('🔍 Checking for existing virtual try-on results...', {
          outfitId: outfit.id,
          userId: user.id,
        });

        const { data, error } = await supabase
          .from('virtual_try_on_results')
          .select('id, generated_image_url, created_at')
          .eq('user_id', user.id)
          .eq('outfit_id', outfit.id)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('❌ Error checking existing try-on:', error);
          setHasExistingTryOn(false);
          return;
        }

        if (data && data.length > 0) {
          console.log('✅ Found existing virtual try-on result');
          setHasExistingTryOn(true);

          // Optionally load the existing result
          const existingResult: VirtualTryOnResult = {
            generatedImageUrl: data[0].generated_image_url,
            processingTime: 30000,
            confidence: 0.85,
            metadata: {
              prompt: `Virtual try-on of ${outfit.name}`,
              styleInstructions: 'natural fit, professional photography',
              itemsUsed: outfit.items.map(item => item.name),
              timestamp: data[0].created_at,
            },
          };
          setTryOnResult(existingResult);
        } else {
          console.log('ℹ️ No existing virtual try-on found');
          setHasExistingTryOn(false);
        }
      } catch (error) {
        console.error('❌ Error checking existing try-on:', error);
        setHasExistingTryOn(false);
      }
    };

    checkExistingTryOn();
  }, [outfit?.id, user?.id, visible]);

  if (!outfit) {
    return null;
  }

  const handleTryOutfit = async () => {
    console.log('👕 Try outfit function called');

    const actualUserImage = userFullBodyImageUrl || userImage;

    if (!actualUserImage) {
      console.log('❌ No user image available for virtual try-on');
      alert(
        'Virtual Try-On requires a full-body photo.\n\n' +
          'Please go to Profile → Edit Profile → Upload Full Body Image to use this feature.'
      );
      return;
    }

    setModalViewState('processing');
    resetVirtualTryOn();

    try {
      await startVirtualTryOn(outfit.id, actualUserImage, outfit.items);
      if (onTry) {
        onTry(outfit.id);
      }
    } catch (error) {
      console.error('Virtual try-on failed:', error);
      setModalViewState('outfit');
    }
  };

  const handleProveOutfit = async () => {
    console.log('🚀 AI Try-On button clicked');

    const actualUserImage = userFullBodyImageUrl || userImage;

    if (!actualUserImage) {
      console.log('❌ No user image available for virtual try-on');
      alert(
        'Virtual Try-On requires a full-body photo.\n\n' +
          'Please go to Profile → Edit Profile → Upload Full Body Image to use this feature.'
      );
      return;
    }

    // If we already have results (from store or database), just show them
    if (hasExistingTryOn || lastGeneratedImageUrl || tryOnResult) {
      console.log('📱 Showing existing virtual try-on result');
      setModalViewState('result');
      return;
    }

    // Reset previous try-on state first
    resetVirtualTryOn();

    // Ensure outfit is synced to store
    console.log('👔 Syncing outfit to store before try-on...');
    updateCurrentOutfit(outfit.id, outfit.name, outfit.items);

    // Give store a moment to update
    await new Promise(resolve => setTimeout(resolve, 50));

    // Start new try-on process immediately
    setModalViewState('processing');

    try {
      // Pass outfit data directly to avoid store dependency issues
      await startVirtualTryOn(outfit.id, actualUserImage, outfit.items);
      if (onProve) {
        onProve(outfit.id);
      }
    } catch (error) {
      console.error('Virtual try-on failed:', error);
      setModalViewState('outfit');
    }
  };

  const handleBackToOutfit = () => {
    setModalViewState('outfit');
  };

  const handleSaveResult = async () => {
    if (!user?.id || !outfit?.id) {
      console.error('❌ Missing required data for saving');
      return;
    }

    setIsSaving(true);
    console.log('💾 Starting virtual try-on save process...');

    try {
      let imageUrlToSave: string | null = null;

      if (tryOnResult?.generatedImageUrl) {
        imageUrlToSave = tryOnResult.generatedImageUrl;
      } else if (lastGeneratedImageUrl) {
        imageUrlToSave = lastGeneratedImageUrl;
      }

      if (!imageUrlToSave) {
        console.error('❌ No generated image URL found to save');
        return;
      }

      console.log('📸 Saving virtual try-on result:', {
        outfitId: outfit.id,
        outfitName: outfit.name,
        userId: user.id,
        hasImage: !!imageUrlToSave,
      });

      const result = await storageService.saveVirtualTryOnResult(
        imageUrlToSave,
        user.id,
        outfit.id,
        outfit.name,
        {
          processingTime: tryOnResult?.processingTime || 30000,
          confidence: tryOnResult?.confidence || 0.85,
          prompt:
            tryOnResult?.metadata?.prompt ||
            lastGeneratedPrompt ||
            `Virtual try-on of ${outfit.name}`,
          styleInstructions:
            tryOnResult?.metadata?.styleInstructions ||
            'natural fit, professional photography',
          itemsUsed:
            tryOnResult?.metadata?.itemsUsed ||
            outfit.items.map(item => item.name),
          userImageUrl: userFullBodyImageUrl || userImage,
        }
      );

      if (result.error) {
        throw result.error;
      }

      console.log('✅ Virtual try-on result saved successfully!');

      // Show success toast
      setShowSuccessToast(true);

      // Mark as having existing try-on
      setHasExistingTryOn(true);

      if (tryOnResult) {
        const enhancedResult = {
          ...tryOnResult,
          savedAt: new Date().toISOString(),
          outfitId: outfit.id,
          outfitName: outfit.name,
        };
        onVirtualTryOnSave?.(enhancedResult);
      } else if (lastGeneratedImageUrl) {
        const storeResult: VirtualTryOnResult = {
          generatedImageUrl: lastGeneratedImageUrl,
          processingTime: 30000,
          confidence: 0.85,
          metadata: {
            prompt: lastGeneratedPrompt || `Virtual try-on of ${outfit.name}`,
            styleInstructions: 'natural fit, professional photography',
            itemsUsed: outfit.items.map(item => item.name),
            timestamp: new Date().toISOString(),
          },
        };

        const enhancedResult = {
          ...storeResult,
          savedAt: new Date().toISOString(),
          outfitId: outfit.id,
          outfitName: outfit.name,
        };
        onVirtualTryOnSave?.(enhancedResult);
      }
    } catch (error) {
      console.error('❌ Failed to save virtual try-on result:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareResult = () => {
    if (tryOnResult) {
      onVirtualTryOnShare?.(tryOnResult);
    } else if (lastGeneratedImageUrl) {
      const storeResult: VirtualTryOnResult = {
        generatedImageUrl: lastGeneratedImageUrl,
        processingTime: 30000,
        confidence: 0.85,
        metadata: {
          prompt: lastGeneratedPrompt || `Virtual try-on of ${outfit.name}`,
          styleInstructions: 'natural fit, professional photography',
          itemsUsed: outfit.items.map(item => item.name),
          timestamp: new Date().toISOString(),
        },
      };
      onVirtualTryOnShare?.(storeResult);
    }
  };

  const handleEditOutfit = () => {
    console.log('📝 Edit outfit function called for outfit:', outfit.id);
    if (onEdit) {
      onEdit(outfit.id);
    }
  };

  const handleRetryTryOn = () => {
    resetVirtualTryOn();
    setTryOnResult(null);
    handleProveOutfit();
  };

  const getProveButtonText = () => {
    if (isProcessing || hookIsProcessing) {
      return `${processingPhase || 'Processing'}...`;
    }
    if (hasExistingTryOn || lastGeneratedImageUrl || tryOnResult) {
      return 'View Try-On';
    }
    return 'AI Try-On';
  };

  const hasCollageData =
    (userFullBodyImageUrl || userImage) && outfit.items.length > 0;

  const renderOutfitView = () => (
    <>
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
                  (isProcessing || hookIsProcessing) &&
                    styles.aiProvenButtonProcessing,
                ]}
                onPress={handleProveOutfit}
                activeOpacity={0.8}
                disabled={isProcessing || hookIsProcessing}
              >
                <Brain
                  size={14}
                  color={
                    isProcessing || hookIsProcessing
                      ? Colors.text.secondary
                      : Colors.surface.primary
                  }
                />
                <Text
                  style={[
                    styles.aiProvenButtonText,
                    (isProcessing || hookIsProcessing) &&
                      styles.aiProvenButtonTextProcessing,
                  ]}
                >
                  {getProveButtonText()}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Items Horizontal Scroll */}
          <View style={styles.itemsContainer}>
            <Text style={styles.itemsTitle}>
              Items in this Outfit
              {outfit.source_type === 'ai_generated' && (
                <Text style={styles.itemsTitleSubtext}> • AI Generated</Text>
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
                onPress={handleTryOutfit}
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
          {(error || hookError) && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error || hookError}</Text>
              <TouchableOpacity onPress={clearProcessingError}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>
    </>
  );

  const renderProcessingView = () => (
    <Animated.View style={[styles.processingContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity onPress={onClose} style={styles.processingBackButton}>
        <ArrowLeft size={24} color={Colors.text.primary} />
      </TouchableOpacity>

      <View style={styles.processingContent}>
        {/* Animated Sparkle Icon */}
        <Animated.View
          style={[
            styles.processingIconContainer,
            {
              transform: [
                { scale: pulseAnim },
                {
                  rotate: sparkleRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.processingIconBackground}>
            <Sparkles size={48} color={Colors.primary[500]} />
          </View>
        </Animated.View>

        {/* Main Title */}
        <Text style={styles.processingTitle}>Generating Your AI Try-On</Text>

        {/* Subtitle */}
        <Text style={styles.processingSubtitle}>
          {processingMessage || 'Creating AI-powered virtual try-on...'}
        </Text>

        {/* Enhanced Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabelContainer}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>
              {Math.round(hookProgress || processingProgress || 0)}%
            </Text>
          </View>

          <View style={styles.enhancedProgressContainer}>
            <ProgressBar
              progress={(hookProgress || processingProgress) / 100}
              label=""
              showPercentage={false}
              color={Colors.primary[500]}
            />
          </View>
        </View>

        {/* Processing Steps Indicator */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <Text style={styles.stepText} numberOfLines={1}>
              Analyzing
            </Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepDot,
                (hookProgress || processingProgress) > 30
                  ? styles.stepActive
                  : styles.stepInactive,
              ]}
            />
            <Text style={styles.stepText} numberOfLines={1}>
              AI Process
            </Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={styles.stepIndicator}>
            <View
              style={[
                styles.stepDot,
                (hookProgress || processingProgress) > 60
                  ? styles.stepActive
                  : styles.stepInactive,
              ]}
            />
            <Text style={styles.stepText} numberOfLines={1}>
              Generating
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderResultView = () => {
    const resultImageUrl =
      tryOnResult?.generatedImageUrl || lastGeneratedImageUrl;

    return (
      <View style={styles.resultContainer}>
        {/* Header */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultHeaderTitle}>AI Try-On Result</Text>
          <TouchableOpacity onPress={onClose} style={styles.resultCloseButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Result Image */}
        <View style={styles.resultImageContainer}>
          {resultImageUrl ? (
            <ZoomableImage
              source={{ uri: resultImageUrl }}
              style={styles.resultImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.resultPlaceholder}>
              <Text style={styles.resultPlaceholderText}>
                No result available
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetryTryOn}
            activeOpacity={0.8}
          >
            <RotateCcw size={20} color={Colors.text.primary} />
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveResultButton,
              isSaving && styles.saveResultButtonDisabled,
            ]}
            onPress={handleSaveResult}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Sparkles size={20} color={Colors.text.secondary} />
                <Text style={styles.saveResultButtonTextDisabled}>
                  Saving...
                </Text>
              </>
            ) : (
              <>
                <Download size={20} color={Colors.surface.primary} />
                <Text style={styles.saveResultButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {modalViewState === 'outfit' && renderOutfitView()}
        {modalViewState === 'processing' && renderProcessingView()}
        {modalViewState === 'result' && renderResultView()}
      </SafeAreaView>

      <Toast
        visible={showSuccessToast}
        message="Virtual try-on saved successfully!"
        type="success"
        onHide={() => setShowSuccessToast(false)}
        duration={3000}
      />
    </Modal>
  );
};

// Backward compatibility export
export const OutfitDetailModal = OutfitGalleryModal;
export type OutfitDetailModalProps = OutfitGalleryModalProps;

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
    top: 30,
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
    top: 30,
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    marginTop: -Layout.borderRadius.xl,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
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

  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    position: 'relative',
  },
  processingContent: {
    alignItems: 'center',
    width: '90%',
    maxWidth: 320,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.xl,
    ...Shadows.lg,
  },
  processingTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  processingSubtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  progressSection: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  progressLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  progressPercentage: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  enhancedProgressContainer: {
    width: '100%',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    width: '100%',
  },
  stepIndicator: {
    alignItems: 'center',
    minWidth: 80,
    maxWidth: 90,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: Spacing.xs,
  },
  stepActive: {
    backgroundColor: Colors.primary[500],
    ...Shadows.sm,
  },
  stepInactive: {
    backgroundColor: Colors.background.secondary,
  },
  stepText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 14,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.background.secondary,
    marginHorizontal: Spacing.xs,
    maxWidth: 40,
  },
  resultContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: Colors.background.primary,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  resultHeaderTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    fontWeight: '600',
    flex: 1,
    textAlign: 'left',
  },
  resultCloseButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.background.secondary,
  },
  resultImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background.primary,
  },
  resultImage: {
    width: '100%',
    height: '85%',
    borderRadius: Layout.borderRadius.xl,
    backgroundColor: Colors.surface.primary,
    ...Shadows.lg,
  },
  resultPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
  },
  resultPlaceholderText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  processingBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
    borderWidth: 1,
    borderColor: Colors.border.secondary,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    gap: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  saveResultButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  saveResultButtonText: {
    ...Typography.body.medium,
    color: Colors.surface.primary,
    fontWeight: '500',
  },
  processingIconContainer: {
    marginBottom: Spacing.xl,
  },
  processingIconBackground: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary[100],
    ...Shadows.lg,
  },
  saveResultButtonDisabled: {
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'center',
  },
  saveResultButtonTextDisabled: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
});
