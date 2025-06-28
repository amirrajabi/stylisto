import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  CheckCircle,
  Download,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useVirtualTryOn } from '../../hooks/useVirtualTryOn';
import { TryOnWorkflowState, VirtualTryOnResult } from '../../lib/virtualTryOn';
import { ClothingItem } from '../../types/wardrobe';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VirtualTryOnModalProps {
  visible: boolean;
  onClose: () => void;
  outfitId: string;
  clothingItems: ClothingItem[];
  userImage?: string;
  existingResult?: VirtualTryOnResult | null;
  onComplete?: (result: VirtualTryOnResult) => void;
  onSave?: (result: VirtualTryOnResult) => void;
  onShare?: (result: VirtualTryOnResult) => void;
}

export const VirtualTryOnModal: React.FC<VirtualTryOnModalProps> = ({
  visible,
  onClose,
  outfitId,
  clothingItems,
  userImage,
  existingResult,
  onComplete,
  onSave,
  onShare,
}) => {
  const [workflowState, setWorkflowState] = useState<TryOnWorkflowState>({
    phase: 'input_analysis',
    progress: 0,
    message: 'Initializing virtual try-on...',
  });
  const [localResult, setLocalResult] = useState<VirtualTryOnResult | null>(
    null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [localIsProcessing, setLocalIsProcessing] = useState(false);
  const [hasTriedOnce, setHasTriedOnce] = useState(false);

  const {
    startVirtualTryOn: hookStartVirtualTryOn,
    resetVirtualTryOn,
    isProcessing: hookIsProcessing,
    progress: hookProgress,
    error: hookError,
    result: hookResult,
  } = useVirtualTryOn();

  const router = useRouter();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const viewShotRef = useRef<ViewShot | null>(null);
  const [collageUri, setCollageUri] = useState<string | null>(null);

  // Track if we should render collage view
  const [needsCollageCapture, setNeedsCollageCapture] = useState(false);

  // Track when we can safely capture
  const [canCapture, setCanCapture] = useState(false);

  // Pre-render collage view if we're on native platform
  useEffect(() => {
    if (
      (Platform.OS === 'ios' || Platform.OS === 'android') &&
      userImage &&
      visible
    ) {
      console.log('📱 Native platform detected, enabling collage view');
      setNeedsCollageCapture(true);
      // Allow capture after a longer delay
      const timer = setTimeout(() => {
        console.log('✅ Collage view should be ready for capture');
        setCanCapture(true);
      }, 2000); // Increased to 2 seconds

      return () => clearTimeout(timer);
    }
  }, [userImage, visible]);

  // Sync hook state with local state
  useEffect(() => {
    if (hookResult) {
      setLocalResult(hookResult);
      setWorkflowState({
        phase: 'completed',
        progress: 100,
        message: 'Virtual try-on completed successfully!',
      });
    }
    if (hookError) {
      setLocalError(hookError);
      setWorkflowState({
        phase: 'error',
        progress: 0,
        message: hookError,
      });
    }
    setLocalIsProcessing(hookIsProcessing);
    if (hookProgress > 0) {
      setWorkflowState(prev => ({ ...prev, progress: hookProgress }));
    }
  }, [hookResult, hookError, hookIsProcessing, hookProgress]);

  // Use local state for display
  const result = localResult;
  const error = localError;
  const isProcessing = localIsProcessing;

  const progressAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);

  // Create native collage if needed
  const createNativeCollage = useCallback(async (): Promise<string> => {
    console.log('🔍 createNativeCollage called with:', {
      hasUserImage: !!userImage,
      userImageLength: userImage?.length,
      hasViewShotRef: !!viewShotRef,
      hasViewShotRefCurrent: !!viewShotRef.current,
      canCapture,
    });

    if (!userImage) {
      throw new Error('User image not available');
    }

    try {
      // Wait for canCapture if needed
      if (!canCapture) {
        console.log('⏳ Waiting for collage view to be ready...');
        let attempts = 0;
        const maxAttempts = 30;

        // Use a promise to wait for canCapture
        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            attempts++;
            if (canCapture) {
              clearInterval(checkInterval);
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              reject(new Error('Collage view not ready after waiting'));
            }
          }, 100);
        });
      }

      console.log('🎨 Starting native collage creation...');

      // Wait a moment to ensure the view is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));

      // Detailed ref check
      console.log('🔍 ViewShot ref check:', {
        refExists: !!viewShotRef,
        currentExists: !!viewShotRef.current,
        currentType: typeof viewShotRef.current,
        currentKeys: viewShotRef.current
          ? Object.keys(viewShotRef.current)
          : [],
      });

      // Check if ref is available
      if (!viewShotRef.current) {
        console.error('ViewShot ref not available');
        // Try waiting a bit more
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!viewShotRef.current) {
          throw new Error('ViewShot ref not available even after waiting');
        }
      }

      const viewShot = viewShotRef.current as any;
      console.log('🔍 ViewShot methods check:', {
        hasCapture: 'capture' in viewShot,
        captureType: typeof viewShot.capture,
        allMethods: Object.keys(viewShot).filter(
          key => typeof viewShot[key] === 'function'
        ),
      });

      if (!viewShot || !viewShot.capture) {
        throw new Error('ViewShot capture method not available');
      }

      console.log('📸 Capturing native collage...');

      // Use captureRef instead of ref.capture
      const uri = await captureRef(viewShotRef, {
        format: 'jpg',
        quality: 0.9,
        result: 'data-uri',
      });

      if (!uri) {
        throw new Error('Failed to capture collage');
      }

      setCollageUri(uri);
      console.log('✅ Native collage created:', uri);

      return uri;
    } catch (error) {
      console.error('❌ Failed to create native collage:', error);
      throw error;
    }
  }, [userImage, canCapture]);

  // New startVirtualTryOn function that uses the hook
  const startVirtualTryOn = async () => {
    if (!userImage) {
      setLocalError('User image is required for virtual try-on');
      return;
    }

    setLocalIsProcessing(true);
    setLocalError(null);
    setHasTriedOnce(true);

    try {
      // Use the original approach for now
      console.log('🚀 Starting virtual try-on process');

      const tryOnResult = await hookStartVirtualTryOn(
        outfitId,
        userImage,
        clothingItems
      );

      setLocalResult(tryOnResult);
      onComplete?.(tryOnResult);
    } catch (err) {
      // Error is handled by the hook and synced to local state
      console.error('Virtual try-on error:', err);
      setLocalError(
        err instanceof Error ? err.message : 'Unknown error occurred'
      );
    }
  };

  useEffect(() => {
    if (visible) {
      // If we have an existing result, show it immediately
      if (existingResult) {
        console.log(
          '📸 VirtualTryOnModal: Showing existing result',
          existingResult
        );
        setLocalResult(existingResult);
        setWorkflowState({
          phase: 'completed',
          progress: 100,
          message: 'Virtual try-on completed successfully!',
        });
        setHasTriedOnce(true);
        return;
      }

      // Otherwise start new process if not already done
      if (!isProcessing && !result && !error && !hasTriedOnce) {
        console.log(
          '🚀 VirtualTryOnModal: Starting new virtual try-on process'
        );
        startVirtualTryOn();
      }
    }
  }, [visible, existingResult]);

  useEffect(() => {
    Animated.timing(progressAnimation, {
      toValue: workflowState.progress / 100,
      duration: 500,
      useNativeDriver: false,
    }).start();

    if (
      workflowState.phase !== 'completed' &&
      workflowState.phase !== 'error'
    ) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [workflowState]);

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleRestart = () => {
    setLocalResult(null);
    setLocalError(null);
    setHasTriedOnce(false);
    setWorkflowState({
      phase: 'input_analysis',
      progress: 0,
      message: 'Initializing virtual try-on...',
    });
    startVirtualTryOn();
  };

  const handleSave = () => {
    if (result) {
      onSave?.(result);
    }
  };

  const handleShare = () => {
    if (result) {
      onShare?.(result);
    }
  };

  const handleDebugInfo = () => {
    if (result) {
      const debugInfo = JSON.stringify(
        {
          outfitId,
          confidence: result.confidence,
          processingTime: result.processingTime,
          generatedImageUrl: result.generatedImageUrl,
          metadata: result.metadata,
          clothingItems: clothingItems.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
          })),
        },
        null,
        2
      );

      console.log('🔍 Virtual Try-On Debug Info:', debugInfo);
    }
  };

  const handleTestPage = () => {
    router.push('/test-virtual-tryon');
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'input_analysis':
        return <Sparkles size={24} color={Colors.primary[600]} />;
      case 'ai_styling':
        return <Zap size={24} color={Colors.primary[600]} />;
      case 'api_transmission':
        return <Upload size={24} color={Colors.primary[600]} />;
      case 'output_delivery':
        return <Download size={24} color={Colors.primary[600]} />;
      case 'completed':
        return <CheckCircle size={24} color={Colors.success[600]} />;
      case 'error':
        return <X size={24} color={Colors.error[600]} />;
      default:
        return <Sparkles size={24} color={Colors.primary[600]} />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'completed':
        return Colors.success[600];
      case 'error':
        return Colors.error[600];
      default:
        return Colors.primary[600];
    }
  };

  console.log('🔍 VirtualTryOnModal render check:', {
    visible,
    existingResult: !!existingResult,
    hasResult: !!result,
    outfitId,
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Virtual Try-On</Text>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            disabled={isProcessing}
          >
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Outfit Items Preview */}
          <View style={styles.outfitPreview}>
            <Text style={styles.sectionTitle}>Outfit Items</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.itemsScroll}
            >
              {clothingItems.map((item, index) => (
                <View key={item.id} style={styles.itemCard}>
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                  />
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Initial State - Show buttons for actions */}
          {!isProcessing && !result && !error && hasTriedOnce && (
            <View style={styles.initialState}>
              <Text style={styles.initialTitle}>Ready for Virtual Try-On</Text>
              <Text style={styles.initialMessage}>
                Start the virtual try-on process to see how this outfit looks on
                you
              </Text>
              <TouchableOpacity
                style={styles.startButton}
                onPress={handleRestart}
              >
                <Sparkles size={20} color={Colors.surface.primary} />
                <Text style={styles.startButtonText}>Start Virtual Try-On</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Show View Result option when we haven't started but have previous result */}
          {!isProcessing && result && !error && (
            <View style={styles.initialState}>
              <Text style={styles.initialTitle}>Previous Result Available</Text>
              <Text style={styles.initialMessage}>
                You have a previous virtual try-on result for this outfit
              </Text>
              <View style={styles.actionButtonsRow}>
                <TouchableOpacity
                  style={styles.viewResultButton}
                  onPress={() => {
                    // Just scroll down to show the result - no API call
                  }}
                >
                  <CheckCircle size={20} color={Colors.primary[600]} />
                  <Text style={styles.viewResultButtonText}>View Result</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={handleRestart}
                >
                  <Sparkles size={20} color={Colors.surface.primary} />
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Progress Section */}
          {!result && !error && (
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Animated.View
                  style={[
                    styles.phaseIcon,
                    { transform: [{ scale: pulseAnimation }] },
                  ]}
                >
                  {getPhaseIcon(workflowState.phase)}
                </Animated.View>
                <Text style={styles.progressMessage}>
                  {workflowState.message}
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBar,
                    {
                      width: progressAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                      backgroundColor: getPhaseColor(workflowState.phase),
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressText}>
                {Math.round(workflowState.progress)}% Complete
              </Text>

              {/* Phase Indicators */}
              <View style={styles.phaseIndicators}>
                {[
                  'input_analysis',
                  'ai_styling',
                  'api_transmission',
                  'output_delivery',
                ].map((phase, index) => (
                  <View
                    key={phase}
                    style={[
                      styles.phaseIndicator,
                      {
                        backgroundColor:
                          workflowState.phase === phase
                            ? Colors.primary[600]
                            : Colors.background.secondary,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.errorSection}>
              <View style={styles.errorIcon}>
                <X size={48} color={Colors.error[600]} />
              </View>
              <Text style={styles.errorTitle}>Virtual Try-On Failed</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRestart}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Result Section */}
          {result && (
            <ScrollView style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Virtual Try-On Result</Text>

              {/* نمایش نتیجه نهایی */}
              <View style={styles.finalResultSection}>
                <Text style={styles.sectionTitle}>Final Result:</Text>
                <Image
                  source={{ uri: result.generatedImageUrl }}
                  style={styles.resultImage}
                  contentFit="contain"
                  placeholder={require('@/assets/images/partial-react-logo.png')}
                />
              </View>

              <View style={styles.resultMetadata}>
                <Text style={styles.metadataTitle}>Processing Details:</Text>
                <Text style={styles.metadataText}>
                  Processing Time: {(result.processingTime / 1000).toFixed(2)}s
                </Text>
                <Text style={styles.metadataText}>
                  Confidence: {(result.confidence * 100).toFixed(0)}%
                </Text>
                <Text style={styles.metadataText}>
                  Items Used: {result.metadata.itemsUsed.length}
                </Text>
              </View>

              <View style={styles.resultActions}>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.actionButton, styles.saveButton]}
                  disabled={isProcessing}
                >
                  <Text style={styles.actionButtonText}>
                    {isProcessing ? 'Saving...' : 'Save Result'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleShare}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>Share</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRestart}
                  style={[styles.actionButton, styles.retryButton]}
                >
                  <Text style={styles.actionButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.background.secondary,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.background.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  outfitPreview: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  itemsScroll: {
    marginBottom: Spacing.lg,
  },
  itemCard: {
    width: 120,
    marginRight: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    ...Shadows.sm,
  },
  itemImage: {
    width: '100%',
    height: 100,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  progressSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    ...Shadows.sm,
  },
  progressHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  phaseIcon: {
    marginBottom: Spacing.md,
  },
  progressMessage: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: Layout.borderRadius.full,
    marginVertical: Spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  progressText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  phaseIndicators: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  phaseIndicator: {
    flex: 1,
    height: 4,
    borderRadius: Layout.borderRadius.full,
  },
  errorSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.xl,
    marginVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  errorIcon: {
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    ...Typography.heading.h3,
    color: Colors.error[600],
    marginBottom: Spacing.md,
  },
  errorMessage: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  retryButtonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
  },
  resultContainer: {
    flex: 1,
    padding: Spacing.lg,
  },
  resultTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  finalResultSection: {
    marginBottom: Spacing.lg,
  },
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: Layout.borderRadius.md,
  },
  resultMetadata: {
    marginBottom: Spacing.lg,
  },
  metadataTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  metadataText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  resultActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[700],
  },
  saveButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[700],
  },
  actionButtonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
  },
  initialState: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.xl,
    marginVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  initialTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  initialMessage: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  startButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  startButtonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  viewResultButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  viewResultButtonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
  },
});
