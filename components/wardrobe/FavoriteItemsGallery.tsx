import { Heart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { UI_CONFIG } from '../../constants';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useWardrobe } from '../../hooks/useWardrobe';
import { ClothingItem } from '../../types/wardrobe';
import { AccessibleText } from '../ui/AccessibleText';
import { ClothingItemCard } from './ClothingItemCard';

interface FavoriteItemsGalleryProps {
  onItemPress?: (item: ClothingItem) => void;
  numColumns?: number;
}

export const FavoriteItemsGallery: React.FC<FavoriteItemsGalleryProps> = ({
  onItemPress,
  numColumns = 2,
}) => {
  const { actions, isLoading } = useWardrobe();
  const [favoriteItems, setFavoriteItems] = useState<ClothingItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = async () => {
    try {
      const result = await actions.loadFavoriteItems();
      if (result.error) {
        setError(result.error);
      } else {
        setFavoriteItems(result.data || []);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load favorite items');
      console.error('Error loading favorites:', err);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  const handleToggleFavorite = async (itemId: string) => {
    try {
      const result = await actions.toggleFavorite(itemId);
      if (result.success) {
        setFavoriteItems(prev => prev.filter(item => item.id !== itemId));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleMoreOptions = (item: ClothingItem) => {
    console.log('More options for:', item.name);
  };

  const renderFavoriteItem = ({
    item,
    index,
  }: {
    item: ClothingItem;
    index: number;
  }) => (
    <ClothingItemCard
      item={item}
      onPress={() => onItemPress?.(item)}
      onToggleFavorite={() => handleToggleFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      index={index}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Heart size={64} color={Colors.text.tertiary} />
      <AccessibleText style={styles.emptyTitle}>
        No Favorite Items
      </AccessibleText>
      <AccessibleText style={styles.emptyDescription}>
        Mark items as favorites to see them here
      </AccessibleText>
    </View>
  );

  if (isLoading && favoriteItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <AccessibleText style={styles.loadingText}>
          Loading favorite items...
        </AccessibleText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AccessibleText style={styles.errorText}>{error}</AccessibleText>
      </View>
    );
  }

  return (
    <FlatList
      data={favoriteItems}
      keyExtractor={item => item.id}
      renderItem={renderFavoriteItem}
      numColumns={numColumns}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
      refreshControl={
        UI_CONFIG.ENABLE_PULL_TO_REFRESH ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary[600]]}
            tintColor={Colors.primary[600]}
            progressViewOffset={UI_CONFIG.PULL_TO_REFRESH_OFFSET}
            progressBackgroundColor="white"
          />
        ) : undefined
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    flexGrow: 1,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error[500],
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
