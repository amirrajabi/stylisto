import { useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { useVisionAI, ClothingAnalysisResult } from '../lib/visionAI';
import { ClothingCategory, Season, Occasion } from '../types/wardrobe';

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

  const analyzeImage = useCallback(async (imageUri: string) => {
    setState({ loading: true, error: null, result: null });
    
    try {
      // For web environment, use the API endpoint
      if (Platform.OS === 'web') {
        // Convert image to base64 if it's a file URI
        let imageData = imageUri;
        if (!imageUri.startsWith('data:')) {
          const response = await fetch(imageUri);
          const blob = await response.blob();
          
          const reader = new FileReader();
          imageData = await new Promise<string>((resolve) => {
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
        return data.data;
      } else {
        // For native environment, use the service directly
        const result = await analyzeClothing(imageUri);
        setState({ loading: false, error: null, result });
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage, result: null });
      
      // Return fallback result
      return getFallbackResult();
    }
  }, [analyzeClothing]);

  const analyzeMultipleImages = useCallback(async (
    imageUris: string[],
    onProgress?: (completed: number, total: number) => void
  ) => {
    setState({ loading: true, error: null, result: null });
    
    try {
      // For web environment, analyze one by one using the API endpoint
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
        // For native environment, use batch analysis
        const results = await analyzeBatch(imageUris, onProgress);
        setState({ loading: false, error: null, result: results[0] || null });
        return results;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({ loading: false, error: errorMessage, result: null });
      
      // Return fallback results
      return imageUris.map(() => getFallbackResult());
    }
  }, [analyzeImage, analyzeBatch]);

  return {
    ...state,
    analyzeImage,
    analyzeMultipleImages,
  };
};

// Helper function to get fallback result
const getFallbackResult = (): ClothingAnalysisResult => {
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
};