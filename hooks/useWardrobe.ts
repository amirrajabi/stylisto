import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CreateClothingItemData,
  UpdateClothingItemData,
  wardrobeService,
} from '../lib/wardrobeService';
import { AppDispatch, RootState } from '../store/store';
import * as wardrobeActions from '../store/wardrobeSlice';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Outfit,
  Season,
  WardrobeStats,
} from '../types/wardrobe';

export const useWardrobe = () => {
  const dispatch = useDispatch<AppDispatch>();
  const wardrobeState = useSelector((state: RootState) => state.wardrobe);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load items from database on mount
  useEffect(() => {
    loadClothingItems();
  }, []);

  const loadClothingItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await wardrobeService.getClothingItems();
      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        // Clear existing items and load from database
        dispatch(wardrobeActions.setItems(result.data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = async (itemData: CreateClothingItemData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await wardrobeService.createClothingItem(itemData);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      } else if (result.data) {
        dispatch(wardrobeActions.addItem(result.data));
        return { success: true, data: result.data };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }

    return { success: false, error: 'Unknown error' };
  };

  const updateItem = async (itemData: UpdateClothingItemData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await wardrobeService.updateClothingItem(itemData);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      } else if (result.data) {
        dispatch(wardrobeActions.updateItem(result.data));
        return { success: true, data: result.data };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }

    return { success: false, error: 'Unknown error' };
  };

  const deleteItem = async (itemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await wardrobeService.deleteClothingItem(itemId);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      } else {
        dispatch(wardrobeActions.deleteItem(itemId));
        return { success: true };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = async (itemId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await wardrobeService.toggleFavorite(itemId);
      if (result.error) {
        setError(result.error);
        return { success: false, error: result.error };
      } else {
        dispatch(wardrobeActions.toggleFavorite(itemId));
        return { success: true };
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredItems = (): ClothingItem[] => {
    let filtered = wardrobeState.items;

    // Apply search query
    if (wardrobeState.searchQuery) {
      const query = wardrobeState.searchQuery.toLowerCase();
      filtered = filtered.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.brand?.toLowerCase().includes(query) ||
          item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    const { filters } = wardrobeState;

    if (filters.categories.length > 0) {
      filtered = filtered.filter(item =>
        filters.categories.includes(item.category)
      );
    }

    if (filters.seasons.length > 0) {
      filtered = filtered.filter(item =>
        item.season.some(season => filters.seasons.includes(season))
      );
    }

    if (filters.occasions.length > 0) {
      filtered = filtered.filter(item =>
        item.occasion.some(occasion => filters.occasions.includes(occasion))
      );
    }

    if (filters.colors.length > 0) {
      filtered = filtered.filter(item => filters.colors.includes(item.color));
    }

    if (filters.brands.length > 0) {
      filtered = filtered.filter(
        item => item.brand && filters.brands.includes(item.brand)
      );
    }

    if (filters.tags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags.some(tag => filters.tags.includes(tag))
      );
    }

    if (filters.favorites) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    if (filters.priceRange) {
      filtered = filtered.filter(
        item =>
          item.price &&
          item.price >= filters.priceRange![0] &&
          item.price <= filters.priceRange![1]
      );
    }

    // Apply sorting
    const { sortOptions } = wardrobeState;
    filtered.sort((a, b) => {
      let aValue: any = a[sortOptions.field];
      let bValue: any = b[sortOptions.field];

      if (
        sortOptions.field === 'lastWorn' ||
        sortOptions.field === 'createdAt'
      ) {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOptions.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOptions.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const getWardrobeStats = (): WardrobeStats => {
    const items = wardrobeState.items;

    const itemsByCategory = Object.values(ClothingCategory).reduce(
      (acc, category) => {
        acc[category] = items.filter(item => item.category === category).length;
        return acc;
      },
      {} as Record<ClothingCategory, number>
    );

    const itemsBySeason = Object.values(Season).reduce(
      (acc, season) => {
        acc[season] = items.filter(item => item.season.includes(season)).length;
        return acc;
      },
      {} as Record<Season, number>
    );

    const itemsByOccasion = Object.values(Occasion).reduce(
      (acc, occasion) => {
        acc[occasion] = items.filter(item =>
          item.occasion.includes(occasion)
        ).length;
        return acc;
      },
      {} as Record<Occasion, number>
    );

    const sortedByWorn = [...items].sort((a, b) => b.timesWorn - a.timesWorn);
    const sortedByDate = [...items].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      totalItems: items.length,
      itemsByCategory,
      itemsBySeason,
      itemsByOccasion,
      favoriteItems: items.filter(item => item.isFavorite).length,
      totalOutfits: wardrobeState.outfits.length,
      mostWornItems: sortedByWorn.slice(0, 5),
      leastWornItems: sortedByWorn.slice(-5).reverse(),
      recentlyAdded: sortedByDate.slice(0, 5),
    };
  };

  return {
    ...wardrobeState,
    filteredItems: getFilteredItems(),
    stats: getWardrobeStats(),
    isLoading: isLoading || wardrobeState.isLoading,
    error: error || wardrobeState.error,
    actions: {
      addItem,
      updateItem,
      deleteItem,
      toggleFavorite,
      loadClothingItems,
      // Legacy Redux actions for outfits and UI state
      addOutfit: (outfit: Outfit) =>
        dispatch(wardrobeActions.addOutfit(outfit)),
      updateOutfit: (outfit: Outfit) =>
        dispatch(wardrobeActions.updateOutfit(outfit)),
      deleteOutfit: (id: string) => dispatch(wardrobeActions.deleteOutfit(id)),
      toggleOutfitFavorite: (id: string) =>
        dispatch(wardrobeActions.toggleOutfitFavorite(id)),
      selectItem: (id: string) => dispatch(wardrobeActions.selectItem(id)),
      deselectItem: (id: string) => dispatch(wardrobeActions.deselectItem(id)),
      clearSelection: () => dispatch(wardrobeActions.clearSelection()),
      setFilters: (filters: Partial<typeof wardrobeState.filters>) =>
        dispatch(wardrobeActions.setFilters(filters)),
      clearFilters: () => dispatch(wardrobeActions.clearFilters()),
      setSortOptions: (options: typeof wardrobeState.sortOptions) =>
        dispatch(wardrobeActions.setSortOptions(options)),
      setSearchQuery: (query: string) =>
        dispatch(wardrobeActions.setSearchQuery(query)),
    },
  };
};
