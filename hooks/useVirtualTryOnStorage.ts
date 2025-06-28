import { useCallback, useState } from 'react';
import {
  saveVirtualTryOnResult,
  testStorageUpload,
  VirtualTryOnSaveResult,
} from '../lib/virtualTryOnStorage';

/**
 * Hook for virtual try-on storage operations
 * Simplified version for reliable operations
 */
export const useVirtualTryOnStorage = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastResult, setLastResult] = useState<VirtualTryOnSaveResult | null>(
    null
  );

  const save = useCallback(
    async (
      generatedImageUrl: string,
      outfitName: string,
      options?: {
        outfitId?: string;
        userImageUrl?: string;
        processingTime?: number;
        confidence?: number;
        prompt?: string;
        styleInstructions?: string;
        itemsUsed?: string[];
      }
    ): Promise<VirtualTryOnSaveResult> => {
      setIsSaving(true);
      try {
        const result = await saveVirtualTryOnResult(
          generatedImageUrl,
          outfitName,
          options
        );
        setLastResult(result);
        return result;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const test = useCallback(async (): Promise<VirtualTryOnSaveResult> => {
    setIsSaving(true);
    try {
      const result = await testStorageUpload();
      setLastResult(result);
      return result;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    save,
    test,
    isSaving,
    lastResult,
  };
};
