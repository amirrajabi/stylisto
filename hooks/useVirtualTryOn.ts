import { useCallback } from 'react';
import {
  TryOnWorkflowState,
  VirtualTryOnResult,
  virtualTryOnService,
} from '../lib/virtualTryOn';
import { ClothingItem } from '../types/wardrobe';

export interface UseVirtualTryOnReturn {
  processOutfitTryOn: (
    outfitId: string,
    userImageUrl: string,
    clothingItems: ClothingItem[],
    onProgress?: (state: TryOnWorkflowState) => void
  ) => Promise<VirtualTryOnResult>;
}

export const useVirtualTryOn = (): UseVirtualTryOnReturn => {
  const processOutfitTryOn = useCallback(
    async (
      outfitId: string,
      userImageUrl: string,
      clothingItems: ClothingItem[],
      onProgress?: (state: TryOnWorkflowState) => void
    ): Promise<VirtualTryOnResult> => {
      console.log('🎯 Virtual Try-On Hook: Starting process', {
        outfitId,
        userImageUrl,
        itemCount: clothingItems.length,
      });

      try {
        const result = await virtualTryOnService.processVirtualTryOn(
          {
            initImage: userImageUrl,
            referenceImages: clothingItems.map(item => item.imageUrl),
            prompt: `Virtual try-on of ${clothingItems.map(item => item.name).join(', ')}`,
            styleInstructions:
              'Professional fashion styling with natural fit and studio lighting',
            userId: 'current-user',
            outfitId,
          },
          onProgress
        );

        console.log('✅ Virtual Try-On Hook: Process completed', {
          outfitId,
          generatedImageUrl: result.generatedImageUrl,
          confidence: result.confidence,
        });

        return result;
      } catch (error) {
        console.error('❌ Virtual Try-On Hook: Process failed', error);
        throw error;
      }
    },
    []
  );

  return {
    processOutfitTryOn,
  };
};
