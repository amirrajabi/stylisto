import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Filter, Search, X } from 'lucide-react-native';
import { useSavedOutfits, OutfitFilters } from '../../hooks/useSavedOutfits';
import { OutfitCard } from '../wardrobe/OutfitCard';
import { Outfit, Season, Occasion } from '../../types/wardrobe';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface SavedOutfitsListProps {
  onOutfitPress?: (outfit: Outfit) => void;
  showHeader?: boolean;
  maxItems?: number;
  initialFilters?: OutfitFilters;
}

export const SavedOutfitsList: React.FC<SavedOutfitsListProps> = ({
  onOutfitPress,
  showHeader = true,
  maxItems,
  initialFilters = {},
}) => {
  const { outfits, loading, error, toggleFavorite, deleteOutfit, filterOutfits } = useSavedOutfits();
  const [filters, setFilters] = useState<OutfitFilters>(initialFilters);
  const [filteredOutfits, setFilteredOutfits] = useState<Outfit[]>([]);

  // Apply filters when outfits or filters change
  React.useEffect(() => {
    setFilteredOutfits(filterOutfits(filters));
  }, [outfits, filters, filterOutfits]);

  const handleOutfitPress = useCallback((outfit: Outfit) => {
    if (onOutfitPress) {
      onOutfitPress(outfit);
    } else {
      router.push({
        pathname: '/outfit-detail',
        params: { outfitId: outfit.id }
      });
    }
  }, [onOutfitPress]);

  const handleMoreOptions = useCallback((outfit: Outfit) => {
    // Show options menu
    Alert.alert(
      'Outfit Options',
      `What would you like to do with "${outfit.name}"?`,
      [
        { 
          text: 'View Details', 
          onPress: () => handleOutfitPress(outfit)
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
  }, [handleOutfitPress, deleteOutfit]);

  const handleFilterBySeason = useCallback((season: Season) => {
    setFilters(prev => ({
      ...prev,
      seasons: prev.seasons?.includes(season) 
        ? prev.seasons.filter(s => s !== season)
        : [...(prev.seasons || []), season],
    }));
  }, []);

  const handleFilterByOccasion = useCallback((occasion: Occasion) => {
    setFilters(prev => ({
      ...prev,
      occasions: prev.occasions?.includes(occasion)
        ? prev.occasions.filter(o => o !== occasion)
        : [...(prev.occasions || []), occasion],
    }));
  }, []);

  const handleToggleFavoritesFilter = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      favorites: !prev.favorites,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const renderOutfit = useCallback(({ item }: { item: Outfit }) => (
    <OutfitCard
      outfit={item}
      onPress={() => handleOutfitPress(item)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      onMoreOptions={() => handleMoreOptions(item)}
      showStats
    />
  ), [handleOutfitPress, toggleFavorite, handleMoreOptions]);

  // Render active filters
  const renderActiveFilters = () => {
    const hasFilters = 
      (filters.seasons && filters.seasons.length > 0) ||
      (filters.occasions && filters.occasions.length > 0) ||
      filters.favorites;
    
    if (!hasFilters) return null;
    
    return (
      <View style={styles.activeFiltersContainer}>
        {filters.seasons?.map(season => (
          <TouchableOpacity
            key={season}
            style={styles.filterTag}
            onPress={() => handleFilterBySeason(season)}
          >
            <Text style={styles.filterTagText}>{season}</Text>
            <X size={12} color={Colors.white} />
          </TouchableOpacity>
        ))}
        
        {filters.occasions?.map(occasion => (
          <TouchableOpacity
            key={occasion}
            style={[styles.filterTag, { backgroundColor: Colors.secondary[500] }]}
            onPress={() => handleFilterByOccasion(occasion)}
          >
            <Text style={styles.filterTagText}>{occasion}</Text>
            <X size={12} color={Colors.white} />
          </TouchableOpacity>
        ))}
        
        {filters.favorites && (
          <TouchableOpacity
            style={[styles.filterTag, { backgroundColor: Colors.error[500] }]}
            onPress={handleToggleFavoritesFilter}
          >
            <Text style={styles.filterTagText}>Favorites</Text>
            <X size={12} color={Colors.white} />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={handleClearFilters}
        >
          <Text style={styles.clearFiltersText}>Clear All</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[700]} />
        <Text style={styles.loadingText}>Loading outfits...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const displayOutfits = maxItems ? filteredOutfits.slice(0, maxItems) : filteredOutfits;

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Text style={styles.title}>Saved Outfits</Text>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => {
                // Show filter options
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
                          Object.values(Season).map(season => ({
                            text: season,
                            onPress: () => handleFilterBySeason(season),
                          }))
                        );
                      }
                    },
                    { 
                      text: 'Filter by Occasion', 
                      onPress: () => {
                        Alert.alert(
                          'Select Occasion',
                          'Choose an occasion to filter by',
                          Object.values(Occasion).map(occasion => ({
                            text: occasion,
                            onPress: () => handleFilterByOccasion(occasion),
                          }))
                        );
                      }
                    },
                    { 
                      text: 'Show Favorites Only', 
                      onPress: handleToggleFavoritesFilter
                    },
                    { 
                      text: 'Clear Filters', 
                      onPress: handleClearFilters
                    },
                    { text: 'Cancel', style: 'cancel' },
                  ]
                );
              }}
            >
              <Filter size={18} color={Colors.text.secondary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/outfit-builder')}
            >
              <Plus size={18} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {renderActiveFilters()}
      
      {displayOutfits.length > 0 ? (
        <FlatList
          data={displayOutfits}
          renderItem={renderOutfit}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {Object.keys(filters).length > 0
              ? 'No outfits match your filters'
              : 'No saved outfits yet'}
          </Text>
          
          {Object.keys(filters).length > 0 ? (
            <TouchableOpacity
              style={styles.clearFiltersButton}
              onPress={handleClearFilters}
            >
              <Text style={styles.clearFiltersText}>Clear Filters</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/outfit-builder')}
            >
              <Text style={styles.createButtonText}>Create Outfit</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {showHeader && maxItems && filteredOutfits.length > maxItems && (
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push('/saved')}
        >
          <Text style={styles.viewAllText}>View All Outfits</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Import Alert
import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
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
    ...Typography.caption.small,
    color: Colors.white,
    textTransform: 'capitalize',
  },
  clearFiltersButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    marginTop: Spacing.sm,
  },
  clearFiltersText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
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
    color: Colors.error[600],
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
  },
  createButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  viewAllButton: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  viewAllText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
});