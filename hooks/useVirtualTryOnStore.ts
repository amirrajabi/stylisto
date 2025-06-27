import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TryOnWorkflowState, useVirtualTryOn } from '../lib/virtualTryOn';
import { RootState } from '../store/store';
import {
  clearCurrentOutfit,
  clearError,
  completeProcessing,
  setCurrentOutfit,
  setProcessingError,
  setUserFullBodyImage,
  startProcessing,
  updateProcessingState,
  VirtualTryOnState,
} from '../store/virtualTryOnSlice';
import { ClothingItem } from '../types/wardrobe';
import { useAuth } from './useAuth';

export const useVirtualTryOnStore = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { processOutfitTryOn } = useVirtualTryOn();

  const virtualTryOnState = useSelector(
    (state: RootState) => state.virtualTryOn
  );

  // Sync user's full body image with store when user changes
  useEffect(() => {
    if (user?.full_body_image_url) {
      dispatch(setUserFullBodyImage(user.full_body_image_url));
    } else {
      dispatch(setUserFullBodyImage(null));
    }
  }, [user?.full_body_image_url, dispatch]);

  const updateCurrentOutfit = useCallback(
    (outfitId: string, outfitName: string, items: ClothingItem[]) => {
      console.log('🔄 Virtual Try-On Store: Updating current outfit', {
        outfitId,
        outfitName,
        itemCount: items.length,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          imageUrl: item.imageUrl,
        })),
      });

      dispatch(
        setCurrentOutfit({
          outfitId,
          outfitName,
          items,
        })
      );
    },
    [dispatch]
  );

  const clearOutfit = useCallback(() => {
    console.log('🗑️ Virtual Try-On Store: Clearing current outfit');
    dispatch(clearCurrentOutfit());
  }, [dispatch]);

  const processVirtualTryOnFromStore = useCallback(async () => {
    if (!virtualTryOnState.userFullBodyImageUrl) {
      dispatch(setProcessingError('User full body image is required'));
      return null;
    }

    if (!virtualTryOnState.currentOutfitItems.length) {
      dispatch(setProcessingError('No outfit items selected'));
      return null;
    }

    console.log('🚀 Starting Virtual Try-On Process', {
      userImage: virtualTryOnState.userFullBodyImageUrl,
      outfitId: virtualTryOnState.currentOutfitId,
      outfitName: virtualTryOnState.currentOutfitName,
      itemCount: virtualTryOnState.currentOutfitItems.length,
    });

    try {
      dispatch(startProcessing());

      console.log('📤 Sending to Virtual Try-On API:', {
        userImageUrl: virtualTryOnState.userFullBodyImageUrl,
        itemCount: virtualTryOnState.currentOutfitItems.length,
        outfitId: virtualTryOnState.currentOutfitId,
        prompt: generateOutfitPrompt(
          virtualTryOnState.currentOutfitItems,
          virtualTryOnState.currentOutfitName || 'Custom Outfit'
        ),
      });

      const startTime = Date.now();

      const result = await processOutfitTryOn(
        virtualTryOnState.currentOutfitId || 'unknown',
        virtualTryOnState.userFullBodyImageUrl,
        virtualTryOnState.currentOutfitItems,
        (state: TryOnWorkflowState) => {
          console.log('📊 Processing Update:', state);
          dispatch(
            updateProcessingState({
              phase: state.phase as VirtualTryOnState['processingPhase'],
              progress: state.progress,
              message: state.message,
            })
          );
        }
      );

      const processingTime = Date.now() - startTime;

      console.log('✅ Virtual Try-On Completed:', {
        generatedImageUrl: result.generatedImageUrl,
        processingTime,
        confidence: result.confidence,
      });

      dispatch(
        completeProcessing({
          generatedImageUrl: result.generatedImageUrl,
          processingTime,
        })
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Virtual try-on failed';
      console.error('❌ Virtual Try-On Error:', errorMessage);
      dispatch(setProcessingError(errorMessage));
      return null;
    }
  }, [virtualTryOnState, dispatch, processOutfitTryOn]);

  const clearProcessingError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Check if ready for virtual try-on
  const isReadyForTryOn = Boolean(
    virtualTryOnState.userFullBodyImageUrl &&
      virtualTryOnState.currentOutfitItems.length > 0 &&
      !virtualTryOnState.isProcessing
  );

  return {
    // State
    ...virtualTryOnState,
    isReadyForTryOn,

    // Actions
    updateCurrentOutfit,
    clearOutfit,
    processVirtualTryOn: processVirtualTryOnFromStore,
    clearProcessingError,
  };
};

// Helper function to generate descriptive prompt for API
const generateOutfitPrompt = (
  items: ClothingItem[],
  outfitName: string
): string => {
  const itemDescriptions = items.map(item => {
    const parts = [item.name];
    if (item.color) parts.push(`in ${item.color}`);
    if (item.brand) parts.push(`by ${item.brand}`);
    return parts.join(' ');
  });

  const basePrompt = `Fashion model wearing ${outfitName}: ${itemDescriptions.join(', ')}`;
  const stylePrompt =
    'Professional fashion photography, studio lighting, clean background, natural pose, high quality, detailed fabric textures';

  return `${basePrompt}. ${stylePrompt}`;
};
