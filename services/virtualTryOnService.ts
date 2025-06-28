import { supabase } from '../lib/supabase';

export interface VirtualTryOnResult {
  id: string;
  user_id: string;
  outfit_id: string;
  outfit_name: string;
  user_image_url: string;
  generated_image_url: string;
  storage_path: string;
  processing_time_ms: number;
  confidence_score: number;
  prompt_used: string | null;
  style_instructions: string | null;
  items_used: string[];
  created_at: string;
  updated_at: string;
}

export class VirtualTryOnService {
  static async getUserResults(userId: string): Promise<VirtualTryOnResult[]> {
    try {
      const { data, error } = await supabase
        .from('virtual_try_on_results')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching virtual try-on results:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('💥 Error in getUserResults:', error);
      return [];
    }
  }

  static async getOutfitResults(
    userId: string,
    outfitId: string
  ): Promise<VirtualTryOnResult[]> {
    try {
      const { data, error } = await supabase
        .from('virtual_try_on_results')
        .select('*')
        .eq('user_id', userId)
        .eq('outfit_id', outfitId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching outfit try-on results:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('💥 Error in getOutfitResults:', error);
      return [];
    }
  }

  static async getLatestResult(
    userId: string,
    outfitId: string
  ): Promise<VirtualTryOnResult | null> {
    try {
      const { data, error } = await supabase
        .from('virtual_try_on_results')
        .select('*')
        .eq('user_id', userId)
        .eq('outfit_id', outfitId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('❌ Error fetching latest try-on result:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('💥 Error in getLatestResult:', error);
      return null;
    }
  }

  static async deleteResult(
    userId: string,
    resultId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('virtual_try_on_results')
        .delete()
        .eq('user_id', userId)
        .eq('id', resultId);

      if (error) {
        console.error('❌ Error deleting virtual try-on result:', error);
        return false;
      }

      console.log('✅ Virtual try-on result deleted successfully');
      return true;
    } catch (error) {
      console.error('💥 Error in deleteResult:', error);
      return false;
    }
  }

  static async updateResult(
    userId: string,
    resultId: string,
    updates: Partial<VirtualTryOnResult>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('virtual_try_on_results')
        .update(updates)
        .eq('user_id', userId)
        .eq('id', resultId);

      if (error) {
        console.error('❌ Error updating virtual try-on result:', error);
        return false;
      }

      console.log('✅ Virtual try-on result updated successfully');
      return true;
    } catch (error) {
      console.error('💥 Error in updateResult:', error);
      return false;
    }
  }

  static async getResultsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<VirtualTryOnResult[]> {
    try {
      const { data, error } = await supabase
        .from('virtual_try_on_results')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching results by date range:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('💥 Error in getResultsByDateRange:', error);
      return [];
    }
  }
}

interface VirtualTryOnFlaskRequest {
  userImage: string; // Base64 encoded user image
  clothingImages: string[]; // Array of base64 encoded clothing images
  prompt?: string; // Optional styling instructions
  mode?: 'single' | 'multiple'; // Single item or multiple items
}

interface VirtualTryOnFlaskResponse {
  success: boolean;
  resultImage?: string; // Base64 encoded result
  error?: string;
  processingTime?: number;
  debugInfo?: {
    receivedImages: number;
    processedImages: number;
    modelUsed: string;
  };
}

export class VirtualTryOnFlaskService {
  private static instance: VirtualTryOnFlaskService;

  // Flask backend URL (configure based on your environment)
  private readonly FLASK_BASE_URL =
    process.env.EXPO_PUBLIC_FLASK_API_URL || 'http://localhost:5000';
  private readonly FLASK_TIMEOUT = 60000; // 60 seconds

  static getInstance(): VirtualTryOnFlaskService {
    if (!VirtualTryOnFlaskService.instance) {
      VirtualTryOnFlaskService.instance = new VirtualTryOnFlaskService();
    }
    return VirtualTryOnFlaskService.instance;
  }

  private constructor() {
    console.log('🔥 Flask Virtual Try-On Service initialized');
    console.log('🌐 Flask API URL:', this.FLASK_BASE_URL);
  }

