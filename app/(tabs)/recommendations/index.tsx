import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { OutfitRecommendationCarousel } from '../../../components/outfits/OutfitRecommendationCarousel';
import { OccasionSelector } from '../../../components/outfits/OccasionSelector';
import { WeatherOutfitBanner } from '../../../components/outfits/WeatherOutfitBanner';
import { Occasion } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';

// Mock weather data - in a real app, this would come from a weather API
const MOCK_WEATHER = {
  temperature: 22,
  condition: 'Partly Cloudy',
  location: 'New York, NY',
};

export default function RecommendationsScreen() {
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [useWeatherData, setUseWeatherData] = useState(false);
  
  const {
    outfits,
    loading,
    error,
    generateRecommendations,
    saveCurrentOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  // Generate initial recommendations on mount
  useEffect(() => {
    generateRecommendations();
  }, []);

  // Handle occasion selection
  const handleOccasionSelect = useCallback(async (occasion: Occasion | null) => {
    setSelectedOccasion(occasion);
    setUseWeatherData(false);
    
    if (occasion) {
      await getOccasionBasedRecommendation(occasion);
    } else {
      await generateRecommendations();
    }
  }, [getOccasionBasedRecommendation, generateRecommendations]);

  // Handle weather-based recommendations
  const handleWeatherRecommendation = useCallback(async () => {
    setUseWeatherData(true);
    setSelectedOccasion(null);
    
    await getWeatherBasedRecommendation({
      temperature: MOCK_WEATHER.temperature,
      conditions: 'clear', // Map to the expected format
      precipitation: 0,
      humidity: 0.5,
      windSpeed: 5,
    });
  }, [getWeatherBasedRecommendation]);

  // Handle saving outfit
  const handleSaveOutfit = useCallback((index: number) => {
    const outfitId = saveCurrentOutfit();
    
    if (outfitId) {
      Alert.alert(
        'Outfit Saved',
        'The outfit has been saved to your collection.',
        [{ text: 'OK' }]
      );
    }
  }, [saveCurrentOutfit]);

  // Handle refreshing outfit
  const handleRefreshOutfit = useCallback((index: number) => {
    if (useWeatherData) {
      handleWeatherRecommendation();
    } else if (selectedOccasion) {
      getOccasionBasedRecommendation(selectedOccasion);
    } else {
      generateRecommendations();
    }
  }, [
    useWeatherData, 
    selectedOccasion, 
    handleWeatherRecommendation, 
    getOccasionBasedRecommendation, 
    generateRecommendations
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Outfit Recommendations</Text>
        <Text style={styles.subtitle}>
          AI-powered outfits tailored to your style
        </Text>
      </View>
      
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
      
      {/* Content Area */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[700]} />
            <Text style={styles.loadingText}>Generating outfit recommendations...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : outfits.length > 0 ? (
          <OutfitRecommendationCarousel
            outfits={outfits}
            onSaveOutfit={handleSaveOutfit}
            onRefreshOutfit={handleRefreshOutfit}
            weatherData={useWeatherData ? {
              temperature: MOCK_WEATHER.temperature,
              condition: MOCK_WEATHER.condition,
            } : undefined}
            occasion={selectedOccasion || undefined}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No outfit recommendations available. Try selecting an occasion or refreshing.
            </Text>
          </View>
        )}
      </View>
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
});