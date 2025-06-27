import { Heart } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavoriteOutfitCard } from '../../components/outfits/FavoriteOutfitCard';
import { useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibleText } from '../../components/ui/AccessibleText';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { ClothingItem } from '../../types/wardrobe';

interface FavoriteOutfit {
  id: string;
  name: string;
  items: ClothingItem[];
  created_at: string;
  occasion?: string;
  source_type?: 'ai_generated' | 'manual';
}

export default function GalleryScreen() {
  const { colors } = useAccessibility();
  const { user } = useAuth();
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavoriteOutfits = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          created_at,
          occasions,
          source_type,
          outfit_items (
            clothing_items (
              id,
              name,
              category,
              color,
              brand,
              image_url,
              seasons,
              occasions,
              size,
              subcategory,
              tags,
              price,
              purchase_date,
              last_worn,
              times_worn,
              is_favorite,
              notes
            )
          )
        `
        )
        .eq('user_id', user.id)
        .eq('is_favorite', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching favorite outfits:', error);
        return;
      }

      const formattedOutfits = (data || []).map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        created_at: outfit.created_at,
        occasion: outfit.occasions?.[0] || undefined,
        source_type: outfit.source_type,
        items: outfit.outfit_items
          .map(oi => oi.clothing_items)
          .filter(Boolean)
          .flat()
          .map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            subcategory: item.subcategory,
            color: item.color,
            brand: item.brand,
            size: item.size,
            season: item.seasons || [],
            occasion: item.occasions || [],
            imageUrl: item.image_url,
            tags: item.tags || [],
            isFavorite: item.is_favorite || false,
            lastWorn: item.last_worn,
            timesWorn: item.times_worn || 0,
            purchaseDate: item.purchase_date,
            price: item.price,
            notes: item.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
      }));

      setFavoriteOutfits(formattedOutfits);
    } catch (error) {
      console.error('Error fetching favorite outfits:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFavoriteOutfits();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFavoriteOutfits();
  };

  const handleOutfitPress = (outfit: FavoriteOutfit) => {
    console.log('Outfit pressed:', outfit.name);
  };

  const handleRemoveFromFavorites = async (outfitId: string) => {
    try {
      const { error } = await supabase
        .from('saved_outfits')
        .update({ is_favorite: false })
        .eq('id', outfitId);

      if (error) {
        console.error('Error removing from favorites:', error);
        return;
      }

      setFavoriteOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const renderOutfitItem = ({ item }: { item: FavoriteOutfit }) => (
    <FavoriteOutfitCard
      outfit={item}
      onPress={handleOutfitPress}
      onToggleFavorite={handleRemoveFromFavorites}
      style={styles.outfitCard}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Heart
        size={64}
        color={colors.text.tertiary}
        strokeWidth={1.5}
        style={styles.emptyIcon}
      />
      <AccessibleText
        style={[styles.emptyTitle, { color: colors.text.primary }]}
        accessibilityRole="header"
      >
        No Favorite Outfits
      </AccessibleText>
      <AccessibleText
        style={[styles.emptyDescription, { color: colors.text.secondary }]}
      >
        Start adding outfits to your favorites from the Stylist tab to see them
        here.
      </AccessibleText>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.header}>
        <AccessibleText
          style={[styles.title, { color: colors.text.primary }]}
          accessibilityRole="header"
        >
          Favorite Outfits
        </AccessibleText>
        <AccessibleText
          style={[styles.subtitle, { color: colors.text.secondary }]}
        >
          Your curated collection of favorite looks
        </AccessibleText>
      </View>

      <FlatList
        data={favoriteOutfits}
        renderItem={renderOutfitItem}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[600]}
            colors={[colors.primary[600]]}
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        accessibilityLabel="Favorite outfits grid"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.heading.h2.fontSize,
    fontWeight: Typography.heading.h2.fontWeight,
    fontFamily: Typography.heading.h2.fontFamily,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.body.medium.fontSize,
    fontFamily: Typography.body.medium.fontFamily,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['6xl'],
  },
  row: {
    justifyContent: 'space-between',
  },
  outfitCard: {
    width: '48%',
    marginBottom: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing['6xl'],
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: Typography.heading.h3.fontSize,
    fontWeight: Typography.heading.h3.fontWeight,
    fontFamily: Typography.heading.h3.fontFamily,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: Typography.body.medium.fontSize,
    fontFamily: Typography.body.medium.fontFamily,
    textAlign: 'center',
    lineHeight: 24,
  },
});
