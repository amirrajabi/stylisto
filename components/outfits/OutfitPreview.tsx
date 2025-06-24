import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ClothingItem, ClothingCategory } from '../../types/wardrobe';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface OutfitPreviewProps {
  outfit: ClothingItem[];
  onPrevious?: () => void;
  onNext?: () => void;
}

export const OutfitPreview: React.FC<OutfitPreviewProps> = ({
  outfit,
  onPrevious,
  onNext,
}) => {
  // Organize items by category for display
  const getItemsByLayer = (): ClothingItem[][] => {
    // Define display order by layers (top to bottom)
    const layerOrder: ClothingCategory[] = [
      ClothingCategory.ACCESSORIES,
      ClothingCategory.OUTERWEAR,
      ClothingCategory.TOPS,
      ClothingCategory.DRESSES,
      ClothingCategory.BOTTOMS,
      ClothingCategory.SHOES,
    ];
    
    // Group items by layer
    const layers: ClothingItem[][] = [];
    
    // Special case: if we have a dress, we don't need separate top and bottom
    const hasDress = outfit.some(item => item.category === ClothingCategory.DRESSES);
    
    for (const category of layerOrder) {
      // Skip tops and bottoms if we have a dress
      if (hasDress && (category === ClothingCategory.TOPS || category === ClothingCategory.BOTTOMS)) {
        continue;
      }
      
      const layerItems = outfit.filter(item => item.category === category);
      if (layerItems.length > 0) {
        layers.push(layerItems);
      }
    }
    
    return layers;
  };

  const layers = getItemsByLayer();

  return (
    <View style={styles.container}>
      {/* Navigation Buttons */}
      {onPrevious && (
        <TouchableOpacity 
          style={[styles.navButton, styles.prevButton]}
          onPress={onPrevious}
        >
          <ChevronLeft size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}
      
      {onNext && (
        <TouchableOpacity 
          style={[styles.navButton, styles.nextButton]}
          onPress={onNext}
        >
          <ChevronRight size={24} color={Colors.text.secondary} />
        </TouchableOpacity>
      )}
      
      {/* Outfit Display */}
      <ScrollView 
        style={styles.outfitScroll}
        contentContainerStyle={styles.outfitContent}
        showsVerticalScrollIndicator={false}
      >
        {layers.map((layerItems, layerIndex) => (
          <View key={`layer-${layerIndex}`} style={styles.layer}>
            {layerItems.map((item, itemIndex) => (
              <View key={`item-${item.id}`} style={styles.itemContainer}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                  contentFit="cover"
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemCategory}>
                    {item.category.replace('_', ' ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: -20,
  },
  prevButton: {
    left: Spacing.md,
  },
  nextButton: {
    right: Spacing.md,
  },
  outfitScroll: {
    flex: 1,
  },
  outfitContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  layer: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  itemContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface.secondary,
  },
  itemImage: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.surface.secondary,
  },
  itemInfo: {
    padding: Spacing.md,
  },
  itemName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  itemCategory: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
});