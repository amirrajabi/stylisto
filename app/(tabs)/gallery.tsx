import { router, useFocusEffect } from 'expo-router';
import { Archive, Heart, Search, Shirt } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { OutfitDetailModal } from '../../components/outfits';
import { FavoriteOutfitCard } from '../../components/outfits/FavoriteOutfitCard';
import { OutfitEditModal } from '../../components/outfits/OutfitEditModal';
import { useAccessibility } from '../../components/ui/AccessibilityProvider';
import { AccessibleText } from '../../components/ui/AccessibleText';
import { FavoriteItemsGallery } from '../../components/wardrobe/FavoriteItemsGallery';
import { UI_CONFIG } from '../../constants';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../hooks/useAuth';
import { useOutfitScoring } from '../../hooks/useOutfitScoring';
import { OutfitService } from '../../lib/outfitService';
import { supabase } from '../../lib/supabase';
import { ClothingItem } from '../../types/wardrobe';

interface FavoriteOutfit {
  id: string;
  name: string;
  items: ClothingItem[];
  created_at: string;
  notes?: string;
  occasion?: string;
  source_type?: 'ai_generated' | 'manual';
  is_favorite?: boolean;
}

type TabType = 'outfits' | 'items' | 'saved';

export default function GalleryScreen() {
  const { user } = useAuth();
  const { colors } = useAccessibility();
  const { calculateDetailedScore, formatScoreForDatabase } = useOutfitScoring();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('outfits');
  const [favoriteOutfits, setFavoriteOutfits] = useState<FavoriteOutfit[]>([]);
  const [savedOutfits, setSavedOutfits] = useState<FavoriteOutfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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
    source_type?: 'ai_generated' | 'manual';
  } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [outfitToEdit, setOutfitToEdit] = useState<{
    id: string;
    name: string;
    items: ClothingItem[];
    notes?: string;
    source_type?: 'manual' | 'ai_generated';
  } | null>(null);

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
          notes,
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
        notes: outfit.notes,
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

  const fetchAllSavedOutfits = async () => {
    if (!user) return;

    console.log('🎯 Fetching all saved outfits from database...');

    try {
      const { data, error } = await supabase
        .from('saved_outfits')
        .select(
          `
          id,
          name,
          created_at,
          notes,
          occasions,
          source_type,
          is_favorite,
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
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching saved outfits:', error);
        return;
      }

      console.log(`✅ Found ${data?.length || 0} saved outfits in database`);

      const formattedOutfits = (data || []).map(outfit => ({
        id: outfit.id,
        name: outfit.name,
        created_at: outfit.created_at,
        notes: outfit.notes,
        occasion: outfit.occasions?.[0] || undefined,
        source_type: outfit.source_type,
        is_favorite: outfit.is_favorite,
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

      setSavedOutfits(formattedOutfits);
      console.log('📝 Saved outfits state updated');
    } catch (error) {
      console.error('❌ Error fetching saved outfits:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'outfits') {
      fetchFavoriteOutfits();
    }
  }, [user, activeTab]);

  useFocusEffect(
    useCallback(() => {
      console.log(
        '🎯 Gallery screen focused - checking saved outfits database'
      );
      if (user) {
        fetchAllSavedOutfits();
      }
    }, [user])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'outfits') {
      fetchFavoriteOutfits();
    } else if (activeTab === 'saved') {
      fetchAllSavedOutfits().finally(() => setRefreshing(false));
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
      source_type: outfit.source_type,
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
      // First, check if this is an AI-generated outfit or manual outfit
      const { data: outfit, error: fetchError } = await supabase
        .from('saved_outfits')
        .select('source_type')
        .eq('id', outfitId)
        .single();

      if (fetchError) {
        console.error('Error fetching outfit details:', fetchError);
      }

      const isAIGenerated = outfit?.source_type === 'ai_generated';
      const isManual = outfit?.source_type === 'manual';

      // Use OutfitService.toggleOutfitFavorite which handles the logic for both manual and AI outfits
      // The global event emitter will automatically notify all listeners
      const result = await OutfitService.toggleOutfitFavorite(outfitId);

      if (result.error) {
        console.error('Error removing from favorites:', result.error);
        return;
      }

      // Remove from local state regardless of outfit type
      setFavoriteOutfits(prev => prev.filter(outfit => outfit.id !== outfitId));

      console.log(
        `✅ Outfit ${outfitId} removed from favorites. isFavorite: ${result.isFavorite}`
      );

      // If this was an AI-generated outfit, it should now appear back in the Generate screen
      if (isAIGenerated) {
        console.log(
          '🔄 AI outfit unfavorited, it will now appear in Generate screen again'
        );
      }

      // If this was a manual outfit, it should now appear back in the Generate screen under "Your Manual Outfits"
      if (isManual) {
        console.log(
          '🔄 Manual outfit unfavorited, it will now appear in Generate screen under "Your Manual Outfits" section'
        );
      }

      // Refresh the Gallery to ensure consistency
      fetchFavoriteOutfits();
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  };

  const handleItemPress = (item: ClothingItem) => {
    console.log('Item pressed:', item.name);
    router.push({
      pathname: '/item-detail',
      params: { itemId: item.id },
    });
  };

  const handleEditOutfit = async (outfitId: string) => {
    console.log('📝 Edit outfit:', outfitId);

    // Find the outfit to edit
    const outfitToEdit = favoriteOutfits.find(outfit => outfit.id === outfitId);
    if (outfitToEdit) {
      setOutfitToEdit({
        id: outfitToEdit.id,
        name: outfitToEdit.name,
        items: outfitToEdit.items,
        notes: outfitToEdit.notes,
        source_type: outfitToEdit.source_type,
      });

      // First open the edit modal
      setEditModalVisible(true);

      // Then close the detail modal after a small delay for smooth transition
      setTimeout(() => {
        setModalVisible(false);
      }, 300);
    }
  };

  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setOutfitToEdit(null);

    // If selectedOutfit still exists, user canceled editing - reopen detail modal
    if (selectedOutfit) {
      setTimeout(() => {
        setModalVisible(true);
      }, 300);
    }
  };

  const handleOutfitUpdate = (updatedOutfit: any) => {
    console.log('Outfit updated:', updatedOutfit);
    // Refresh the favorite outfits list
    fetchFavoriteOutfits();

    // Close edit modal
    setEditModalVisible(false);
    setOutfitToEdit(null);

    // Clear selected outfit state
    setSelectedOutfit(null);

    // Don't reopen detail modal - user should see the updated outfit in the list
  };

  // Filter outfits based on search query
  const getFilteredOutfits = (outfits: FavoriteOutfit[]) => {
    if (!searchQuery.trim()) return outfits;

    const query = searchQuery.toLowerCase();
    return outfits.filter(
      outfit =>
        outfit.name.toLowerCase().includes(query) ||
        outfit.notes?.toLowerCase().includes(query) ||
        outfit.occasion?.toLowerCase().includes(query) ||
        outfit.items.some(
          item =>
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.brand?.toLowerCase().includes(query) ||
            item.color.toLowerCase().includes(query)
        )
    );
  };

  const renderTabButton = (tabType: TabType, label: string, icon: any) => (
    <TouchableOpacity
      style={[
        styles.modernTabButton,
        activeTab === tabType && styles.activeModernTabButton,
      ]}
      onPress={() => setActiveTab(tabType)}
    >
      {icon}
      <AccessibleText
        style={[
          styles.modernTabButtonText,
          activeTab === tabType && styles.activeModernTabButtonText,
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

  const renderSavedOutfitItem = ({ item }: { item: FavoriteOutfit }) => (
    <FavoriteOutfitCard
      outfit={item}
      onPress={handleOutfitPress}
      onToggleFavorite={async (outfitId: string) => {
        console.log('🎯 Toggling favorite for saved outfit:', outfitId);

        try {
          const result = await OutfitService.toggleOutfitFavorite(outfitId);
          if (result.error) {
            console.error('❌ Error toggling favorite:', result.error);
            return;
          }

          setSavedOutfits(prev =>
            prev.map(outfit =>
              outfit.id === outfitId
                ? { ...outfit, is_favorite: result.isFavorite }
                : outfit
            )
          );

          if (result.isFavorite) {
            fetchFavoriteOutfits();
          }

          console.log(
            `✅ Outfit ${outfitId} favorite status: ${result.isFavorite}`
          );
        } catch (error) {
          console.error('❌ Error toggling favorite:', error);
        }
      }}
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

  const renderEmptySavedState = () => (
    <View style={styles.emptyState}>
      <Archive
        size={64}
        color={colors.text.secondary}
        style={styles.emptyIcon}
      />
      <AccessibleText
        style={[styles.emptyTitle, { color: colors.text.primary }]}
      >
        No Saved Outfits
      </AccessibleText>
      <AccessibleText
        style={[styles.emptyDescription, { color: colors.text.secondary }]}
      >
        Create and save outfits to see them here
      </AccessibleText>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background.primary }]}
    >
      {/* Header with consistent spacing like other pages */}
      <View style={styles.header}>
        <AccessibleText style={[styles.title, { color: colors.text.primary }]}>
          Outfit Gallery
        </AccessibleText>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search outfits..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.modernTabContainer}>
        {renderTabButton(
          'outfits',
          'Favorites',
          <Heart
            size={20}
            color={activeTab === 'outfits' ? colors.primary[600] : '#6b7280'}
          />
        )}
        {renderTabButton(
          'saved',
          'All Saved',
          <Archive
            size={20}
            color={activeTab === 'saved' ? colors.primary[600] : '#6b7280'}
          />
        )}
        {renderTabButton(
          'items',
          'Items',
          <Shirt
            size={20}
            color={activeTab === 'items' ? colors.primary[600] : '#6b7280'}
          />
        )}
      </View>

      <View style={styles.content}>
        {activeTab === 'outfits' ? (
          <FlatList
            data={getFilteredOutfits(favoriteOutfits)}
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
        ) : activeTab === 'saved' ? (
          <FlatList
            data={getFilteredOutfits(savedOutfits)}
            keyExtractor={item => item.id}
            renderItem={renderSavedOutfitItem}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptySavedState}
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
          onEdit={handleEditOutfit}
          onProve={handleProveOutfit}
          onVirtualTryOnComplete={handleVirtualTryOnComplete}
          onVirtualTryOnSave={handleVirtualTryOnSave}
          onVirtualTryOnShare={handleVirtualTryOnShare}
        />
      )}

      {/* Edit Modal */}
      <OutfitEditModal
        visible={editModalVisible}
        outfit={outfitToEdit}
        onClose={handleEditModalClose}
        onSave={handleOutfitUpdate}
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
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.secondary,
  },
  title: {
    ...Typography.heading.h2,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.surface.primary,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    zIndex: 9998,
    position: 'relative',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'Inter-Regular',
  },
  modernTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    gap: 8,
  },
  modernTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeModernTabButton: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
  },
  modernTabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  activeModernTabButtonText: {
    color: Colors.primary[600],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
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
