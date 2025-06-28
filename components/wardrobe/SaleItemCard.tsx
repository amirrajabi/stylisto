import { Image } from 'expo-image';
import { DollarSign, Tag } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { ClothingItem } from '../../types/wardrobe';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

interface SaleItemCardProps {
  item: ClothingItem;
  onPress: () => void;
}

export const SaleItemCard: React.FC<SaleItemCardProps> = ({
  item,
  onPress,
}) => {
  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(price);
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'excellent':
        return '#10b981';
      case 'very_good':
        return '#A428FC';
      case 'good':
        return '#f59e0b';
      case 'fair':
        return '#ef4444';
      case 'poor':
      case 'damaged':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        {item.isForSale && (
          <View style={styles.forSaleBadge}>
            <DollarSign size={12} color="#ffffff" />
            <Text style={styles.forSaleText}>For Sale</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.priceRow}>
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Selling Price</Text>
            <Text style={styles.sellingPrice}>
              {formatPrice(item.sellingPrice)}
            </Text>
          </View>

          {item.originalPrice && (
            <View style={styles.priceInfo}>
              <Text style={styles.priceLabel}>Original</Text>
              <Text style={styles.originalPrice}>
                {formatPrice(item.originalPrice)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.conditionContainer}>
            <View
              style={[
                styles.conditionDot,
                { backgroundColor: getConditionColor(item.condition) },
              ]}
            />
            <Text style={styles.conditionText}>
              {item.condition?.replace('_', ' ') || 'Good'}
            </Text>
          </View>

          {item.saleListing?.platform && (
            <View style={styles.platformContainer}>
              <Tag size={12} color="#6b7280" />
              <Text style={styles.platformText}>
                {item.saleListing.platform}
              </Text>
            </View>
          )}
        </View>

        {item.saleListing?.negotiable && (
          <Text style={styles.negotiableText}>Price negotiable</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 200,
  },
  forSaleBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  forSaleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  sellingPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10b981',
  },
  originalPrice: {
    fontSize: 14,
    color: '#6b7280',
    textDecorationLine: 'line-through',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  conditionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  conditionText: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  platformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  platformText: {
    fontSize: 12,
    color: '#6b7280',
  },
  negotiableText: {
    fontSize: 11,
    color: '#A428FC',
    fontStyle: 'italic',
  },
});
