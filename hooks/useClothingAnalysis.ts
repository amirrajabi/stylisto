import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { ClothingAnalysisResult, useVisionAI } from '../lib/visionAI';
import { ClothingCategory, Occasion, Season } from '../types/wardrobe';

export interface AnalysisState {
  loading: boolean;
  error: string | null;
  result: ClothingAnalysisResult | null;
}

export const useClothingAnalysis = () => {
  const { analyzeClothing, analyzeBatch } = useVisionAI();
  const [state, setState] = useState<AnalysisState>({
    loading: false,
    error: null,
    result: null,
  });

  const analyzeImage = useCallback(
    async (imageUri: string) => {
      setState({ loading: true, error: null, result: null });

      try {
        if (Platform.OS === 'web') {
          let imageData = imageUri;
          if (!imageUri.startsWith('data:')) {
            const response = await fetch(imageUri);
            const blob = await response.blob();

            const reader = new FileReader();
            imageData = await new Promise<string>(resolve => {
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
          }

          const response = await fetch('/api/vision/analyze', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageData }),
          });

          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }

          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          setState({ loading: false, error: null, result: data.data });

          await recordAnalysisResult(imageUri, data.data);

          return data.data;
        } else {
          const result = await analyzeClothing(imageUri);
          setState({ loading: false, error: null, result });

          await recordAnalysisResult(imageUri, result);

          return result;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState({ loading: false, error: errorMessage, result: null });

        return getFallbackResult();
      }
    },
    [analyzeClothing]
  );

  const analyzeMultipleImages = useCallback(
    async (
      imageUris: string[],
      onProgress?: (completed: number, total: number) => void
    ) => {
      setState({ loading: true, error: null, result: null });

      try {
        if (Platform.OS === 'web') {
          const results: ClothingAnalysisResult[] = [];

          for (let i = 0; i < imageUris.length; i++) {
            try {
              const result = await analyzeImage(imageUris[i]);
              results.push(result);
              onProgress?.(i + 1, imageUris.length);
            } catch (error) {
              console.error(`Error analyzing image ${i + 1}:`, error);
              results.push(getFallbackResult());
            }
          }

          setState({ loading: false, error: null, result: results[0] || null });
          return results;
        } else {
          const results = await analyzeBatch(imageUris, onProgress);
          setState({ loading: false, error: null, result: results[0] || null });

          for (let i = 0; i < imageUris.length; i++) {
            await recordAnalysisResult(imageUris[i], results[i]);
          }

          return results;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        setState({ loading: false, error: errorMessage, result: null });

        return imageUris.map(() => getFallbackResult());
      }
    },
    [analyzeImage, analyzeBatch]
  );

  const recordAnalysisResult = async (
    imageUri: string,
    result: ClothingAnalysisResult
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_feedback').insert({
        user_id: user.id,
        feedback_type: 'item_categorization',
        context_data: {
          image_hash: imageUri.split('/').pop(),
        },
        ai_response: result,
      });
    } catch (error) {
      console.error('Error recording analysis result:', error);
    }
  };

  return {
    ...state,
    analyzeImage,
    analyzeMultipleImages,
  };
};

const getFallbackResult = (): ClothingAnalysisResult => {
  try {
    return {
      category: ClothingCategory.TOPS,
      subcategory: '',
      color: '#000000',
      seasons: [Season.SUMMER, Season.SPRING],
      occasions: [Occasion.CASUAL],
      tags: [],
      confidence: {
        category: 0.5,
        color: 0.5,
        seasons: 0.5,
        occasions: 0.5,
      },
    };
  } catch (error) {
    console.error('Error in getFallbackResult:', error);
    return {
      category: 'tops' as ClothingCategory,
      subcategory: '',
      color: '#000000',
      seasons: ['summer', 'spring'] as Season[],
      occasions: ['casual'] as Occasion[],
      tags: [],
      confidence: {
        category: 0.5,
        color: 0.5,
        seasons: 0.5,
        occasions: 0.5,
      },
    };
  }
};
