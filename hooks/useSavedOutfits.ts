import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { Outfit } from '../types/wardrobe';

interface UseSavedOutfitsState {
  outfits: Outfit[];
  loading: boolean;
  error: string | null;
  lastSyncTime: Date | null;
}

interface UseSavedOutfitsActions {
  saveOutfit: (outfit: Outfit) => Promise<string>;
  updateOutfit: (outfit: Outfit) => Promise<void>;
  deleteOutfit: (outfitId: string) => Promise<void>;
  toggleFavorite: (outfitId: string) => Promise<void>;
  recordOutfitWorn: (outfitId: string) => Promise<void>;
  refreshOutfits: () => Promise<void>;
  getOutfitById: (outfitId: string) => Outfit | undefined;
  filterOutfits: (filters: OutfitFilters) => Outfit[];
}

export interface OutfitFilters {
  seasons?: string[];
  occasions?: string[];
  favorites?: boolean;
  searchQuery?: string;
}

const OUTFITS_STORAGE_KEY = '@stylisto_saved_outfits';
const LAST_SYNC_KEY = '@stylisto_outfits_last_sync';

export const useSavedOutfits = (): UseSavedOutfitsState &
  UseSavedOutfitsActions => {
  const [state, setState] = useState<UseSavedOutfitsState>({
    outfits: [],
    loading: true,
    error: null,
    lastSyncTime: null,
  });

  // Load outfits from local storage and then sync with server
  useEffect(() => {
    const loadOutfits = async () => {
      try {
        // Load from local storage first for immediate display
        const storedOutfits = await AsyncStorage.getItem(OUTFITS_STORAGE_KEY);
        const lastSyncTimeStr = await AsyncStorage.getItem(LAST_SYNC_KEY);

        if (storedOutfits) {
          setState(prev => ({
            ...prev,
            outfits: JSON.parse(storedOutfits),
            lastSyncTime: lastSyncTimeStr ? new Date(lastSyncTimeStr) : null,
            loading: false,
          }));
        }

        // Then sync with server
        await syncWithServer();
      } catch (error) {
        console.error('Error loading outfits:', error);
        setState(prev => ({
          ...prev,
          error: 'Failed to load outfits',
          loading: false,
        }));
      }
    };

    loadOutfits();
  }, []);

  // Sync outfits with server
  const syncWithServer = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'You must be logged in to sync outfits',
        }));
        return;
      }

      // Get last sync time
      const lastSyncTimeStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSyncTime = lastSyncTimeStr
        ? new Date(lastSyncTimeStr)
        : new Date(0);

      // Call sync function
      const { data, error } = await supabase.rpc('sync_outfits', {
        user_uuid: session.user.id,
        last_sync_time: lastSyncTime.toISOString(),
      });

      if (error) throw error;

      if (data) {
        // Process updated outfits
        const updatedOutfits = data.updated || [];
        const deletedOutfitIds = (data.deleted || []).map(
          (item: any) => item.id
        );

        // Merge with local outfits
        setState(prev => {
          // Remove deleted outfits
          const filteredOutfits = prev.outfits.filter(
            outfit => !deletedOutfitIds.includes(outfit.id)
          );

          // Add/update new outfits
          const outfitMap = new Map(
            filteredOutfits.map(outfit => [outfit.id, outfit])
          );
          updatedOutfits.forEach((outfit: Outfit) => {
            outfitMap.set(outfit.id, outfit);
          });

          const mergedOutfits = Array.from(outfitMap.values());

          // Save to local storage
          AsyncStorage.setItem(
            OUTFITS_STORAGE_KEY,
            JSON.stringify(mergedOutfits)
          );
          AsyncStorage.setItem(LAST_SYNC_KEY, data.sync_time);

          return {
            ...prev,
            outfits: mergedOutfits,
            lastSyncTime: new Date(data.sync_time),
            loading: false,
            error: null,
          };
        });
      }
    } catch (error) {
      console.error('Error syncing outfits:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to sync outfits with server',
        loading: false,
      }));
    }
  };

  // Save a new outfit
  const saveOutfit = async (outfit: Outfit): Promise<string> => {
    try {
      // Generate ID if not provided
      if (!outfit.id) {
        outfit.id = uuidv4();
      }

      // Set timestamps
      const now = new Date();
      outfit.createdAt = outfit.createdAt || now.toISOString();
      outfit.updatedAt = now.toISOString();

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        outfits: [...prev.outfits, outfit],
      }));

      // Save to local storage
      const updatedOutfits = [...state.outfits, outfit];
      await AsyncStorage.setItem(
        OUTFITS_STORAGE_KEY,
        JSON.stringify(updatedOutfits)
      );

      // Save to server
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Insert outfit
        const { error: outfitError } = await supabase
          .from('saved_outfits')
          .insert({
            id: outfit.id,
            user_id: session.user.id,
            name: outfit.name,
            occasions: outfit.occasion,
            seasons: outfit.season,
            tags: outfit.tags,
            is_favorite: outfit.isFavorite,
            times_worn: outfit.timesWorn,
            last_worn: outfit.lastWorn,
            notes: outfit.notes,
            created_at: outfit.createdAt,
            updated_at: outfit.updatedAt,
          });

        if (outfitError) throw outfitError;

        // Insert outfit items
        const outfitItems = outfit.items.map(item => ({
          outfit_id: outfit.id,
          clothing_item_id: item.id,
        }));

        const { error: itemsError } = await supabase
          .from('outfit_items')
          .insert(outfitItems);

        if (itemsError) throw itemsError;
      }

      return outfit.id;
    } catch (error) {
      console.error('Error saving outfit:', error);

      // Revert optimistic update
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.filter(o => o.id !== outfit.id),
        error: 'Failed to save outfit',
      }));

      throw error;
    }
  };

  // Update an existing outfit
  const updateOutfit = async (outfit: Outfit): Promise<void> => {
    try {
      // Set updated timestamp
      outfit.updatedAt = new Date().toISOString();

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.map(o => (o.id === outfit.id ? outfit : o)),
      }));

      // Update local storage
      const updatedOutfits = state.outfits.map(o =>
        o.id === outfit.id ? outfit : o
      );
      await AsyncStorage.setItem(
        OUTFITS_STORAGE_KEY,
        JSON.stringify(updatedOutfits)
      );

      // Update on server
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Update outfit
        const { error: outfitError } = await supabase
          .from('saved_outfits')
          .update({
            name: outfit.name,
            occasions: outfit.occasion,
            seasons: outfit.season,
            tags: outfit.tags,
            is_favorite: outfit.isFavorite,
            times_worn: outfit.timesWorn,
            last_worn: outfit.lastWorn,
            notes: outfit.notes,
            updated_at: outfit.updatedAt,
          })
          .eq('id', outfit.id);

        if (outfitError) throw outfitError;

        // Delete existing outfit items
        const { error: deleteError } = await supabase
          .from('outfit_items')
          .delete()
          .eq('outfit_id', outfit.id);

        if (deleteError) throw deleteError;

        // Insert new outfit items
        const outfitItems = outfit.items.map(item => ({
          outfit_id: outfit.id,
          clothing_item_id: item.id,
        }));

        const { error: itemsError } = await supabase
          .from('outfit_items')
          .insert(outfitItems);

        if (itemsError) throw itemsError;
      }
    } catch (error) {
      console.error('Error updating outfit:', error);

      // Revert optimistic update
      setState(prev => ({
        ...prev,
        error: 'Failed to update outfit',
      }));

      // Refresh from storage to revert changes
      refreshOutfits();

      throw error;
    }
  };

  // Delete an outfit
  const deleteOutfit = async (outfitId: string): Promise<void> => {
    try {
      // Optimistically update local state
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.filter(o => o.id !== outfitId),
      }));

      // Update local storage
      const updatedOutfits = state.outfits.filter(o => o.id !== outfitId);
      await AsyncStorage.setItem(
        OUTFITS_STORAGE_KEY,
        JSON.stringify(updatedOutfits)
      );

      // Delete from server
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Soft delete the outfit
        const { error } = await supabase
          .from('saved_outfits')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', outfitId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error deleting outfit:', error);

      // Revert optimistic update
      setState(prev => ({
        ...prev,
        error: 'Failed to delete outfit',
      }));

      // Refresh from storage to revert changes
      refreshOutfits();

      throw error;
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (outfitId: string): Promise<void> => {
    try {
      // Find the outfit
      const outfit = state.outfits.find(o => o.id === outfitId);
      if (!outfit) return;

      // Toggle favorite status
      const updatedOutfit = {
        ...outfit,
        isFavorite: !outfit.isFavorite,
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.map(o => (o.id === outfitId ? updatedOutfit : o)),
      }));

      // Update local storage
      const updatedOutfits = state.outfits.map(o =>
        o.id === outfitId ? updatedOutfit : o
      );
      await AsyncStorage.setItem(
        OUTFITS_STORAGE_KEY,
        JSON.stringify(updatedOutfits)
      );

      // Update on server
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase
          .from('saved_outfits')
          .update({
            is_favorite: updatedOutfit.isFavorite,
            updated_at: updatedOutfit.updatedAt,
          })
          .eq('id', outfitId);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);

      // Revert optimistic update
      setState(prev => ({
        ...prev,
        error: 'Failed to update favorite status',
      }));

      // Refresh from storage to revert changes
      refreshOutfits();

      throw error;
    }
  };

  // Record that an outfit was worn
  const recordOutfitWorn = async (outfitId: string): Promise<void> => {
    try {
      // Find the outfit
      const outfit = state.outfits.find(o => o.id === outfitId);
      if (!outfit) return;

      // Update worn count and date
      const now = new Date().toISOString();
      const updatedOutfit = {
        ...outfit,
        timesWorn: (outfit.timesWorn || 0) + 1,
        lastWorn: now,
        updatedAt: now,
      };

      // Optimistically update local state
      setState(prev => ({
        ...prev,
        outfits: prev.outfits.map(o => (o.id === outfitId ? updatedOutfit : o)),
      }));

      // Update local storage
      const updatedOutfits = state.outfits.map(o =>
        o.id === outfitId ? updatedOutfit : o
      );
      await AsyncStorage.setItem(
        OUTFITS_STORAGE_KEY,
        JSON.stringify(updatedOutfits)
      );

      // Update on server
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { error } = await supabase.rpc('record_outfit_worn', {
          outfit_uuid: outfitId,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error recording outfit worn:', error);

      // Revert optimistic update
      setState(prev => ({
        ...prev,
        error: 'Failed to record outfit as worn',
      }));

      // Refresh from storage to revert changes
      refreshOutfits();

      throw error;
    }
  };

  // Refresh outfits from storage and server
  const refreshOutfits = async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load from local storage first
      const storedOutfits = await AsyncStorage.getItem(OUTFITS_STORAGE_KEY);
      if (storedOutfits) {
        setState(prev => ({
          ...prev,
          outfits: JSON.parse(storedOutfits),
        }));
      }

      // Then sync with server
      await syncWithServer();
    } catch (error) {
      console.error('Error refreshing outfits:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh outfits',
        loading: false,
      }));
    }
  };

  // Get outfit by ID
  const getOutfitById = useCallback(
    (outfitId: string): Outfit | undefined => {
      return state.outfits.find(outfit => outfit.id === outfitId);
    },
    [state.outfits]
  );

  // Filter outfits based on criteria
  const filterOutfits = useCallback(
    (filters: OutfitFilters): Outfit[] => {
      return state.outfits.filter(outfit => {
        // Filter by seasons
        if (filters.seasons && filters.seasons.length > 0) {
          if (
            !outfit.season.some(season => filters.seasons?.includes(season))
          ) {
            return false;
          }
        }

        // Filter by occasions
        if (filters.occasions && filters.occasions.length > 0) {
          if (
            !outfit.occasion.some(occasion =>
              filters.occasions?.includes(occasion)
            )
          ) {
            return false;
          }
        }

        // Filter by favorites
        if (filters.favorites && !outfit.isFavorite) {
          return false;
        }

        // Filter by search query
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          const matchesName = outfit.name.toLowerCase().includes(query);
          const matchesTags = outfit.tags.some(tag =>
            tag.toLowerCase().includes(query)
          );

          if (!matchesName && !matchesTags) {
            return false;
          }
        }

        return true;
      });
    },
    [state.outfits]
  );

  return {
    ...state,
    saveOutfit,
    updateOutfit,
    deleteOutfit,
    toggleFavorite,
    recordOutfitWorn,
    refreshOutfits,
    getOutfitById,
    filterOutfits,
  };
};
