import { Image } from 'expo-image';
import {
  CheckCircle,
  Download,
  Heart,
  Share2,
  Sparkles,
  Upload,
  X,
  Zap,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import {
  TryOnWorkflowState,
  VirtualTryOnResult,
  useVirtualTryOn,
} from '../../lib/virtualTryOn';
import { ClothingItem } from '../../types/wardrobe';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VirtualTryOnModalProps {
  visible: boolean;
  onClose: () => void;
  outfitId: string;
  clothingItems: ClothingItem[];
  userImage?: string;
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
  onComplete,
  onSave,
  onShare,
}) => {
  const [workflowState, setWorkflowState] = useState<TryOnWorkflowState>({
    phase: 'input_analysis',
    progress: 0,
    message: 'Initializing virtual try-on...',
  });
  const [result, setResult] = useState<VirtualTryOnResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasTriedOnce, setHasTriedOnce] = useState(false);

  const { processOutfitTryOn } = useVirtualTryOn();

  const progressAnimation = new Animated.Value(0);
  const pulseAnimation = new Animated.Value(1);

  useEffect(() => {
    if (visible && !isProcessing && !result && !error && !hasTriedOnce) {
      startVirtualTryOn();
    }
  }, [visible]);

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

  const startVirtualTryOn = async () => {
    if (!userImage) {
      setError('User image is required for virtual try-on');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const tryOnResult = await processOutfitTryOn(
        outfitId,
        userImage,
        clothingItems,
        state => {
          setWorkflowState(state);
        }
      );

      setResult(tryOnResult);
      onComplete?.(tryOnResult);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Virtual try-on failed';
      setError(errorMessage);
      setWorkflowState({
        phase: 'error',
        progress: 0,
        message: errorMessage,
      });
    } finally {
      setIsProcessing(false);
      setHasTriedOnce(true);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  const handleRestart = () => {
    setResult(null);
    setError(null);
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
            <View style={styles.resultSection}>
              <View style={styles.successIcon}>
                <CheckCircle size={48} color={Colors.success[600]} />
              </View>
              <Text style={styles.successTitle}>Virtual Try-On Complete!</Text>
              <Text style={styles.successMessage}>
                Your outfit has been successfully generated with AI styling
              </Text>

              <View style={styles.resultImageContainer}>
                <Image
                  source={{ uri: result.generatedImageUrl }}
                  style={styles.resultImage}
                  contentFit="cover"
                />
              </View>

              <View style={styles.resultStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Confidence</Text>
                  <Text style={styles.statValue}>
                    {Math.round(result.confidence * 100)}%
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Processing Time</Text>
                  <Text style={styles.statValue}>
                    {Math.round(result.processingTime / 1000)}s
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Heart size={20} color={Colors.surface.primary} />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                >
                  <Share2 size={20} color={Colors.primary[600]} />
                  <Text style={styles.shareButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
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
  resultSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.xl,
    marginVertical: Spacing.lg,
    alignItems: 'center',
    ...Shadows.sm,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.heading.h3,
    color: Colors.success[600],
    marginBottom: Spacing.md,
  },
  successMessage: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  resultImageContainer: {
    width: screenWidth - Spacing.lg * 4,
    height: screenWidth - Spacing.lg * 4,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  saveButtonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.secondary,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  shareButtonText: {
    ...Typography.button.medium,
    color: Colors.primary[600],
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
