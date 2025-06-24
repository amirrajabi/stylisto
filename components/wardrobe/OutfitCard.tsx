import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Heart, MoreVertical, Users } from 'lucide-react-native';
import { Outfit } from '../../types/wardrobe';
import { formatDate, getOccasionColor } from '../../utils/wardrobeUtils';

interface OutfitCardProps {
  outfit: Outfit;
  onPress: () => void;
  onToggleFavorite: () => void;
  onMoreOptions: () => void;
  showStats?: boolean;
}

const { width } = Dimensions.get('window');
const cardWidth = width - 32;

export const OutfitCard: React.FC<OutfitCardProps> = ({
  outfit,
  onPress,
  onToggleFavorite,
  onMoreOptions,
  showStats = false,
}) => {
  const mainImage = outfit.items[0]?.imageUrl;
  const itemCount = outfit.items.length;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image
            source={{ uri: mainImage }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Users size={40} color="#9ca3af" />
          </View>
        )}
        
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={20}
              color={outfit.isFavorite ? '#ef4444' : '#ffffff'}
              fill={outfit.isFavorite ? '#ef4444' : 'transparent'}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={onMoreOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{itemCount} items</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {outfit.name}
        </Text>

        <View style={styles.occasionContainer}>
          {outfit.occasion.slice(0, 3).map((occasion, index) => (
            <View
              key={occasion}
              style={[styles.occasionTag, { backgroundColor: getOccasionColor(occasion) }]}
            >
              <Text style={styles.occasionText}>{occasion}</Text>
            </View>
          ))}
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Worn {outfit.timesWorn} times
            </Text>
            {outfit.lastWorn && (
              <Text style={styles.statsText}>
                Last: {formatDate(outfit.lastWorn)}
              </Text>
            )}
          </View>
        )}

        {outfit.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            {outfit.notes}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  itemCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  occasionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 6,
  },
  occasionTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  occasionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  statsContainer: {
    marginBottom: 8,
  },
  statsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 18,
  },
  notes: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
    lineHeight: 18,
  },
});