import { useCallback, useEffect, useState } from 'react';
import { GeneratedOutfitRecord, OutfitService } from '../lib/outfitService';

interface UseManualOutfitsState {
  manualOutfits: GeneratedOutfitRecord[];
  loading: boolean;
  error: string | null;
}

export const useManualOutfits = () => {
  const [state, setState] = useState<UseManualOutfitsState>({
    manualOutfits: [],
    loading: true,
    error: null,
  });

  const loadManualOutfits = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      console.log('🔄 Loading manual outfits directly from database...');
      const outfits = await OutfitService.loadManualOutfits();

      setState(prev => ({
        ...prev,
        manualOutfits: outfits,
        loading: false,
        error: null,
      }));

      console.log('✅ Loaded', outfits.length, 'manual outfits from database');
    } catch (error) {
      console.error('❌ Error loading manual outfits:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to load manual outfits',
      }));
    }
  }, []);

  const refreshManualOutfits = useCallback(async () => {
    console.log('🔄 Refreshing manual outfits from database...');
    await loadManualOutfits();
  }, [loadManualOutfits]);

  useEffect(() => {
    loadManualOutfits();
  }, [loadManualOutfits]);

  return {
    ...state,
    refreshManualOutfits,
  };
};
