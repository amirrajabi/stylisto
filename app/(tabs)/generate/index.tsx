import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Settings, Cloud, Calendar, Shirt, Heart } from 'lucide-react-native';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { OutfitGenerator } from '../../../components/outfits/OutfitGenerator';
import { OutfitPreview } from '../../../components/outfits/OutfitPreview';
import { Occasion, Season } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { Button, Card, H1, H3, BodyMedium } from '../../../components/ui';

// Mock weather data for demonstration
const MOCK_WEATHER = {
  temperature: 22,
  conditions: 'clear' as const,
  precipitation: 0,
  humidity: 0.4,
  windSpeed: 5,
};

export default function GenerateScreen() {
  const {
    loading,
    error,
    outfits,
    selectedOutfitIndex,
    generateRecommendations,
    saveCurrentOutfit,
    nextOutfit,
    previousOutfit,
    getWeatherBasedRecommendation,
    getOccasionBasedRecommendation,
  } = useOutfitRecommendation();

  const [activeTab, setActiveTab] = useState<'quick' | 'weather' | 'occasion'>('quick');

  const handleGenerateOutfit = useCallback(async () => {
    await generateRecommendations();
  }, [generateRecommendations]);

  const handleWeatherOutfit = useCallback(async () => {
    setActiveTab('weather');
    await getWeatherBasedRecommendation(MOCK_WEATHER);
  }, [getWeatherBasedRecommendation]);

  const handleOccasionOutfit = useCallback(async (occasion: Occasion) => {
    setActiveTab('occasion');
    await getOccasionBasedRecommendation(occasion);
  }, [getOccasionBasedRecommendation]);

  const handleSaveOutfit = useCallback(() => {
    const outfitId = saveCurrentOutfit();
    if (outfitId) {
      router.push({
        pathname: '/saved',
        params: { highlight: outfitId }
      });
    }
  }, [saveCurrentOutfit]);

  const handlePreferences = useCallback(() => {
    router.push('/generate/preferences');
  }, []);

  const handleWeatherSettings = useCallback(() => {
    router.push('/generate/weather');
  }, []);

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
        {/* Quick Generate */}
        <Card style={styles.generateCard}>
          <View style={styles.generateContent}>
            <View style={styles.generateIcon}>
              <Sparkles size={32} color={Colors.primary[700]} />
            </View>
            <H3 style={styles.generateTitle}>Quick Generate</H3>
            <BodyMedium color="secondary" style={styles.generateDescription}>
              Generate an outfit based on your current preferences and weather
            </BodyMedium>
            <Button
              title={loading ? "Generating..." : "Generate Outfit"}
              onPress={handleGenerateOutfit}
              loading={loading && activeTab === 'quick'}
              leftIcon={<Sparkles size={20} color={Colors.white} />}
              style={styles.generateButton}
            />
          </View>
        </Card>

        {/* Generated Outfit Display */}
        {outfits.length > 0 && (
          <Card style={styles.outfitCard}>
            <View style={styles.outfitCardHeader}>
              <H3>Your Outfit</H3>
              <View style={styles.outfitActions}>
                <TouchableOpacity 
                  style={styles.outfitAction}
                  onPress={handleSaveOutfit}
                >
                  <Heart size={20} color={Colors.primary[700]} />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.outfitPreviewContainer}>
              <OutfitPreview 
                outfit={outfits[selectedOutfitIndex].items}
                onPrevious={previousOutfit}
                onNext={nextOutfit}
              />
            </View>
            
            <View style={styles.outfitCardFooter}>
              <Text style={styles.outfitScore}>
                Match Score: {Math.round(outfits[selectedOutfitIndex].score.total * 100)}%
              </Text>
              <Button
                title="Customize"
                variant="outline"
                onPress={() => router.push('/outfit-builder')}
                style={styles.customizeButton}
              />
            </View>
          </Card>
        )}

        {/* Options */}
        <View style={styles.optionsContainer}>
          <H3 style={styles.sectionTitle}>Customize Generation</H3>
          
          <TouchableOpacity style={styles.optionCard} onPress={handlePreferences}>
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

          <TouchableOpacity style={styles.optionCard} onPress={handleWeatherSettings}>
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
              <Text style={styles.occasionDescription}>Professional attire</Text>
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
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  generateCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface.primary,
  },
  generateContent: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  generateIcon: {
    width: 64,
    height: 64,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  generateTitle: {
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  generateDescription: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  generateButton: {
    minWidth: 200,
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