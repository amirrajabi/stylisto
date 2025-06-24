import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
  ActionSheetIOS,
  Platform,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Heart, Search, Filter, X, Calendar, Tag } from 'lucide-react-native';
import { useSavedOutfits, OutfitFilters } from '../../../hooks/useSavedOutfits';
import { OutfitCard } from '../../../components/wardrobe/OutfitCard';
import { Outfit, Season, Occasion } from '../../../types/wardrobe';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1, BodyMedium } from '../../../components/ui';

export default function SavedScreen() {
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
    filterOutfits
  } = useSavedOutfits();

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState<OutfitFilters>({});
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);
  const [highlightedOutfitId, setHighlightedOutfitId] = useState<string | undefined>(
    params.highlight
  );

  // Apply filters and search
  useEffect(() => {
    const filters: OutfitFilters = {
      ...activeFilters,
      searchQuery: searchQuery.trim(),
    };
    
    setFilteredOutfits(filterOutfits(filters));
  }, [outfits, activeFilters, searchQuery, filterOutfits]);

  // Clear highlight after a delay
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
      params: { outfitId: outfit.id }
    });
  }, []);

  const handleMoreOptions = useCallback((outfit: Outfit) => {
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
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Wear today
            recordOutfitWorn(outfit.id);
            Alert.alert('Outfit Worn', 'This outfit has been marked as worn today.');
          } else if (buttonIndex === 1) {
            router.push({
              pathname: '/outfit-builder',
              params: { editOutfitId: outfit.id }
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
              Alert.alert('Outfit Worn', 'This outfit has been marked as worn today.');
            }
          },
          { 
            text: 'Edit', 
            onPress: () => {
              router.push({
                pathname: '/outfit-builder',
                params: { editOutfitId: outfit.id }
              });
            }
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
  }, [deleteOutfit, recordOutfitWorn]);

  const handleCreateOutfit = useCallback(() => {
    router.push('/outfit-builder');
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshOutfits();
    setRefreshing(false);
  }, [refreshOutfits]);

  const handleFilterPress = useCallback(() => {
    // Show filter options
    const seasonOptions = Object.values(Season);
    const occasionOptions = Object.values(Occasion);
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Filter by Season', 'Filter by Occasion', 'Show Favorites Only', 'Clear Filters', 'Cancel'],
          cancelButtonIndex: 4,
        },
        (buttonIndex) => {
          if (buttonIndex === 0) {
            // Filter by Season
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...seasonOptions, 'Cancel'],
                cancelButtonIndex: seasonOptions.length,
              },
              (seasonIndex) => {
                if (seasonIndex < seasonOptions.length) {
                  setActiveFilters(prev => ({
                    ...prev,
                    seasons: [seasonOptions[seasonIndex]],
                  }));
                }
              }
            );
          } else if (buttonIndex === 1) {
            // Filter by Occasion
            ActionSheetIOS.showActionSheetWithOptions(
              {
                options: [...occasionOptions, 'Cancel'],
                cancelButtonIndex: occasionOptions.length,
              },
              (occasionIndex) => {
                if (occasionIndex < occasionOptions.length) {
                  setActiveFilters(prev => ({
                    ...prev,
                    occasions: [occasionOptions[occasionIndex]],
                  }));
                }
              }
            );
          } else if (buttonIndex === 2) {
            // Show Favorites Only
            setActiveFilters(prev => ({
              ...prev,
              favorites: true,
            }));
          } else if (buttonIndex === 3) {
            // Clear Filters
            setActiveFilters({});
          }
        }
      );
    } else {
      Alert.alert(
        'Filter Outfits',
        'Choose a filter option',
        [
          { 
            text: 'Filter by Season', 
            onPress: () => {
              Alert.alert(
                'Select Season',
                'Choose a season to filter by',
                [
                  ...seasonOptions.map(season => ({
                    text: season,
                    onPress: () => setActiveFilters(prev => ({
                      ...prev,
                      seasons: [season],
                    })),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          },
          { 
            text: 'Filter by Occasion', 
            onPress: () => {
              Alert.alert(
                'Select Occasion',
                'Choose an occasion to filter by',
                [
                  ...occasionOptions.map(occasion => ({
                    text: occasion,
                    onPress: () => setActiveFilters(prev => ({
                      ...prev,
                      occasions: [occasion],
                    })),
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }
          },
          { 
            text: 'Show Favorites Only', 
            onPress: () => {
              setActiveFilters(prev => ({
                ...prev,
                favorites: true,
              }));
            }
          },
          { 
            text: 'Clear Filters', 
            onPress: () => {
              setActiveFilters({});
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  }, []);

  const renderActiveFilters = () => {
    const hasFilters = 
      (activeFilters.seasons && activeFilters.seasons.length > 0) ||
      (activeFilters.occasions && activeFilters.occasions.length > 0) ||
      activeFilters.favorites;
    
    if (!hasFilters) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        {activeFilters.seasons?.map(season => (
          <View key={season} style={styles.filterTag}>
            <Calendar size={14} color={Colors.white} />
            <Text style={styles.filterTagText}>{season}</Text>
            <TouchableOpacity
              onPress={() => setActiveFilters(prev => ({
                ...prev,
                seasons: prev.seasons?.filter(s => s !== season),
              }))}
            >
              <X size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        
        {activeFilters.occasions?.map(occasion => (
          <View key={occasion} style={[styles.filterTag, { backgroundColor: Colors.secondary[500] }]}>
            <Tag size={14} color={Colors.white} />
            <Text style={styles.filterTagText}>{occasion}</Text>
            <TouchableOpacity
              onPress={() => setActiveFilters(prev => ({
                ...prev,
                occasions: prev.occasions?.filter(o => o !== occasion),
              }))}
            >
              <X size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        ))}
        
        {activeFilters.favorites && (
          <View style={[styles.filterTag, { backgroundColor: Colors.error[500] }]}>
            <Heart size={14} color={Colors.white} />
            <Text style={styles.filterTagText}>Favorites</Text>
            <TouchableOpacity
              onPress={() => setActiveFilters(prev => ({
                ...prev,
                favorites: false,
              }))}
            >
              <X size={14} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => setActiveFilters({})}
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
      onToggleFavorite={() => toggleFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      showStats
      isHighlighted={item.id === highlightedOutfitId}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {showSearch ? (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search outfits..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchCloseButton}
              onPress={() => {
                setShowSearch(false);
                setSearchQuery('');
              }}
            >
              <X size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <H1>Saved Outfits</H1>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSearch(true)}
                accessibilityLabel="Search outfits"
              >
                <Search size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleFilterPress}
                accessibilityLabel="Filter outfits"
              >
                <Filter size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleCreateOutfit}
                accessibilityLabel="Create new outfit"
              >
                <Plus size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Outfits List */}
      <FlatList
        data={filteredOutfits}
        renderItem={renderOutfit}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary[700]]}
            tintColor={Colors.primary[700]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Heart size={64} color={Colors.text.disabled} />
            <Text style={styles.emptyTitle}>No saved outfits yet</Text>
            <BodyMedium color="secondary" style={styles.emptySubtitle}>
              {activeFilters.seasons || activeFilters.occasions || activeFilters.favorites || searchQuery
                ? 'No outfits match your current filters. Try adjusting your search or filters.'
                : 'Create your first outfit by combining items from your wardrobe'}
            </BodyMedium>
            {!activeFilters.seasons && !activeFilters.occasions && !activeFilters.favorites && !searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={handleCreateOutfit}
              >
                <Text style={styles.emptyButtonText}>Create Outfit</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary[700],
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchCloseButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.sm,
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: Spacing.sm,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
  },
  filterTagText: {
    ...Typography.caption.medium,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  clearFiltersText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  listContainer: {
    padding: Spacing.md,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  emptyButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  emptyButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});