  /**
   * Process virtual try-on with Flask backend
   */
  async processVirtualTryOn(
    request: VirtualTryOnFlaskRequest
  ): Promise<VirtualTryOnFlaskResponse> {
    console.log('🚀 Sending virtual try-on request to Flask backend');
    console.log('📊 Request details:', {
      userImageSize: request.userImage.length,
      clothingCount: request.clothingImages.length,
      mode: request.mode || 'multiple',
    });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.FLASK_TIMEOUT
      );

      const response = await fetch(`${this.FLASK_BASE_URL}/api/virtual-tryon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_image: request.userImage,
          clothing_images: request.clothingImages,
          prompt: request.prompt || '',
          mode: request.mode || 'multiple',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Flask API error:', response.status, errorText);
        return {
          success: false,
          error: `Flask API error: ${response.status} ${errorText}`,
        };
      }

      const result = await response.json();
      console.log('✅ Flask API response received:', {
        success: result.success,
        hasResultImage: !!result.result_image,
        processingTime: result.processing_time,
      });

      return {
        success: result.success,
        resultImage: result.result_image,
        error: result.error,
        processingTime: result.processing_time,
        debugInfo: result.debug_info,
      };
    } catch (error) {
      console.error('❌ Error calling Flask API:', error);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            success: false,
            error: 'Request timeout - Flask server took too long to respond',
          };
        }

        return {
          success: false,
          error: `Network error: ${error.message}`,
        };
      }

      return {
        success: false,
        error: 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if Flask backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.FLASK_BASE_URL}/health`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Flask backend health check:', data);
        return data.status === 'healthy';
      }

      return false;
    } catch (error) {
      console.error('❌ Flask backend not reachable:', error);
      return false;
    }
  }

  /**
   * Convert image URLs to base64 for Flask API
   */
  async prepareImagesForFlask(imageUrls: string[]): Promise<string[]> {
    console.log(`🖼️ Preparing ${imageUrls.length} images for Flask API`);

    const base64Images = await Promise.all(
      imageUrls.map(async url => {
        try {
          if (url.startsWith('data:')) {
            // Already base64
            return url.split(',')[1];
          }

          if (url.startsWith('http')) {
            // Fetch and convert to base64
            const response = await fetch(url);
            const blob = await response.blob();
            return await this.blobToBase64(blob);
          }

          // For local file:// URLs, we'd need platform-specific handling
          console.warn('⚠️ Unsupported URL format:', url.substring(0, 20));
          return '';
        } catch (error) {
          console.error('❌ Error converting image:', error);
          return '';
        }
      })
    );

    return base64Images.filter(img => img.length > 0);
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Create a mock Flask server response for development
   */
  async createMockResponse(
    request: VirtualTryOnFlaskRequest
  ): Promise<VirtualTryOnFlaskResponse> {
    console.log('🎭 Creating mock Flask response for development');

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a simple SVG as mock result
    const mockSvg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#E5E7EB"/>
        <text x="50%" y="30%" text-anchor="middle" font-family="Arial" font-size="48" fill="#4B5563">
          Flask Mock Result
        </text>
        <text x="50%" y="40%" text-anchor="middle" font-family="Arial" font-size="32" fill="#6B7280">
          Virtual Try-On
        </text>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#6B7280">
          ${request.clothingImages.length} items processed
        </text>
        <text x="50%" y="60%" text-anchor="middle" font-family="Arial" font-size="20" fill="#9CA3AF">
          Mode: ${request.mode || 'multiple'}
        </text>
        <text x="50%" y="75%" text-anchor="middle" font-family="Arial" font-size="16" fill="#9CA3AF">
          Connect to Flask backend for real results
        </text>
      </svg>
    `;

    const base64 = Buffer.from(mockSvg).toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64}`;

    return {
      success: true,
      resultImage: dataUri,
      processingTime: 2000,
      debugInfo: {
        receivedImages: request.clothingImages.length + 1,
        processedImages: request.clothingImages.length,
        modelUsed: 'mock',
      },
    };
  }
}

export const virtualTryOnFlask = VirtualTryOnFlaskService.getInstance();
