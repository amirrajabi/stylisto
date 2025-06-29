import { Heart, Shirt } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FavoriteOutfitCard } from '../../components/outfits/FavoriteOutfitCard';
import { OutfitDetailModal } from '../../components/outfits/OutfitDetailModal';
import { useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibleText } from '../../components/ui/AccessibleText';
import { FavoriteItemsGallery } from '../../components/wardrobe/FavoriteItemsGallery';
import { UI_CONFIG } from '../../constants';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../hooks/useAuth';
import { useOutfitScoring } from '../../hooks/useOutfitScoring';
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

type TabType = 'outfits' | 'items';

export default function GalleryScreen() {
  const { colors } = useAccessibility();
  const { user } = useAuth();
  const { calculateDetailedScore, formatScoreForDatabase } = useOutfitScoring();
  const [activeTab, setActiveTab] = useState<TabType>('outfits');
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<{
    id: string;
    name: string;
    items: ClothingItem[];
    score: {
      total: number;
      color: number;
      style: number;
      season: number;
      occasion: number;
    };
    isFavorite?: boolean;
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

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
              notes,
              description_with_ai
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
            description_with_ai: item.description_with_ai || undefined,
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
    if (activeTab === 'outfits') {
      fetchFavoriteOutfits();
    }
  }, [user, activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'outfits') {
      fetchFavoriteOutfits();
    } else {
      setRefreshing(false);
    }
  };

  const handleOutfitPress = (outfit: FavoriteOutfit) => {
    console.log('Outfit pressed:', outfit.name);

    const detailedScore = calculateDetailedScore(outfit.items);
    const dbScore = formatScoreForDatabase(detailedScore);

    setSelectedOutfit({
      id: outfit.id,
      name: outfit.name,
      items: outfit.items,
      score: dbScore,
      isFavorite: true, // Since we're in Gallery, all outfits are favorites
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedOutfit(null);
  };

  const handleSaveOutfit = async (outfitId: string) => {
    console.log('Save outfit:', outfitId);
  };

  const handleShareOutfit = async (outfitId: string) => {
    console.log('Share outfit:', outfitId);
  };

  const handleProveOutfit = async (outfitId: string) => {
    console.log('🚀 Prove outfit function called for outfit:', outfitId);

    // The OutfitDetailModal now handles all Virtual Try-On logic using Redux store
    // This callback is just for logging and external tracking
    console.log('Virtual try-on process initiated for outfit:', outfitId);
  };

  const handleVirtualTryOnComplete = (result: any) => {
    console.log('Virtual try-on completed:', result);
  };

  const handleVirtualTryOnSave = (result: any) => {
    console.log('Virtual try-on result saved:', result);
  };

  const handleVirtualTryOnShare = (result: any) => {
    console.log('Virtual try-on result shared:', result);
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

  const handleItemPress = (item: ClothingItem) => {
    console.log('Item pressed:', item.name);
  };

  const renderTabButton = (tabType: TabType, label: string, icon: any) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabType && styles.activeTabButton,
      ]}
      onPress={() => setActiveTab(tabType)}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ selected: activeTab === tabType }}
    >
      {icon}
      <AccessibleText
        style={[
          styles.tabButtonText,
          activeTab === tabType && styles.activeTabButtonText,
        ]}
      >
        {label}
      </AccessibleText>
    </TouchableOpacity>
  );

  const renderOutfitItem = ({ item }: { item: FavoriteOutfit }) => (
    <FavoriteOutfitCard
      outfit={item}
      onPress={handleOutfitPress}
      onToggleFavorite={handleRemoveFromFavorites}
      style={styles.outfitCard}
    />
  );

  const renderEmptyOutfitsState = () => (
    <View style={styles.emptyState}>
      <Heart size={64} color={colors.text.secondary} style={styles.emptyIcon} />
      <AccessibleText
        style={[styles.emptyTitle, { color: colors.text.primary }]}
      >
        No Favorite Outfits
      </AccessibleText>
      <AccessibleText
        style={[styles.emptyDescription, { color: colors.text.secondary }]}
      >
        Mark outfits as favorites to see them here
      </AccessibleText>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      <View style={styles.header}>
        <AccessibleText style={[styles.title, { color: colors.text.primary }]}>
          Favorites
        </AccessibleText>
      </View>

      <View style={styles.tabContainer}>
        {renderTabButton(
          'outfits',
          'Outfits',
          <Heart
            size={20}
            color={
              activeTab === 'outfits'
                ? colors.primary[600]
                : Colors.text.tertiary
            }
          />
        )}
        {renderTabButton(
          'items',
          'Items',
          <Shirt
            size={20}
            color={
              activeTab === 'items' ? colors.primary[600] : Colors.text.tertiary
            }
          />
        )}
      </View>

      <View style={styles.content}>
        {activeTab === 'outfits' ? (
          <FlatList
            data={favoriteOutfits}
            keyExtractor={item => item.id}
            renderItem={renderOutfitItem}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyOutfitsState}
            refreshControl={
              UI_CONFIG.ENABLE_PULL_TO_REFRESH ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[colors.primary[600]]}
                  tintColor={colors.primary[600]}
                  progressViewOffset={UI_CONFIG.PULL_TO_REFRESH_OFFSET}
                  progressBackgroundColor="white"
                />
              ) : undefined
            }
          />
        ) : (
          <FavoriteItemsGallery onItemPress={handleItemPress} numColumns={2} />
        )}
      </View>

      {selectedOutfit && (
        <OutfitDetailModal
          visible={modalVisible}
          outfit={selectedOutfit}
          onClose={handleCloseModal}
          userImage={user?.full_body_image_url || undefined}
          onSave={handleSaveOutfit}
          onShare={handleShareOutfit}
          onProve={handleProveOutfit}
          onVirtualTryOnComplete={handleVirtualTryOnComplete}
          onVirtualTryOnSave={handleVirtualTryOnSave}
          onVirtualTryOnShare={handleVirtualTryOnShare}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  title: {
    ...Typography.heading.h2,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginHorizontal: Spacing.xs,
  },
  activeTabButton: {
    backgroundColor: Colors.primary[50],
  },
  tabButtonText: {
    ...Typography.body.medium,
    color: Colors.text.tertiary,
    marginLeft: Spacing.xs,
  },
  activeTabButtonText: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  outfitCard: {
    flex: 1,
    margin: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  emptyIcon: {
    opacity: 0.5,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body.medium,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
