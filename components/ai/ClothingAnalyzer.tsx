import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Sparkles, AlertCircle, RefreshCw, Check, Tag } from 'lucide-react-native';
import { useVisionAI, ClothingAnalysisResult } from '../../lib/visionAI';
import { ClothingCategory, Season, Occasion } from '../../types/wardrobe';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface ClothingAnalyzerProps {
  imageUri: string;
  onAnalysisComplete?: (result: ClothingAnalysisResult) => void;
  autoAnalyze?: boolean;
  showControls?: boolean;
}

export const ClothingAnalyzer: React.FC<ClothingAnalyzerProps> = ({
  imageUri,
  onAnalysisComplete,
  autoAnalyze = true,
  showControls = true,
}) => {
  const { analyzeClothing } = useVisionAI();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ClothingAnalysisResult | null>(null);

  const runAnalysis = useCallback(async () => {
    if (!imageUri) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const analysisResult = await analyzeClothing(imageUri);
      setResult(analysisResult);
      onAnalysisComplete?.(analysisResult);
    } catch (error) {
      setError(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [imageUri, analyzeClothing, onAnalysisComplete]);

  // Run analysis automatically if autoAnalyze is true
  useEffect(() => {
    if (autoAnalyze && imageUri && !result && !loading) {
      runAnalysis();
    }
  }, [autoAnalyze, imageUri, result, loading, runAnalysis]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return Colors.success[500];
    if (confidence >= 0.6) return Colors.warning[500];
    return Colors.error[500];
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  const getCategoryIcon = (category: ClothingCategory): React.ReactNode => {
    // This would be better with actual icons for each category
    return <Tag size={16} color={Colors.text.primary} />;
  };

  if (!imageUri) {
    return (
      <View style={styles.container}>
        <Text style={styles.noImageText}>No image provided for analysis</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Image Preview */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
        />
      </View>

      {/* Analysis Results */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[700]} />
          <Text style={styles.loadingText}>Analyzing clothing item...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <AlertCircle size={24} color={Colors.error[500]} />
          <Text style={styles.errorText}>{error}</Text>
          {showControls && (
            <TouchableOpacity style={styles.retryButton} onPress={runAnalysis}>
              <RefreshCw size={16} color={Colors.white} />
              <Text style={styles.retryButtonText}>Retry Analysis</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : result ? (
        <View style={styles.resultsContainer}>
          <View style={styles.resultHeader}>
            <Sparkles size={20} color={Colors.primary[700]} />
            <Text style={styles.resultTitle}>AI Analysis Results</Text>
          </View>

          {/* Category */}
          <View style={styles.resultRow}>
            <View style={styles.resultLabel}>
              <Text style={styles.labelText}>Category:</Text>
            </View>
            <View style={styles.resultValue}>
              <View style={styles.categoryBadge}>
                {getCategoryIcon(result.category)}
                <Text style={styles.categoryText}>
                  {result.category.replace('_', ' ')}
                </Text>
              </View>
              <View style={styles.confidenceContainer}>
                <View 
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: getConfidenceColor(result.confidence.category) },
                    { width: `${result.confidence.category * 100}%` },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {formatConfidence(result.confidence.category)}
                </Text>
              </View>
            </View>
          </View>

          {/* Subcategory */}
          {result.subcategory && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabel}>
                <Text style={styles.labelText}>Type:</Text>
              </View>
              <View style={styles.resultValue}>
                <Text style={styles.valueText}>{result.subcategory}</Text>
              </View>
            </View>
          )}

          {/* Color */}
          <View style={styles.resultRow}>
            <View style={styles.resultLabel}>
              <Text style={styles.labelText}>Color:</Text>
            </View>
            <View style={styles.resultValue}>
              <View style={styles.colorContainer}>
                <View 
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: result.color },
                  ]}
                />
                <Text style={styles.valueText}>
                  {result.color.startsWith('#') 
                    ? result.color 
                    : result.color.charAt(0).toUpperCase() + result.color.slice(1)}
                </Text>
              </View>
              <View style={styles.confidenceContainer}>
                <View 
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: getConfidenceColor(result.confidence.color) },
                    { width: `${result.confidence.color * 100}%` },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {formatConfidence(result.confidence.color)}
                </Text>
              </View>
            </View>
          </View>

          {/* Seasons */}
          <View style={styles.resultRow}>
            <View style={styles.resultLabel}>
              <Text style={styles.labelText}>Seasons:</Text>
            </View>
            <View style={styles.resultValue}>
              <View style={styles.tagsContainer}>
                {result.seasons.map((season) => (
                  <View key={season} style={styles.seasonTag}>
                    <Text style={styles.tagText}>{season}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.confidenceContainer}>
                <View 
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: getConfidenceColor(result.confidence.seasons) },
                    { width: `${result.confidence.seasons * 100}%` },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {formatConfidence(result.confidence.seasons)}
                </Text>
              </View>
            </View>
          </View>

          {/* Occasions */}
          <View style={styles.resultRow}>
            <View style={styles.resultLabel}>
              <Text style={styles.labelText}>Occasions:</Text>
            </View>
            <View style={styles.resultValue}>
              <View style={styles.tagsContainer}>
                {result.occasions.map((occasion) => (
                  <View key={occasion} style={styles.occasionTag}>
                    <Text style={styles.tagText}>{occasion}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.confidenceContainer}>
                <View 
                  style={[
                    styles.confidenceBar,
                    { backgroundColor: getConfidenceColor(result.confidence.occasions) },
                    { width: `${result.confidence.occasions * 100}%` },
                  ]}
                />
                <Text style={styles.confidenceText}>
                  {formatConfidence(result.confidence.occasions)}
                </Text>
              </View>
            </View>
          </View>

          {/* Tags */}
          {result.tags.length > 0 && (
            <View style={styles.resultRow}>
              <View style={styles.resultLabel}>
                <Text style={styles.labelText}>Tags:</Text>
              </View>
              <View style={styles.resultValue}>
                <View style={styles.tagsContainer}>
                  {result.tags.slice(0, 5).map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                  {result.tags.length > 5 && (
                    <Text style={styles.moreTags}>+{result.tags.length - 5} more</Text>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Controls */}
          {showControls && (
            <View style={styles.controls}>
              <TouchableOpacity 
                style={styles.analyzeButton}
                onPress={runAnalysis}
              >
                <RefreshCw size={16} color={Colors.white} />
                <Text style={styles.analyzeButtonText}>Re-analyze</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.startContainer}>
          {showControls ? (
            <>
              <Text style={styles.startText}>
                Use AI to automatically analyze this clothing item
              </Text>
              <TouchableOpacity 
                style={styles.analyzeButton}
                onPress={runAnalysis}
              >
                <Sparkles size={16} color={Colors.white} />
                <Text style={styles.analyzeButtonText}>Analyze Item</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary[700]} />
              <Text style={styles.loadingText}>Preparing analysis...</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    height: 200,
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error[600],
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  retryButtonText: {
    ...Typography.button.small,
    color: Colors.white,
  },
  startContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  analyzeButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  resultsContainer: {
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  resultTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
  },
  resultRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  resultLabel: {
    width: 80,
    marginRight: Spacing.md,
  },
  labelText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  resultValue: {
    flex: 1,
  },
  valueText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  categoryText: {
    ...Typography.body.small,
    color: Colors.text.primary,
    textTransform: 'capitalize',
  },
  colorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: Layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  tag: {
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  seasonTag: {
    backgroundColor: Colors.info[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  occasionTag: {
    backgroundColor: Colors.secondary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.sm,
  },
  tagText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
  },
  moreTags: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    alignSelf: 'center',
  },
  confidenceContainer: {
    marginTop: Spacing.xs,
    height: 4,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.full,
    position: 'relative',
  },
  confidenceBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  confidenceText: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
    position: 'absolute',
    right: 0,
    top: 6,
  },
  controls: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  noImageText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    padding: Spacing.lg,
  },
});