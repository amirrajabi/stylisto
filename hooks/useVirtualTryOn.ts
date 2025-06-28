import { ClothingItem } from '@/types/wardrobe';
import { useState } from 'react';
import {
  useVirtualTryOn as useVirtualTryOnLib,
  VirtualTryOnResult,
} from '../lib/virtualTryOn';

export const useVirtualTryOn = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VirtualTryOnResult | null>(null);

  const { processOutfitTryOn } = useVirtualTryOnLib();

  const startVirtualTryOn = async (
    outfitId: string,
    userImage: string,
    clothingItems: ClothingItem[]
  ) => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      console.log('🚀 Starting virtual try-on with collage approach');
      console.log('👤 User image provided');
      console.log('👗 Clothing items:', clothingItems.length);

      // Update progress
      setProgress(20);

      // Process with the collage approach - no need for AI analysis
      const tryOnResult = await processOutfitTryOn(
        outfitId,
        userImage,
        clothingItems,
        state => {
          // Map workflow state to progress percentage
          const progressMap: Record<string, number> = {
            input_analysis: 30,
            ai_styling: 40,
            api_transmission: 60,
            output_delivery: 90,
            completed: 100,
            error: 0,
          };

          const mappedProgress = progressMap[state.phase] || 50;
          setProgress(mappedProgress);

          console.log(
            `📊 Virtual try-on progress: ${state.phase} (${mappedProgress}%)`
          );
        }
      );

      setResult(tryOnResult);
      setProgress(100);

      console.log('✅ Virtual try-on completed successfully');
      return tryOnResult;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Virtual try-on failed';
      setError(errorMessage);
      setProgress(0);
      console.error('❌ Virtual try-on error:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const resetVirtualTryOn = () => {
    setResult(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  };

  return {
    startVirtualTryOn,
    resetVirtualTryOn,
    isProcessing,
    progress,
    error,
    result,
  };
};
