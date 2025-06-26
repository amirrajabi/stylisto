import { StatusBar } from 'expo-status-bar';
import { Heart, Sparkles } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { OccasionSelector } from '../../components/outfits/OccasionSelector';
import { OutfitRecommendationCarousel } from '../../components/outfits/OutfitRecommendationCarousel';
import { SavedOutfitsList } from '../../components/outfits/SavedOutfitsList';
import { WeatherOutfitBanner } from '../../components/outfits/WeatherOutfitBanner';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useOutfitRecommendation } from '../../hooks/useOutfitRecommendation';
import { useSavedOutfits } from '../../hooks/useSavedOutfits';
import { Occasion } from '../../types/wardrobe';

const MOCK_WEATHER = {
  temperature: 22,
  condition: 'Partly Cloudy',
  location: 'New York, NY',
};

export default function OutfitsScreen() {
  const [activeTab, setActiveTab] = useState<'recommendations' | 'saved'>(
    'recommendations'
  );
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(
    null
  );
  const [useWeatherData, setUseWeatherData] = useState(false);

  const {
    outfits: recommendedOutfits,
    loading: recommendationsLoading,
    error: recommendationsError,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  const { outfits: savedOutfits } = useSavedOutfits();

  const generateRecommendations = useCallback(async () => {
    // Default recommendation logic
  }, []);

  useEffect(() => {
    if (activeTab === 'recommendations') {
      generateRecommendations();
    }
  }, [generateRecommendations, activeTab]);

  const handleOccasionSelect = useCallback(
    async (occasion: Occasion | null) => {
      setSelectedOccasion(occasion);
      setUseWeatherData(false);

      if (occasion) {
        await getOccasionBasedRecommendation(occasion);
      } else {
        await generateRecommendations();
      }
    },
    [getOccasionBasedRecommendation, generateRecommendations]
  );

  const handleWeatherRecommendation = useCallback(async () => {
    setUseWeatherData(true);
    setSelectedOccasion(null);

    await getWeatherBasedRecommendation({
      temperature: MOCK_WEATHER.temperature,
      conditions: 'clear',
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 5,
    });
  }, [getWeatherBasedRecommendation]);

  const handleSaveOutfit = useCallback(
    (index: number) => {
      if (index >= recommendedOutfits.length) return;

      const outfitToSave = recommendedOutfits[index];
      const outfitName = `${selectedOccasion || 'Custom'} Outfit ${new Date().toLocaleDateString()}`;

      try {
        const outfitId = saveCurrentOutfit(outfitName);

        if (outfitId) {
          Alert.alert(
            'Outfit Saved',
            'The outfit has been saved to your collection.',
            [
              {
                text: 'View Saved Outfits',
                onPress: () => setActiveTab('saved'),
              },
              { text: 'OK' },
            ]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save outfit. Please try again.');
      }
    },
    [recommendedOutfits, selectedOccasion, saveCurrentOutfit]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        style="auto"
        backgroundColor="transparent"
        translucent={true}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Outfits</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'recommendations'
            ? 'AI-powered outfit recommendations'
            : 'Your saved outfit collection'}
        </Text>

        {/* Tab Switcher */}
        <View style={styles.tabSwitcher}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'recommendations' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('recommendations')}
          >
            <Sparkles
              size={16}
              color={
                activeTab === 'recommendations'
                  ? Colors.white
                  : Colors.primary[700]
              }
              style={{ marginRight: Spacing.xs }}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'recommendations' && styles.tabButtonTextActive,
              ]}
            >
              Recommendations
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'saved' && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab('saved')}
          >
            <Heart
              size={16}
              color={activeTab === 'saved' ? Colors.white : Colors.primary[700]}
              fill={activeTab === 'saved' ? Colors.white : 'transparent'}
              style={{ marginRight: Spacing.xs }}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'saved' && styles.tabButtonTextActive,
              ]}
            >
              Saved ({savedOutfits.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'recommendations' ? (
          <>
            {/* Weather Banner */}
            <WeatherOutfitBanner
              onWeatherUpdate={handleWeatherRecommendation}
            />

            {/* Occasion Selector */}
            <OccasionSelector
              selectedOccasion={selectedOccasion}
              onSelectOccasion={handleOccasionSelect}
            />

            {/* Recommendations Content */}
            {recommendationsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary[700]} />
                <Text style={styles.loadingText}>
                  Generating outfit recommendations...
                </Text>
              </View>
            ) : recommendationsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Failed to load recommendations. Please try again.
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={generateRecommendations}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.recommendationsContainer}>
                <OutfitRecommendationCarousel
                  outfits={recommendedOutfits}
                  onSaveOutfit={handleSaveOutfit}
                  onRefreshOutfit={generateRecommendations}
                />
              </ScrollView>
            )}
          </>
        ) : (
          /* Saved Outfits */
          <ScrollView style={styles.savedOutfitsContainer}>
            <SavedOutfitsList showHeader={false} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  title: {
    fontSize: Typography.heading.h1.fontSize,
    fontWeight: Typography.heading.h1.fontWeight,
    fontFamily: Typography.heading.h1.fontFamily,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body.medium.fontSize,
    fontFamily: Typography.body.medium.fontFamily,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary[700],
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: Typography.body.medium.fontSize,
    fontWeight: Typography.body.medium.fontWeight,
    fontFamily: Typography.body.medium.fontFamily,
    color: Colors.primary[700],
  },
  tabButtonTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['8xl'],
  },
  loadingText: {
    fontSize: Typography.body.medium.fontSize,
    fontFamily: Typography.body.medium.fontFamily,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['8xl'],
  },
  errorText: {
    fontSize: Typography.body.medium.fontSize,
    fontFamily: Typography.body.medium.fontFamily,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 8,
    ...Shadows.sm,
  },
  retryButtonText: {
    fontSize: Typography.body.medium.fontSize,
    fontWeight: Typography.body.medium.fontWeight,
    fontFamily: Typography.body.medium.fontFamily,
    color: Colors.white,
  },
  recommendationsContainer: {
    flex: 1,
  },
  savedOutfitsContainer: {
    flex: 1,
  },
});
