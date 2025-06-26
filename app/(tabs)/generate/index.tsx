import { router } from 'expo-router';
import { Cloud, Settings } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OutfitCard } from '../../../components/outfits/OutfitCard';
import { OutfitDetailModal } from '../../../components/outfits/OutfitDetailModal';
import { OutfitEditModal } from '../../../components/outfits/OutfitEditModal';
import { BodyMedium, Button, H1, H3 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { Occasion } from '../../../types/wardrobe';

// Mock weather data for demonstration
const MOCK_WEATHER = {
  temperature: 22,
  conditions: 'clear' as const,
  precipitation: 0,
  humidity: 0.4,
  windSpeed: 5,
};

export default function GenerateScreen() {
  const { filteredItems } = useWardrobe();
  const {
    loading,
    outfits,
    selectedOutfitIndex,
    saveCurrentOutfit,
    nextOutfit,
    previousOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  const [activeTab, setActiveTab] = useState<'quick' | 'weather' | 'occasion'>(
    'quick'
  );
  const [selectedOutfit, setSelectedOutfit] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [outfitToEdit, setOutfitToEdit] = useState<any>(null);

  // Debug logging
  React.useEffect(() => {
    if (__DEV__) {
      console.log(
        '📱 Generate Screen - Items:',
        filteredItems.length,
        'Outfits:',
        outfits.length
      );
    }
  }, [filteredItems.length, outfits.length]);

  const handleWeatherOutfit = useCallback(async () => {
    setActiveTab('weather');
    await getWeatherBasedRecommendation(MOCK_WEATHER);
  }, [getWeatherBasedRecommendation]);

  const handleOccasionOutfit = useCallback(
    async (occasion: Occasion) => {
      setActiveTab('occasion');
      await getOccasionBasedRecommendation(occasion);
    },
    [getOccasionBasedRecommendation]
  );

  const handleSaveOutfit = useCallback(() => {
    const outfitId = saveCurrentOutfit();
    if (outfitId) {
      router.push({
        pathname: '/profile/saved' as any,
        params: { highlight: outfitId },
      });
    }
  }, [saveCurrentOutfit]);

  const handlePreferences = useCallback(() => {
    router.push('/generate/preferences');
  }, []);

  const handleWeatherSettings = useCallback(() => {
    router.push('/generate/weather');
  }, []);

  const handleOutfitPress = useCallback(
    (outfitIndex: number) => {
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitWithMetadata = {
          id: `outfit-${outfitIndex}`,
          name: `Generated Outfit ${outfitIndex + 1}`,
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
        };
        setSelectedOutfit(outfitWithMetadata);
        setModalVisible(true);
      }
    },
    [outfits]
  );

  const handleModalClose = useCallback(() => {
    setModalVisible(false);
    setSelectedOutfit(null);
  }, []);

  const handleOutfitSave = useCallback(
    (outfitId: string) => {
      const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
      if (!isNaN(outfitIndex) && outfits[outfitIndex]) {
        const savedOutfitId = saveCurrentOutfit(
          `Generated Outfit ${outfitIndex + 1}`
        );
        if (savedOutfitId) {
          router.push({
            pathname: '/profile/saved' as any,
            params: { highlight: savedOutfitId },
          });
        }
      }
    },
    [outfits, saveCurrentOutfit]
  );

  const handleOutfitEdit = useCallback(
    (outfitId: string) => {
      const outfitIndex = parseInt(outfitId.replace('outfit-', ''), 10);
      const outfit = outfits[outfitIndex];
      if (outfit) {
        const outfitWithMetadata = {
          id: `outfit-${outfitIndex}`,
          name: `Generated Outfit ${outfitIndex + 1}`,
          items: outfit.items,
          score: {
            total: outfit.score.total,
            color: outfit.score.breakdown.colorHarmony,
            style: outfit.score.breakdown.styleMatching,
            season: outfit.score.breakdown.seasonSuitability,
            occasion: outfit.score.breakdown.occasionSuitability,
          },
        };
        setOutfitToEdit(outfitWithMetadata);
        setEditModalVisible(true);
      }
    },
    [outfits]
  );

  const handleEditModalClose = useCallback(() => {
    setEditModalVisible(false);
    setOutfitToEdit(null);
  }, []);

  const handleOutfitUpdate = useCallback(
    (updatedOutfit: any) => {
      console.log('Updated outfit:', updatedOutfit);
      // Here you could update the outfit in the state or save it
      // For now, we'll just save it as a new outfit
      const outfitIndex = parseInt(updatedOutfit.id.replace('outfit-', ''), 10);
      if (!isNaN(outfitIndex)) {
        const savedOutfitId = saveCurrentOutfit(updatedOutfit.name);
        if (savedOutfitId) {
          router.push({
            pathname: '/profile/saved' as any,
            params: { highlight: savedOutfitId },
          });
        }
      }
    },
    [saveCurrentOutfit]
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <H1>Generate Outfits</H1>
        <BodyMedium color="secondary">
          Let AI create perfect outfits from your wardrobe
        </BodyMedium>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Generated Outfits Display */}
        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>
              Generating perfect outfits for you...
            </Text>
          </View>
        ) : outfits.length > 0 ? (
          <View style={styles.outfitsSection}>
            <H3 style={styles.sectionTitle}>Your AI-Generated Outfits</H3>
            <OutfitCard
              outfits={outfits.map((outfit, index) => ({
                id: `outfit-${index}`,
                name: `Generated Outfit ${index + 1}`,
                items: outfit.items,
                score: {
                  total: outfit.score.total,
                  color: outfit.score.breakdown.colorHarmony,
                  style: outfit.score.breakdown.styleMatching,
                  season: outfit.score.breakdown.seasonSuitability,
                  occasion: outfit.score.breakdown.occasionSuitability,
                },
              }))}
              onOutfitPress={(outfitId: string) => {
                const index = parseInt(outfitId.replace('outfit-', ''), 10);
                handleOutfitPress(index);
              }}
              onSaveOutfit={handleOutfitSave}
              onEditOutfit={handleOutfitEdit}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              Ready to Generate Outfits?
            </Text>
            <Text style={styles.emptyStateDescription}>
              Choose an occasion below or set your preferences to get AI-powered
              outfit recommendations.
            </Text>
          </View>
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          <H3 style={styles.sectionTitle}>Customize Generation</H3>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handlePreferences}
          >
            <View style={styles.optionIcon}>
              <Settings size={24} color={Colors.secondary[400]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Style Preferences</Text>
              <Text style={styles.optionDescription}>
                Set your style preferences and occasion settings
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={handleWeatherSettings}
          >
            <View style={styles.optionIcon}>
              <Cloud size={24} color={Colors.info[500]} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Weather Integration</Text>
              <Text style={styles.optionDescription}>
                Configure weather-based outfit recommendations
              </Text>
            </View>
            <View style={styles.optionArrow}>
              <Text style={styles.arrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Occasion-based Generation */}
        <View style={styles.occasionContainer}>
          <H3 style={styles.sectionTitle}>Occasion-based Outfits</H3>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.occasionScroll}
            contentContainerStyle={styles.occasionScrollContent}
          >
            <TouchableOpacity
              style={styles.occasionCard}
              onPress={() => handleOccasionOutfit(Occasion.CASUAL)}
            >
              <Text style={styles.occasionTitle}>Casual</Text>
              <Text style={styles.occasionDescription}>Everyday comfort</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionCard}
              onPress={() => handleOccasionOutfit(Occasion.WORK)}
            >
              <Text style={styles.occasionTitle}>Work</Text>
              <Text style={styles.occasionDescription}>
                Professional attire
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionCard}
              onPress={() => handleOccasionOutfit(Occasion.FORMAL)}
            >
              <Text style={styles.occasionTitle}>Formal</Text>
              <Text style={styles.occasionDescription}>Special events</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionCard}
              onPress={() => handleOccasionOutfit(Occasion.DATE)}
            >
              <Text style={styles.occasionTitle}>Date</Text>
              <Text style={styles.occasionDescription}>Romantic occasions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.occasionCard}
              onPress={() => handleOccasionOutfit(Occasion.SPORT)}
            >
              <Text style={styles.occasionTitle}>Sport</Text>
              <Text style={styles.occasionDescription}>Active wear</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Weather-based Generation */}
        <View style={styles.weatherContainer}>
          <H3 style={styles.sectionTitle}>Weather-based Outfit</H3>

          <TouchableOpacity
            style={styles.weatherCard}
            onPress={handleWeatherOutfit}
          >
            <View style={styles.weatherInfo}>
              <View style={styles.weatherIconContainer}>
                <Cloud size={32} color={Colors.info[500]} />
              </View>
              <View style={styles.weatherDetails}>
                <Text style={styles.weatherLocation}>New York, NY</Text>
                <Text style={styles.weatherTemp}>22°C</Text>
                <Text style={styles.weatherCondition}>Sunny</Text>
              </View>
            </View>
            <Button
              title="Generate for Weather"
              variant="outline"
              size="small"
              loading={loading && activeTab === 'weather'}
              style={styles.weatherButton}
              onPress={handleWeatherOutfit}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <OutfitDetailModal
        visible={modalVisible}
        onClose={handleModalClose}
        outfit={selectedOutfit}
        onSave={handleOutfitSave}
      />

      {/* Edit Modal */}
      <OutfitEditModal
        visible={editModalVisible}
        onClose={handleEditModalClose}
        outfit={outfitToEdit}
        onSave={handleOutfitUpdate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  outfitsSection: {
    marginBottom: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  emptyStateDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  outfitCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    overflow: 'hidden',
  },
  outfitCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  outfitActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  outfitAction: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  outfitPreviewContainer: {
    height: 400,
  },
  outfitCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  outfitScore: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  customizeButton: {
    paddingHorizontal: Spacing.md,
  },
  optionsContainer: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    color: Colors.text.primary,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  optionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  optionArrow: {
    marginLeft: Spacing.sm,
  },
  arrow: {
    fontSize: 20,
    color: Colors.text.tertiary,
    fontWeight: '300',
  },
  occasionContainer: {
    marginBottom: Spacing.lg,
  },
  occasionScroll: {
    marginHorizontal: -Spacing.md,
  },
  occasionScrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  occasionCard: {
    width: 140,
    height: 100,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  occasionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
  },
  occasionDescription: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  weatherContainer: {
    marginBottom: Spacing.lg,
  },
  weatherCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  weatherInfo: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  weatherIconContainer: {
    width: 64,
    height: 64,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.info[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  weatherDetails: {
    justifyContent: 'center',
  },
  weatherLocation: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  weatherTemp: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  weatherCondition: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  weatherButton: {
    alignSelf: 'flex-end',
  },
});
