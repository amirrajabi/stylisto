import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Heart, Share2, ArrowLeft, Tag, Calendar, ThermometerSun } from 'lucide-react-native';
import { useOutfitRecommendation } from '../../../hooks/useOutfitRecommendation';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';

export default function OutfitDetailsScreen() {
  const { outfitId } = useLocalSearchParams<{ outfitId: string }>();
  const { outfits, saveCurrentOutfit } = useOutfitRecommendation();
  const [outfit, setOutfit] = useState(outfits[0]);
  
  // Find the outfit by ID or index
  useEffect(() => {
    if (outfitId) {
      const index = parseInt(outfitId);
      if (!isNaN(index) && index >= 0 && index < outfits.length) {
        setOutfit(outfits[index]);
      }
    }
  }, [outfitId, outfits]);
  
  if (!outfit) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Outfit not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={Colors.white} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const handleSave = () => {
    const savedId = saveCurrentOutfit();
    if (savedId) {
      Alert.alert(
        'Outfit Saved',
        'This outfit has been saved to your collection.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Sharing functionality would be implemented here');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with primary item image */}
      <View style={styles.header}>
        <Image
          source={{ uri: outfit.items[0].imageUrl }}
          style={styles.headerImage}
          contentFit="cover"
        />
        <View style={styles.headerOverlay} />
        
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={Colors.white} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSave}
            >
              <Heart size={24} color={Colors.white} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Share2 size={24} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Outfit Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.outfitTitle}>
          {outfit.items.map(item => item.category).join(' + ')} Outfit
        </Text>
        
        <View style={styles.matchScoreContainer}>
          <Text style={styles.matchScoreLabel}>Match Score</Text>
          <Text style={styles.matchScoreValue}>
            {Math.round(outfit.score.total * 100)}%
          </Text>
          
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar,
                { width: `${outfit.score.total * 100}%` },
                getScoreBarColor(outfit.score.total),
              ]}
            />
          </View>
        </View>
        
        {/* Tags Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag size={18} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Style Tags</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {outfit.items.flatMap(item => item.tags).slice(0, 8).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Occasions Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Suitable Occasions</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {Array.from(new Set(outfit.items.flatMap(item => item.occasion))).map((occasion, index) => (
              <View key={index} style={[styles.occasionTag, { backgroundColor: getOccasionColor(occasion) }]}>
                <Text style={styles.occasionTagText}>{occasion}</Text>
              </View>
            ))}
          </View>
        </View>
        
        {/* Weather Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThermometerSun size={18} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Weather Suitability</Text>
          </View>
          
          <View style={styles.weatherContainer}>
            <View style={styles.weatherItem}>
              <Text style={styles.weatherItemLabel}>Temperature</Text>
              <View style={styles.weatherRange}>
                <Text style={styles.weatherRangeText}>Cold</Text>
                <View style={styles.weatherRangeBar}>
                  <View 
                    style={[
                      styles.weatherRangeFill,
                      { width: `${outfit.score.breakdown.weatherSuitability * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.weatherRangeText}>Hot</Text>
              </View>
            </View>
            
            <View style={styles.weatherItem}>
              <Text style={styles.weatherItemLabel}>Seasons</Text>
              <View style={styles.seasonsContainer}>
                {Array.from(new Set(outfit.items.flatMap(item => item.season))).map((season, index) => (
                  <View key={index} style={[styles.seasonTag, { backgroundColor: getSeasonColor(season) }]}>
                    <Text style={styles.seasonTagText}>{season}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
        
        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outfit Items</Text>
          
          {outfit.items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.itemImage}
                contentFit="cover"
              />
              
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                
                {item.brand && (
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                )}
                
                <View style={styles.itemColorContainer}>
                  <View style={[styles.itemColorDot, { backgroundColor: item.color }]} />
                  <Text style={styles.itemColorName}>{item.color}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
        
        {/* Score Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Breakdown</Text>
          
          <View style={styles.scoreBreakdown}>
            {Object.entries(outfit.score.breakdown).map(([key, value]) => (
              <View key={key} style={styles.scoreItem}>
                <Text style={styles.scoreItemLabel}>
                  {formatScoreLabel(key)}
                </Text>
                <View style={styles.scoreItemBarContainer}>
                  <View 
                    style={[
                      styles.scoreItemBar,
                      { width: `${value * 100}%` },
                      getScoreBarColor(value),
                    ]}
                  />
                </View>
                <Text style={styles.scoreItemValue}>{Math.round(value * 100)}%</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

// Helper functions
const getScoreBarColor = (score: number) => {
  if (score >= 0.8) return { backgroundColor: Colors.success[500] };
  if (score >= 0.6) return { backgroundColor: Colors.primary[500] };
  if (score >= 0.4) return { backgroundColor: Colors.warning[500] };
  return { backgroundColor: Colors.error[500] };
};

const getOccasionColor = (occasion: string) => {
  const colors: Record<string, string> = {
    'casual': Colors.neutral[500],
    'work': Colors.primary[700],
    'formal': Colors.black,
    'party': Colors.secondary[500],
    'sport': Colors.success[500],
    'travel': Colors.info[500],
    'date': Colors.error[500],
    'special': Colors.warning[500],
  };
  
  return colors[occasion] || Colors.neutral[500];
};

const getSeasonColor = (season: string) => {
  const colors: Record<string, string> = {
    'spring': Colors.success[400],
    'summer': Colors.warning[400],
    'fall': Colors.secondary[400],
    'winter': Colors.info[400],
  };
  
  return colors[season] || Colors.neutral[400];
};

const formatScoreLabel = (key: string) => {
  // Convert camelCase to Title Case with spaces
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  header: {
    height: 300,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
  },
  backButtonText: {
    ...Typography.body.small,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    marginTop: -20,
    padding: Spacing.lg,
  },
  outfitTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textTransform: 'capitalize',
  },
  matchScoreContainer: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  matchScoreLabel: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  matchScoreValue: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  scoreBarContainer: {
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  tagText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  occasionTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  occasionTagText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
  },
  weatherContainer: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
  },
  weatherItem: {
    marginBottom: Spacing.md,
  },
  weatherItemLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  weatherRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  weatherRangeText: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
  },
  weatherRangeBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  weatherRangeFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.full,
  },
  seasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  seasonTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  seasonTagText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
  },
  itemCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  itemImage: {
    width: 100,
    height: 120,
  },
  itemDetails: {
    flex: 1,
    padding: Spacing.md,
  },
  itemName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  itemCategory: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: Spacing.xs,
  },
  itemBrand: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  itemColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  itemColorDot: {
    width: 12,
    height: 12,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  itemColorName: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
  },
  scoreBreakdown: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreItemLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    width: 120,
  },
  scoreItemBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
    marginHorizontal: Spacing.sm,
  },
  scoreItemBar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  scoreItemValue: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    width: 40,
    textAlign: 'right',
  },
});