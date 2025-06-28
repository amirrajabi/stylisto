import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabase';
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
import { useVirtualTryOnStorage } from './useVirtualTryOnStorage';

export const useVirtualTryOnStore = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { processOutfitTryOn } = useVirtualTryOn();
  const virtualTryOnStorage = useVirtualTryOnStorage();

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
    // 🔒 CRITICAL: Verify authentication first
    console.log('🔐 Checking authentication before virtual try-on...');

    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Auth error:', authError);
      dispatch(
        setProcessingError(`Authentication error: ${authError.message}`)
      );
      return null;
    }

    if (!currentUser || !currentUser.id) {
      console.error('❌ No authenticated user found');
      dispatch(setProcessingError('Please login to use virtual try-on'));
      return null;
    }

    console.log('✅ User authenticated:', {
      id: currentUser.id,
      email: currentUser.email,
      lastSignIn: currentUser.last_sign_in_at,
    });

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
      userId: currentUser.id,
    });

    try {
      dispatch(startProcessing());

      const startTime = Date.now();

      // Process virtual try-on
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

      // 💾 Save result using simplified storage service
      try {
        console.log('💾 Saving Virtual Try-On result...');

        const saveResult = await virtualTryOnStorage.save(
          result.generatedImageUrl,
          virtualTryOnState.currentOutfitName || 'Custom Outfit',
          {
            outfitId: virtualTryOnState.currentOutfitId || undefined,
            userImageUrl: virtualTryOnState.userFullBodyImageUrl,
            processingTime: result.processingTime,
            confidence: result.confidence,
            prompt: result.metadata.prompt,
            styleInstructions: result.metadata.styleInstructions,
            itemsUsed: result.metadata.itemsUsed,
          }
        );

        if (saveResult.success) {
          console.log('✅ Virtual Try-On saved successfully!', {
            storageUrl: saveResult.storageUrl,
            databaseId: saveResult.databaseId,
          });
        } else {
          console.error('❌ Failed to save Virtual Try-On:', saveResult.error);
          // Don't fail the whole process - we have the generated image
        }
      } catch (saveError) {
        console.error('❌ Save operation failed:', saveError);
        // Don't fail the whole process
      }

      dispatch(
        completeProcessing({
          generatedImageUrl: result.generatedImageUrl,
          processingTime,
          prompt:
            result.metadata.prompt || 'Virtual try-on generated successfully',
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
  }, [virtualTryOnState, dispatch, processOutfitTryOn, virtualTryOnStorage]);

  const clearProcessingError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Test storage function
  const testStorage = useCallback(async () => {
    console.log('🧪 Testing storage upload...');
    const result = await virtualTryOnStorage.test();
    console.log('🧪 Test result:', result);
    return result;
  }, [virtualTryOnStorage]);

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
    testStorage,

    // Storage state
    isSaving: virtualTryOnStorage.isSaving,
    lastSaveResult: virtualTryOnStorage.lastResult,
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
