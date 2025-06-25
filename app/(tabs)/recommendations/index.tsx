import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Heart } from 'lucide-react-native';
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
import { OccasionSelector } from '../../../components/outfits/OccasionSelector';
import { OutfitRecommendationCarousel } from '../../../components/outfits/OutfitRecommendationCarousel';
import { SavedOutfitsList } from '../../../components/outfits/SavedOutfitsList';
import { WeatherOutfitBanner } from '../../../components/outfits/WeatherOutfitBanner';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { useSavedOutfits } from '../../../hooks/useSavedOutfits';
import { Occasion } from '../../../types/wardrobe';

// Mock weather data - in a real app, this would come from a weather API
const MOCK_WEATHER = {
  temperature: 22,
  condition: 'Partly Cloudy',
  location: 'New York, NY',
};

export default function RecommendationsScreen() {
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(
    null
  );
  const [useWeatherData, setUseWeatherData] = useState(false);
  const [showSavedOutfits, setShowSavedOutfits] = useState(false);

  const {
    outfits,
    loading,
    error,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  const { outfits: savedOutfits } = useSavedOutfits();

  // Generate initial recommendations
  const generateRecommendations = useCallback(async () => {
    // Default recommendation logic can be implemented here
    // For now, we'll rely on the useOutfitRecommendation hook
  }, []);

  // Generate initial recommendations on mount
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  // Handle occasion selection
  const handleOccasionSelect = useCallback(
    async (occasion: Occasion | null) => {
      setSelectedOccasion(occasion);
      setUseWeatherData(false);
      setShowSavedOutfits(false);

      if (occasion) {
        await getOccasionBasedRecommendation(occasion);
      } else {
        await generateRecommendations();
      }
    },
    [getOccasionBasedRecommendation, generateRecommendations]
  );

  // Handle weather-based recommendations
  const handleWeatherRecommendation = useCallback(async () => {
    setUseWeatherData(true);
    setSelectedOccasion(null);
    setShowSavedOutfits(false);

    await getWeatherBasedRecommendation({
      temperature: MOCK_WEATHER.temperature,
      conditions: 'clear', // Map to the expected format
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 5,
    });
  }, [getWeatherBasedRecommendation]);

  // Handle saving outfit
  const handleSaveOutfit = useCallback(
    (index: number) => {
      if (index >= outfits.length) return;

      const outfitToSave = outfits[index];
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
                onPress: () => {
                  router.push({
                    pathname: '/saved',
                    params: { highlight: outfitId },
                  });
                },
              },
              { text: 'OK' },
            ]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to save outfit. Please try again.');
      }
    },
    [outfits, selectedOccasion, saveCurrentOutfit]
  );

  // Toggle between recommendations and saved outfits
  const toggleSavedOutfits = useCallback(() => {
    setShowSavedOutfits(prev => !prev);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Outfit Recommendations</Text>
        <Text style={styles.subtitle}>
          AI-powered outfits tailored to your style
        </Text>

        <TouchableOpacity
          style={styles.savedToggleButton}
          onPress={toggleSavedOutfits}
        >
          <Heart
            size={16}
            color={showSavedOutfits ? Colors.white : Colors.primary[700]}
            fill={showSavedOutfits ? Colors.white : 'transparent'}
            style={{ marginRight: Spacing.xs }}
          />
          <Text
            style={[
              styles.savedToggleText,
              showSavedOutfits && styles.savedToggleTextActive,
            ]}
          >
            {showSavedOutfits ? 'View Recommendations' : 'View Saved Outfits'}
          </Text>
        </TouchableOpacity>
      </View>

      {!showSavedOutfits && (
        <>
          {/* Weather Banner */}
          <WeatherOutfitBanner
            temperature={MOCK_WEATHER.temperature}
            condition={MOCK_WEATHER.condition}
            location={MOCK_WEATHER.location}
            onPress={handleWeatherRecommendation}
          />

          {/* Occasion Selector */}
          <OccasionSelector
            selectedOccasion={selectedOccasion}
            onSelectOccasion={handleOccasionSelect}
          />
        </>
      )}

      {/* Content Area */}
      <View style={styles.content}>
        {showSavedOutfits ? (
          // Show saved outfits
          <ScrollView style={styles.savedOutfitsContainer}>
            <SavedOutfitsList showHeader={false} />
          </ScrollView>
        ) : loading ? (
          // Loading state
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[700]} />
            <Text style={styles.loadingText}>
              Generating outfit recommendations...
            </Text>
          </View>
        ) : error ? (
          // Error state
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : outfits.length > 0 ? (
          // Outfit recommendations
          <OutfitRecommendationCarousel
            outfits={outfits}
            onSaveOutfit={handleSaveOutfit}
            onRefreshOutfit={() => {
              if (useWeatherData) {
                handleWeatherRecommendation();
              } else if (selectedOccasion) {
                getOccasionBasedRecommendation(selectedOccasion);
              } else {
                generateRecommendations();
              }
            }}
            weatherData={
              useWeatherData
                ? {
                    temperature: MOCK_WEATHER.temperature,
                    condition: MOCK_WEATHER.condition,
                  }
                : undefined
            }
            occasion={selectedOccasion || undefined}
          />
        ) : (
          // Empty state
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No outfit recommendations available. Try selecting an occasion or
              refreshing.
            </Text>
          </View>
        )}
      </View>

      {/* Saved Outfits Preview (when showing recommendations) */}
      {!showSavedOutfits && savedOutfits.length > 0 && (
        <View style={styles.savedOutfitsPreview}>
          <View style={styles.savedOutfitsHeader}>
            <Text style={styles.savedOutfitsTitle}>Your Saved Outfits</Text>
            <TouchableOpacity onPress={() => router.push('/saved')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <SavedOutfitsList showHeader={false} maxItems={3} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    ...Shadows.sm,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  savedToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 20,
    marginTop: Spacing.sm,
  },
  savedToggleTextActive: {
    color: Colors.white,
  },
  savedToggleText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
  },
  content: {
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
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error[600],
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  savedOutfitsContainer: {
    flex: 1,
  },
  savedOutfitsPreview: {
    backgroundColor: Colors.surface.primary,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  savedOutfitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  savedOutfitsTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  viewAllText: {
    ...Typography.body.small,
    color: Colors.primary[700],
    fontWeight: '600',
  },
});
