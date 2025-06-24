import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Sparkles, Settings, Cloud, Shuffle, Heart } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { Button, Card, H1, H3, BodyMedium } from '../../../components/ui';

export default function GenerateScreen() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateOutfit = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false);
      router.push('/outfit-builder');
    }, 2000);
  };

  const handlePreferences = () => {
    router.push('/generate/preferences');
  };

  const handleWeatherSettings = () => {
    router.push('/generate/weather');
  };

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
              title={isGenerating ? "Generating..." : "Generate Outfit"}
              onPress={handleGenerateOutfit}
              loading={isGenerating}
              leftIcon={<Sparkles size={20} color={Colors.white} />}
              style={styles.generateButton}
            />
          </View>
        </Card>

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

        {/* Recent Generations */}
        <View style={styles.recentContainer}>
          <H3 style={styles.sectionTitle}>Recent Generations</H3>
          <BodyMedium color="secondary">
            Your recently generated outfits will appear here
          </BodyMedium>
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
  recentContainer: {
    marginBottom: Spacing.lg,
  },
});