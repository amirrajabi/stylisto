import { router, useLocalSearchParams } from 'expo-router';
import { Filter, Heart, Plus, Search, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BodyMedium, H1 } from '../../../components/ui';
import { OutfitCard } from '../../../components/wardrobe/OutfitCard';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { OutfitFilters, useSavedOutfits } from '../../../hooks/useSavedOutfits';
import { Occasion, Outfit, Season } from '../../../types/wardrobe';

export default function ProfileSavedScreen() {
  const params = useLocalSearchParams<{ highlight?: string }>();
  const {
    outfits,
    loading,
    error,
    saveOutfit,
    deleteOutfit,
    toggleFavorite,
    recordOutfitWorn,
    refreshOutfits,
    filterOutfits,
  } = useSavedOutfits();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState<OutfitFilters>({});
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [highlightedOutfitId, setHighlightedOutfitId] = useState<
    string | undefined
  >(params.highlight);

  useEffect(() => {
    const filters: OutfitFilters = {
      ...activeFilters,
      searchQuery: searchQuery.trim(),
    };

    setFilteredOutfits(filterOutfits(filters));
  }, [outfits, activeFilters, searchQuery, filterOutfits]);

  useEffect(() => {
    if (highlightedOutfitId) {
      const timer = setTimeout(() => {
        setHighlightedOutfitId(undefined);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [highlightedOutfitId]);

  const handleOutfitPress = useCallback((outfit: Outfit) => {
    router.push({
      pathname: '/outfit-detail',
      params: { outfitId: outfit.id },
    });
  }, []);

  const handleMoreOptions = useCallback(
    (outfit: Outfit) => {
      const options = ['Wear Today', 'Edit', 'Delete', 'Cancel'];
      const destructiveButtonIndex = 2;
      const cancelButtonIndex = 3;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options,
            destructiveButtonIndex,
            cancelButtonIndex,
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              recordOutfitWorn(outfit.id);
              Alert.alert(
                'Outfit Worn',
                'This outfit has been marked as worn today.'
              );
            } else if (buttonIndex === 1) {
              router.push({
                pathname: '/outfit-builder',
                params: { editOutfitId: outfit.id },
              });
            } else if (buttonIndex === 2) {
              Alert.alert(
                'Delete Outfit',
                `Are you sure you want to delete "${outfit.name}"?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteOutfit(outfit.id),
                  },
                ]
              );
            }
          }
        );
      } else {
        Alert.alert(
          'Outfit Options',
          `What would you like to do with "${outfit.name}"?`,
          [
            {
              text: 'Wear Today',
              onPress: () => {
                recordOutfitWorn(outfit.id);
                Alert.alert(
                  'Outfit Worn',
                  'This outfit has been marked as worn today.'
                );
              },
            },
            {
              text: 'Edit',
              onPress: () => {
                router.push({
                  pathname: '/outfit-builder',
                  params: { editOutfitId: outfit.id },
                });
              },
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                Alert.alert(
                  'Delete Outfit',
                  `Are you sure you want to delete "${outfit.name}"?`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => deleteOutfit(outfit.id),
                    },
                  ]
                );
              },
            },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }
    },
    [deleteOutfit, recordOutfitWorn]
  );

  const handleCreateOutfit = useCallback(() => {
    router.push('/outfit-builder');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOutfits();
    setRefreshing(false);
  }, [refreshOutfits]);

  const handleFilterPress = useCallback(() => {
    const seasonOptions = Object.values(Season);
    const occasionOptions = Object.values(Occasion);

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [
            'Filter by Season',
            'Filter by Occasion',
            'Show Favorites Only',
            'Clear Filters',
            'Cancel',
          ],
          cancelButtonIndex: 4,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...seasonOptions, 'Cancel'],
                cancelButtonIndex: seasonOptions.length,
              },
              seasonIndex => {
                if (seasonIndex < seasonOptions.length) {
                  setActiveFilters(prev => ({
                    ...prev,
                    seasons: [seasonOptions[seasonIndex]],
                  }));
                }
              }
            );
          } else if (buttonIndex === 1) {
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...occasionOptions, 'Cancel'],
                cancelButtonIndex: occasionOptions.length,
              },
              occasionIndex => {
                if (occasionIndex < occasionOptions.length) {
                  setActiveFilters(prev => ({
                    ...prev,
                    occasions: [occasionOptions[occasionIndex]],
                  }));
                }
              }
            );
          } else if (buttonIndex === 2) {
            setActiveFilters(prev => ({
              ...prev,
              favorites: true,
            }));
          } else if (buttonIndex === 3) {
            setActiveFilters({});
            setSearchQuery('');
          }
        }
      );
    }
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    setSearchQuery('');
  }, []);

  const renderActiveFilters = () => {
    const hasFilters =
      Object.keys(activeFilters).length > 0 || searchQuery.trim();

    if (!hasFilters) return null;

    return (
      <View style={styles.activeFiltersContainer}>
        <View style={styles.activeFilters}>
          {activeFilters.seasons?.map(season => (
            <TouchableOpacity
              key={season}
              style={styles.filterChip}
              onPress={() => {
                setActiveFilters(prev => ({
                  ...prev,
                  seasons: prev.seasons?.filter(s => s !== season),
                }));
              }}
            >
              <Text style={styles.filterChipText}>{season}</Text>
              <X size={14} color={Colors.text.secondary} />
            </TouchableOpacity>
          ))}

          {activeFilters.occasions?.map(occasion => (
            <TouchableOpacity
              key={occasion}
              style={styles.filterChip}
              onPress={() => {
                setActiveFilters(prev => ({
                  ...prev,
                  occasions: prev.occasions?.filter(o => o !== occasion),
                }));
              }}
            >
              <Text style={styles.filterChipText}>{occasion}</Text>
              <X size={14} color={Colors.text.secondary} />
            </TouchableOpacity>
          ))}

          {activeFilters.favorites && (
            <TouchableOpacity
              style={styles.filterChip}
              onPress={() => {
                setActiveFilters(prev => {
                  const { favorites, ...rest } = prev;
                  return rest;
                });
              }}
            >
              <Heart size={12} color={Colors.text.secondary} />
              <Text style={styles.filterChipText}>Favorites</Text>
              <X size={14} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={clearFilters}
          style={styles.clearFiltersButton}
        >
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderOutfit = ({ item }: { item: Outfit }) => (
    <OutfitCard
      outfit={item}
      onPress={() => handleOutfitPress(item)}
      onMorePress={() => handleMoreOptions(item)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      isHighlighted={item.id === highlightedOutfitId}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Heart size={64} color={Colors.text.tertiary} />
      <H1 style={styles.emptyStateTitle}>No saved outfits</H1>
      <BodyMedium style={styles.emptyStateSubtitle}>
        {searchQuery.trim() || Object.keys(activeFilters).length > 0
          ? 'No outfits match your search or filters. Try adjusting your criteria.'
          : 'Start creating and saving outfits to see them here.'}
      </BodyMedium>

      {!searchQuery.trim() && Object.keys(activeFilters).length === 0 && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreateOutfit}
        >
          <Plus size={16} color={Colors.surface.primary} />
          <Text style={styles.createButtonText}>Create Your First Outfit</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    if (loading && outfits.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your saved outfits...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load outfits</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredOutfits}
        renderItem={renderOutfit}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.listContent,
          filteredOutfits.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <H1 style={styles.title}>Saved Outfits</H1>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowSearch(!showSearch)}
              style={styles.headerButton}
            >
              <Search size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleFilterPress}
              style={styles.headerButton}
            >
              <Filter size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search outfits..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.text.tertiary}
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
              style={styles.searchCloseButton}
            >
              <X size={16} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {renderActiveFilters()}
      </View>

      {renderContent()}

      <TouchableOpacity style={styles.fab} onPress={handleCreateOutfit}>
        <Plus size={24} color={Colors.surface.primary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    backgroundColor: Colors.surface.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  searchCloseButton: {
    padding: Spacing.xs,
  },
  activeFiltersContainer: {
    marginBottom: Spacing.sm,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    gap: Spacing.xs,
  },
  filterChipText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
    textTransform: 'capitalize',
  },
  clearFiltersButton: {
    alignSelf: 'flex-start',
  },
  clearFiltersText: {
    ...Typography.caption.medium,
    color: Colors.accent.primary,
  },
  listContent: {
    padding: Spacing.md,
  },
  emptyListContent: {
    flex: 1,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    color: Colors.text.primary,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    gap: Spacing.sm,
  },
  createButtonText: {
    ...Typography.body.medium,
    color: Colors.surface.primary,
    fontWeight: '600',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error.primary,
    marginBottom: Spacing.md,
  },
  retryButton: {
    backgroundColor: Colors.primary[600],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  retryButtonText: {
    ...Typography.body.medium,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary[600],
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
});
