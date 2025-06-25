import { Heart, MoreVertical } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ClothingItem } from '../../types/wardrobe';
import { formatDate, getSeasonColor } from '../../utils/wardrobeUtils';
import OptimizedImage from '../ui/OptimizedImage';

interface ClothingItemCardProps {
  item: ClothingItem;
  isSelected?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  onToggleFavorite: () => void;
  onMoreOptions: () => void;
  showStats?: boolean;
  index?: number;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

export const ClothingItemCard: React.FC<ClothingItemCardProps> = ({
  item,
  isSelected = false,
  onPress,
  onLongPress,
  onToggleFavorite,
  onMoreOptions,
  showStats = false,
  index = 0,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: item.imageUrl || '' }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          priority={index < 10 ? 'high' : 'normal'}
          placeholder={{
            uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMzBWMTMwSDEyMFYxNDBIMTA1VjE1MEg5NVYxNDBIODBWMTMwSDcwVjEwMEg1MEwxMDAgNTBaIiBmaWxsPSIjOWNhM2FmIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTcwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiPkNsb3RoaW5nPC90ZXh0Pgo8L3N2Zz4K',
          }}
          onLoad={() => {
            if (__DEV__) {
              console.log(
                'ClothingItemCard image loaded successfully for:',
                item.name
              );
            }
          }}
          onError={error => {
            if (__DEV__) {
              console.warn('ClothingItemCard image failed to load:', {
                itemName: item.name,
                url: item.imageUrl?.substring(0, 50) + '...',
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            }
          }}
          accessibilityLabel={`${item.name} clothing item image`}
        />
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel={
            item.isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          accessibilityRole="button"
        >
          <Heart
            size={20}
            color={item.isFavorite ? '#ef4444' : '#ffffff'}
            fill={item.isFavorite ? '#ef4444' : 'transparent'}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={onMoreOptions}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="More options"
          accessibilityRole="button"
        >
          <MoreVertical size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {item.name}
        </Text>

        {item.brand && (
          <Text style={styles.brand} numberOfLines={1}>
            {item.brand}
          </Text>
        )}

        <View style={styles.tagsContainer}>
          {item.season.slice(0, 2).map((season, index) => (
            <View
              key={season}
              style={[
                styles.seasonTag,
                { backgroundColor: getSeasonColor(season) },
              ]}
            >
              <Text style={styles.seasonText}>{season}</Text>
            </View>
          ))}
          {item.season.length > 2 && (
            <View style={[styles.seasonTag, { backgroundColor: '#9ca3af' }]}>
              <Text style={styles.seasonText}>+{item.season.length - 2}</Text>
            </View>
          )}
        </View>

        {showStats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>Worn {item.timesWorn} times</Text>
            {item.lastWorn && (
              <Text style={styles.statsText}>
                Last: {formatDate(item.lastWorn)}
              </Text>
            )}
            {item.price && <Text style={styles.statsText}>${item.price}</Text>}
          </View>
        )}

        <View style={styles.colorIndicator}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.categoryText}>
            {item.category.replace('_', ' ')}
          </Text>
          {item.size && <Text style={styles.sizeText}>• {item.size}</Text>}
        </View>
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
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#3b82f6',
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
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    lineHeight: 20,
  },
  brand: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  seasonTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  seasonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ffffff',
    textTransform: 'capitalize',
  },
  statsContainer: {
    marginBottom: 8,
  },
  statsText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categoryText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  sizeText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
});
