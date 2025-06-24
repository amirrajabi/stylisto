import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Heart, Share2, ArrowLeft, Tag, Calendar, ThermometerSun, Trash2, CreditCard as Edit2, Clock } from 'lucide-react-native';
import { useSavedOutfits } from '../hooks/useSavedOutfits';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, Layout } from '../constants/Spacing';
import { Shadows } from '../constants/Shadows';
import { formatDate, getSeasonColor, getOccasionColor } from '../utils/wardrobeUtils';

export default function OutfitDetailScreen() {
  const { outfitId } = useLocalSearchParams<{ outfitId: string }>();
  const { getOutfitById, toggleFavorite, recordOutfitWorn, deleteOutfit } = useSavedOutfits();
  const [outfit, setOutfit] = useState(getOutfitById(outfitId as string));
  
  useEffect(() => {
    // Update outfit if it changes in the hook
    const currentOutfit = getOutfitById(outfitId as string);
    if (currentOutfit) {
      setOutfit(currentOutfit);
    }
  }, [outfitId, getOutfitById]);
  
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
  
  const handleToggleFavorite = () => {
    toggleFavorite(outfit.id);
  };
  
  const handleShare = async () => {
    try {
      const message = `Check out my "${outfit.name}" outfit from Stylisto!\n\nIt includes:\n${
        outfit.items.map(item => `• ${item.name} (${item.category})`).join('\n')
      }`;
      
      await Share.share({
        message,
        title: `Stylisto Outfit: ${outfit.name}`,
      });
    } catch (error) {
      console.error('Error sharing outfit:', error);
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/outfit-builder',
      params: { editOutfitId: outfit.id }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Outfit',
      `Are you sure you want to delete "${outfit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            await deleteOutfit(outfit.id);
            router.back();
          }
        },
      ]
    );
  };

  const handleWearToday = () => {
    recordOutfitWorn(outfit.id);
    Alert.alert(
      'Outfit Worn',
      'This outfit has been marked as worn today.',
      [{ text: 'OK' }]
    );
  };

  // Get primary item for display
  const primaryItem = outfit.items.find(item => 
    item.category === 'tops' || item.category === 'dresses'
  ) || outfit.items[0];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with primary item image */}
      <View style={styles.header}>
        <Image
          source={{ uri: primaryItem.imageUrl }}
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
              onPress={handleToggleFavorite}
            >
              <Heart 
                size={24} 
                color={Colors.white} 
                fill={outfit.isFavorite ? Colors.white : 'transparent'}
              />
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
        <View style={styles.titleContainer}>
          <Text style={styles.outfitTitle}>{outfit.name}</Text>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={handleEdit}
            >
              <Edit2 size={16} color={Colors.text.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Trash2 size={16} color={Colors.error[600]} />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.wearTodayButton}
          onPress={handleWearToday}
        >
          <Clock size={18} color={Colors.white} />
          <Text style={styles.wearTodayText}>Wear Today</Text>
        </TouchableOpacity>
        
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{outfit.timesWorn}</Text>
            <Text style={styles.statLabel}>Times Worn</Text>
          </View>
          
          {outfit.lastWorn && (
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDate(outfit.lastWorn)}</Text>
              <Text style={styles.statLabel}>Last Worn</Text>
            </View>
          )}
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDate(outfit.createdAt)}</Text>
            <Text style={styles.statLabel}>Created</Text>
          </View>
        </View>
        
        {/* Tags Section */}
        {outfit.tags.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={18} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Tags</Text>
            </View>
            
            <View style={styles.tagsContainer}>
              {outfit.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Seasons Section */}
        {outfit.season.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Seasons</Text>
            </View>
            
            <View style={styles.tagsContainer}>
              {outfit.season.map((season) => (
                <View
                  key={season}
                  style={[styles.seasonTag, { backgroundColor: getSeasonColor(season) }]}
                >
                  <Text style={styles.seasonText}>{season}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Occasions Section */}
        {outfit.occasion.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={18} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Occasions</Text>
            </View>
            
            <View style={styles.tagsContainer}>
              {outfit.occasion.map((occasion) => (
                <View
                  key={occasion}
                  style={[styles.occasionTag, { backgroundColor: getOccasionColor(occasion) }]}
                >
                  <Text style={styles.occasionText}>{occasion}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Notes Section */}
        {outfit.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{outfit.notes}</Text>
            </View>
          </View>
        )}
        
        {/* Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Outfit Items</Text>
          
          {outfit.items.map((item) => (
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
      </View>
    </ScrollView>
  );
}

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
    backgroundColor: Colors.background.secondary,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  outfitTitle: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.md,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  editButtonText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.error[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  deleteButtonText: {
    ...Typography.caption.medium,
    color: Colors.error[600],
  },
  wearTodayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  wearTodayText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
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
  seasonTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  seasonText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  occasionTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
  },
  occasionText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  notesContainer: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  notesText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
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
});