import {
  Calendar,
  Cloud,
  Filter,
  RefreshCw,
  Shirt,
  Sparkles,
  Tag,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useWardrobe } from '../../hooks/useWardrobe';
import {
  GeneratedOutfit,
  OutfitGenerationOptions,
  useOutfitGenerator,
} from '../../lib/outfitGenerator';
import { Outfit } from '../../types/wardrobe';
import { generateOutfitName } from '../../utils/outfitNaming';
import { OutfitPreview } from './OutfitPreview';

interface OutfitGeneratorProps {
  onSaveOutfit?: (outfitId: string) => void;
  initialOptions?: Partial<OutfitGenerationOptions>;
}

export const OutfitGenerator: React.FC<OutfitGeneratorProps> = ({
  onSaveOutfit,
  initialOptions = {},
}) => {
  const { items, actions } = useWardrobe();
  const { generateOutfits, createOutfit } = useOutfitGenerator();

  // Get existing outfits from wardrobe state to prevent duplicate names
  const { outfits: existingOutfits } = useWardrobe();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutfits, setGeneratedOutfits] = useState<GeneratedOutfit[]>(
    []
  );
  const [selectedOutfitIndex, setSelectedOutfitIndex] = useState(0);
  const [options, setOptions] = useState<OutfitGenerationOptions>({
    occasion: initialOptions.occasion || null,
    season: initialOptions.season || null,
    weather: initialOptions.weather || null,
    preferredColors: initialOptions.preferredColors || [],
    excludedItems: initialOptions.excludedItems || [],
    stylePreference: initialOptions.stylePreference || {
      formality: 0.5,
      boldness: 0.5,
      layering: 0.5,
      colorfulness: 0.5,
    },
    maxResults:
      initialOptions.maxResults || Math.min(20, Math.max(5, items.length)),
    minScore: initialOptions.minScore || 0.65,
    useAllItems: initialOptions.useAllItems || false,
  });

  // Generate outfits on mount if we have items
  useEffect(() => {
    if (items.length > 0) {
      handleGenerateOutfits();
    }
  }, []);

  const handleGenerateOutfits = useCallback(async () => {
    if (items.length < 2) {
      console.warn('Not enough items to generate outfits');
      return;
    }

    setIsGenerating(true);

    try {
      // Measure performance
      const startTime = performance.now();

      // Generate outfits with current options
      const outfits = generateOutfits(items, options);

      const endTime = performance.now();
      console.log(
        `Generated ${outfits.length} outfits in ${endTime - startTime}ms`
      );

      setGeneratedOutfits(outfits);
      setSelectedOutfitIndex(0);
    } catch (error) {
      console.error('Error generating outfits:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [items, options, generateOutfits]);

  const handleSaveOutfit = useCallback(() => {
    if (
      generatedOutfits.length === 0 ||
      selectedOutfitIndex >= generatedOutfits.length
    ) {
      return;
    }

    const selectedOutfit = generatedOutfits[selectedOutfitIndex];

    // Get existing outfit names to prevent duplicates
    const existingNames = existingOutfits.map((outfit: Outfit) => outfit.name);
    const outfitName = generateOutfitName(selectedOutfit.items, existingNames);

    const outfit = createOutfit(selectedOutfit.items, outfitName);
    actions.addOutfit(outfit);

    if (onSaveOutfit) {
      onSaveOutfit(outfit.id);
    }
  }, [
    generatedOutfits,
    selectedOutfitIndex,
    createOutfit,
    actions,
    onSaveOutfit,
    existingOutfits,
  ]);

  const handleUpdateOption = useCallback(
    (key: keyof OutfitGenerationOptions, value: any) => {
      setOptions(prev => ({
        ...prev,
        [key]: value,
      }));
    },
    []
  );

  const handleNextOutfit = useCallback(() => {
    if (generatedOutfits.length === 0) return;

    setSelectedOutfitIndex(prev =>
      prev < generatedOutfits.length - 1 ? prev + 1 : 0
    );
  }, [generatedOutfits]);

  const handlePreviousOutfit = useCallback(() => {
    if (generatedOutfits.length === 0) return;

    setSelectedOutfitIndex(prev =>
      prev > 0 ? prev - 1 : generatedOutfits.length - 1
    );
  }, [generatedOutfits]);

  const renderScoreBreakdown = useCallback((outfit: GeneratedOutfit) => {
    const { breakdown } = outfit.score;

    const scoreItems = [
      {
        label: 'Color Harmony',
        value: breakdown.colorHarmony,
        icon: <Tag size={16} color={Colors.text.secondary} />,
      },
      {
        label: 'Style Match',
        value: breakdown.styleMatching,
        icon: <Shirt size={16} color={Colors.text.secondary} />,
      },
      {
        label: 'Occasion',
        value: breakdown.occasionSuitability,
        icon: <Calendar size={16} color={Colors.text.secondary} />,
      },
      {
        label: 'Season',
        value: breakdown.seasonSuitability,
        icon: <Calendar size={16} color={Colors.text.secondary} />,
      },
      {
        label: 'Weather',
        value: breakdown.weatherSuitability,
        icon: <Cloud size={16} color={Colors.text.secondary} />,
      },
    ];

    return (
      <View style={styles.scoreBreakdown}>
        {scoreItems.map((item, index) => (
          <View key={index} style={styles.scoreItem}>
            <View style={styles.scoreLabel}>
              {item.icon}
              <Text style={styles.scoreLabelText}>{item.label}</Text>
            </View>
            <View style={styles.scoreBarContainer}>
              <View
                style={[
                  styles.scoreBar,
                  { width: `${item.value * 100}%` },
                  { backgroundColor: getScoreColor(item.value) },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return Colors.success[500];
    if (score >= 0.6) return Colors.primary[500];
    if (score >= 0.4) return Colors.warning[500];
    return Colors.error[500];
  };

  return (
    <View style={styles.container}>
      {/* Options Bar */}
      <View style={styles.optionsBar}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            /* Open occasion selector */
          }}
        >
          <Calendar size={20} color={Colors.text.secondary} />
          <Text style={styles.optionText}>
            {options.occasion || 'Any Occasion'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            /* Open season selector */
          }}
        >
          <Calendar size={20} color={Colors.text.secondary} />
          <Text style={styles.optionText}>
            {options.season || 'Any Season'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.optionButton,
            options.useAllItems && styles.optionButtonActive,
          ]}
          onPress={() =>
            handleUpdateOption('useAllItems', !options.useAllItems)
          }
        >
          <Shirt
            size={20}
            color={options.useAllItems ? Colors.white : Colors.text.secondary}
          />
          <Text
            style={[
              styles.optionText,
              options.useAllItems && styles.optionTextActive,
            ]}
          >
            Use All Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => {
            /* Open filter modal */
          }}
        >
          <Filter size={20} color={Colors.text.secondary} />
          <Text style={styles.optionText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Outfit Display */}
      <View style={styles.outfitContainer}>
        {isGenerating ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[700]} />
            <Text style={styles.loadingText}>Generating outfit ideas...</Text>
          </View>
        ) : generatedOutfits.length > 0 ? (
          <>
            <OutfitPreview
              outfit={generatedOutfits[selectedOutfitIndex].items}
              onPrevious={handlePreviousOutfit}
              onNext={handleNextOutfit}
            />

            <View style={styles.outfitInfo}>
              <View style={styles.outfitHeader}>
                <View style={styles.outfitScore}>
                  <Text style={styles.scoreValue}>
                    {Math.round(
                      generatedOutfits[selectedOutfitIndex].score.total * 100
                    )}
                    %
                  </Text>
                  <Text style={styles.scoreLabel}>Match</Text>
                </View>

                <View style={styles.outfitPagination}>
                  <Text style={styles.paginationText}>
                    {selectedOutfitIndex + 1} of {generatedOutfits.length}
                  </Text>
                </View>
              </View>

              {/* Score Breakdown */}
              {renderScoreBreakdown(generatedOutfits[selectedOutfitIndex])}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={handleGenerateOutfits}
                >
                  <RefreshCw size={20} color={Colors.white} />
                  <Text style={styles.buttonText}>Regenerate</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveOutfit}
                >
                  <Text style={styles.buttonText}>Save Outfit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Sparkles size={48} color={Colors.text.disabled} />
            <Text style={styles.emptyTitle}>No Outfits Generated</Text>
            <Text style={styles.emptyText}>
              Tap the button below to generate outfit suggestions based on your
              wardrobe.
            </Text>

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateOutfits}
            >
              <Sparkles size={20} color={Colors.white} />
              <Text style={styles.buttonText}>Generate Outfits</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  optionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    gap: Spacing.xs,
  },
  optionButtonActive: {
    backgroundColor: Colors.primary[700],
  },
  optionText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  optionTextActive: {
    color: Colors.white,
  },
  outfitContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  outfitInfo: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  outfitScore: {
    alignItems: 'center',
  },
  scoreValue: {
    ...Typography.heading.h3,
    color: Colors.primary[700],
  },
  scoreLabelSimple: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  outfitPagination: {
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
  },
  paginationText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  scoreBreakdown: {
    marginBottom: Spacing.md,
  },
  scoreItem: {
    marginBottom: Spacing.sm,
  },
  scoreLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.xs,
  },
  scoreLabelText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  scoreBarContainer: {
    height: 6,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[400],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  buttonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});
