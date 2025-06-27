import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { OutfitService } from '../lib/outfitService';

export const useOutfitFavorites = () => {
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>(
    {}
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const toggleOutfitFavorite = useCallback(
    async (outfitId: string) => {
      if (loading[outfitId]) return null;

      setLoading(prev => ({ ...prev, [outfitId]: true }));

      try {
        const result = await OutfitService.toggleOutfitFavorite(outfitId);

        if (result.error) {
          Alert.alert('Error', 'Failed to update favorite status');
          return null;
        }

        setFavoriteStatus(prev => ({
          ...prev,
          [outfitId]: result.isFavorite || false,
        }));

        return result.isFavorite;
      } catch (error) {
        console.error('Error toggling outfit favorite:', error);
        Alert.alert('Error', 'Failed to update favorite status');
        return null;
      } finally {
        setLoading(prev => ({ ...prev, [outfitId]: false }));
      }
    },
    [loading]
  );

  const setOutfitFavoriteStatus = useCallback(
    (outfitId: string, isFavorite: boolean) => {
      setFavoriteStatus(prev => ({ ...prev, [outfitId]: isFavorite }));
    },
    []
  );

  return {
    favoriteStatus,
    loading,
    toggleOutfitFavorite,
    setOutfitFavoriteStatus,
  };
};
