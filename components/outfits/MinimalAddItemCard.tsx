import { Check } from 'lucide-react-native';
import React, { memo } from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { ClothingItem } from '../../types/wardrobe';
import OptimizedImage from '../ui/OptimizedImage';

interface MinimalAddItemCardProps {
  item: ClothingItem;
  onAdd: () => void;
  index?: number;
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

const MinimalAddItemCard: React.FC<MinimalAddItemCardProps> = memo(
  ({ item, onAdd, index = 0 }) => {
    return (
      <TouchableOpacity style={styles.card} onPress={onAdd} activeOpacity={0.8}>
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={{ uri: item.imageUrl || '' }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            priority={index < 10 ? 'high' : 'normal'}
            placeholder={{
              uri: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxMzBWMTMwSDEyMFYxNDBIMTA1VjE1MEg5NVYxNDBIODBWMTMwSDcwVjEwMEg1MEwxMDAgNTBaIiBmaWxsPSIjOWNhM2FmIi8+CjwvdGV4dD4KPC9zdmc+Cg==',
            }}
          />
          <View style={styles.addButton}>
            <Check size={16} color={Colors.white} />
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.item.name === nextProps.item.name &&
      prevProps.item.imageUrl === nextProps.item.imageUrl &&
      prevProps.index === nextProps.index
    );
  }
);

MinimalAddItemCard.displayName = 'MinimalAddItemCard';

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.md,
  },
  imageContainer: {
    position: 'relative',
    width: cardWidth,
    height: cardWidth * 1.25,
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[50],
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: Layout.borderRadius.lg,
    borderTopRightRadius: Layout.borderRadius.lg,
  },
  addButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.success[600],
    borderRadius: Layout.borderRadius.full,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  content: {
    padding: Spacing.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
});

export { MinimalAddItemCard };
