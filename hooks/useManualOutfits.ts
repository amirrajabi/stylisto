import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GeneratedOutfitRecord,
  OutfitService,
  outfitFavoriteChanged,
} from '../lib/outfitService';

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

  const loadManualOutfitsRef = useRef<(() => Promise<void>) | undefined>(
    undefined
  );

  loadManualOutfitsRef.current = async () => {
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
  };

  const refreshManualOutfits = useCallback(async () => {
    console.log('🔄 Refreshing manual outfits from database...');
    if (loadManualOutfitsRef.current) {
      await loadManualOutfitsRef.current();
    }
  }, []);

  useEffect(() => {
    if (loadManualOutfitsRef.current) {
      loadManualOutfitsRef.current();
    }
  }, []);

  useEffect(() => {
    console.log(
      '🔗 useManualOutfits: Subscribing to outfit favorite changes...'
    );
    const unsubscribe = outfitFavoriteChanged.subscribe(async () => {
      console.log(
        '🔔 useManualOutfits: Outfit favorite status changed, refreshing manual outfits...'
      );

      setTimeout(async () => {
        try {
          setState(prev => ({ ...prev, loading: true }));
          console.log(
            '🔄 useManualOutfits: Loading manual outfits after favorite change...'
          );
          const outfits = await OutfitService.loadManualOutfits();

          setState(prev => ({
            ...prev,
            manualOutfits: outfits,
            loading: false,
            error: null,
          }));

          console.log(
            `✅ useManualOutfits: Refreshed ${outfits.length} manual outfits after favorite change`
          );
        } catch (error) {
          console.error(
            '❌ useManualOutfits: Error refreshing manual outfits after favorite change:',
            error
          );
          setState(prev => ({
            ...prev,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to refresh manual outfits',
          }));
        }
      }, 100);
    });

    return unsubscribe;
  }, []);

  return {
    ...state,
    refreshManualOutfits,
  };
};
