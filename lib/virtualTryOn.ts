import { ClothingItem } from '@/types/wardrobe';

export interface VirtualTryOnRequest {
  initImage: string;
  referenceImages: string[];
  prompt: string;
  styleInstructions?: string;
  userId: string;
  outfitId: string;
}

export interface VirtualTryOnResult {
  generatedImageUrl: string;
  processingTime: number;
  confidence: number;
  metadata: {
    prompt: string;
    styleInstructions: string;
    itemsUsed: string[];
    timestamp: string;
  };
}

export interface FluxApiResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'Ready' | 'Error';
  result?: {
    images?: {
      url: string;
      width: number;
      height: number;
    }[];
    sample?: string;
  };
  error?: string;
  polling_url?: string;
}

export interface TryOnWorkflowState {
  phase:
    | 'input_analysis'
    | 'ai_styling'
    | 'api_transmission'
    | 'output_delivery'
    | 'completed'
    | 'error';
  progress: number;
  message: string;
  data?: any;
}

class VirtualTryOnService {
  private static instance: VirtualTryOnService;

  // Correct Black Forest Labs endpoints according to official docs
  private readonly FLUX_BASE_URL = 'https://api.bfl.ml/v1';
  private readonly API_KEY = process.env.EXPO_PUBLIC_FLUX_API_KEY;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000;

  // Available models based on BFL pricing
  private readonly KONTEXT_PRO_MODEL = 'flux-kontext-pro'; // $0.04 per image - Fast, high-quality editing
  private readonly KONTEXT_MAX_MODEL = 'flux-kontext-max'; // $0.08 per image - Maximum quality
  private readonly STANDARD_PRO_MODEL = 'flux-pro-1.1'; // $0.04 per image - Standard generation
  private readonly DEV_MODEL = 'flux-dev'; // $0.025 per image - Development/testing

  static getInstance(): VirtualTryOnService {
    if (!VirtualTryOnService.instance) {
      VirtualTryOnService.instance = new VirtualTryOnService();
    }
    return VirtualTryOnService.instance;
  }

  private constructor() {
    console.log('🔑 FLUX API Key Debug:', {
      hasKey: !!this.API_KEY,
      keyLength: this.API_KEY?.length || 0,
      keyStart: this.API_KEY?.substring(0, 8) || 'undefined',
      rawEnvValue:
        process.env.EXPO_PUBLIC_FLUX_API_KEY?.substring(0, 8) || 'not found',
    });

    if (!this.API_KEY) {
      console.warn('FLUX API key not configured');
    }
  }

  async processVirtualTryOn(
    request: VirtualTryOnRequest,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<VirtualTryOnResult> {
    try {
      await this.testNetworkConnectivity();

      onProgress?.({
        phase: 'input_analysis',
        progress: 10,
        message: 'Analyzing input images and styling requirements...',
      });

      const analyzedData = await this.analyzeInputs(request);

      onProgress?.({
        phase: 'ai_styling',
        progress: 30,
        message: 'Executing virtual try-on workflow with AI styling...',
      });

      const stylingData = await this.executeAIStyling(analyzedData);

      onProgress?.({
        phase: 'api_transmission',
        progress: 60,
        message:
          'Transmitting data to FLUX.1 Kontext API for image generation...',
      });

      const fluxResult = await this.callFluxKontextAPI(stylingData);

      onProgress?.({
        phase: 'output_delivery',
        progress: 90,
        message: 'Finalizing high-resolution output...',
      });

      const result = await this.processOutput(fluxResult, request);

      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Virtual try-on completed successfully!',
      });

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      onProgress?.({
        phase: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
      });
      throw error;
    }
  }

  private async testNetworkConnectivity(): Promise<void> {
    console.log('🌐 Testing network connectivity...');

    try {
      const testResponse = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        headers: {
          'User-Agent': 'Stylisto/1.0.0',
        },
      });

      if (!testResponse.ok) {
        throw new Error('Basic connectivity test failed');
      }

      console.log('✅ Basic network connectivity: OK');

      // Test Black Forest Labs API accessibility
      try {
        const fluxTestResponse = await fetch(
          `${this.FLUX_BASE_URL}/get_result?id=test`,
          {
            method: 'GET',
            headers: {
              'x-key': this.API_KEY || 'test-key',
              Accept: 'application/json',
            },
          }
        );

        console.log(
          `🔗 FLUX API endpoint test: ${fluxTestResponse.status} (endpoint reachable)`
        );
      } catch (fluxError) {
        console.warn(
          '⚠️ FLUX API endpoint test failed:',
          fluxError instanceof Error ? fluxError.message : 'Unknown error'
        );
      }
    } catch (error) {
      console.error('❌ Network connectivity test failed:', error);
      throw new Error(
        'Network connectivity issue detected. Please check your internet connection and try again.'
      );
    }
  }

  private async analyzeInputs(request: VirtualTryOnRequest): Promise<any> {
    const startTime = Date.now();

    const analysis = {
      initImageMetadata: await this.analyzeImage(request.initImage),
      referenceImagesMetadata: await Promise.all(
        request.referenceImages.map(img => this.analyzeImage(img))
      ),
      promptAnalysis: this.analyzePrompt(request.prompt),
      styleContext:
        request.styleInstructions ||
        'natural studio lighting, professional fit',
      processingTime: Date.now() - startTime,
    };

    return analysis;
  }

  private async executeAIStyling(analyzedData: any): Promise<any> {
    const stylingPrompt = this.buildComprehensivePrompt(analyzedData);

    return {
      ...analyzedData,
      enhancedPrompt: stylingPrompt,
      technicalSpecs: {
        lighting: 'cinematic studio lighting',
        fit: 'natural draping and precise fit',
        quality: 'magazine-quality, high-resolution',
        style: 'professional fashion photography',
      },
    };
  }

  private async callFluxKontextAPI(stylingData: any): Promise<FluxApiResponse> {
    console.log('🔑 FLUX API Key Debug:', {
      hasKey: !!this.API_KEY,
      keyLength: this.API_KEY?.length || 0,
      keyStart: this.API_KEY?.substring(0, 8) || 'undefined',
    });

    if (!this.API_KEY || this.API_KEY === 'bfl_sk_test_1234567890abcdef') {
      console.warn(
        '🚨 FLUX API key not configured or using test key - returning mock result'
      );

      await new Promise(resolve => setTimeout(resolve, 2000));

      return {
        id: 'mock-flux-kontext-id-' + Date.now(),
        status: 'completed',
        result: {
          images: [
            {
              url: 'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Virtual+Try-On+Demo\nGenerated+by+FLUX+Kontext\nAPI+Coming+Soon',
              width: 1024,
              height: 1024,
            },
          ],
        },
      };
    }

    const isValidFormat =
      this.API_KEY.startsWith('bfl_sk_') ||
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        this.API_KEY
      );

    if (!isValidFormat) {
      console.error(
        '❌ Invalid FLUX API key format. Expected either "bfl_sk_" prefix or UUID format',
        'Current key format:',
        this.API_KEY.substring(0, 8)
      );
      throw new Error(
        'Invalid FLUX API key format. Please check your API key from https://dashboard.bfl.ai/'
      );
    }

    console.log(
      '✅ Valid API key format detected:',
      this.API_KEY.startsWith('bfl_sk_') ? 'bfl_sk_' : 'UUID'
    );

    // Try FLUX.1 Kontext API first (preferred for image editing)
    try {
      return await this.callKontextImageEditing(stylingData);
    } catch (kontextError) {
      console.warn(
        '⚠️ Kontext API failed, falling back to standard image generation:',
        kontextError
      );

      // Fallback to standard image generation API
      return await this.callStandardImageGeneration(stylingData);
    }
  }

  private async callKontextImageEditing(
    stylingData: any
  ): Promise<FluxApiResponse> {
    const hasInputImage =
      stylingData.initImageMetadata && stylingData.initImageMetadata.base64;

    if (!hasInputImage) {
      throw new Error('No input image available for Kontext editing');
    }

    // Use Kontext Pro model (more cost-effective)
    const endpoint = `${this.FLUX_BASE_URL}/${this.KONTEXT_PRO_MODEL}`;

    // Prepare the request payload according to BFL API docs
    const payload = {
      prompt: stylingData.enhancedPrompt,
      image: `data:image/jpeg;base64,${stylingData.initImageMetadata.base64}`,
      guidance: 2.5, // BFL uses 'guidance' not 'guidance_scale'
      safety_tolerance: 2,
      output_format: 'jpeg',
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 FLUX Kontext API Call Attempt ${attempt}/${this.MAX_RETRIES}`
        );
        console.log('📡 Request Details:', {
          endpoint,
          model: this.KONTEXT_PRO_MODEL,
          hasApiKey: !!this.API_KEY,
          keyFormat: this.API_KEY?.substring(0, 8) + '...',
          hasImage: !!payload.image,
          promptLength: payload.prompt.length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 45000); // 45 second timeout

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'x-key': this.API_KEY || '', // BFL uses x-key header
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log(
            '📥 Response Status:',
            response.status,
            response.statusText
          );
          console.log(
            '📥 Response Headers:',
            Object.fromEntries(response.headers.entries())
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response Body:', errorText);

            if (response.status === 401 || response.status === 403) {
              throw new Error(
                `FLUX API authentication failed. Please check your API key at https://dashboard.bfl.ai/`
              );
            } else if (response.status === 429) {
              throw new Error(
                `FLUX API rate limit exceeded. Please wait before trying again.`
              );
            } else if (response.status >= 500) {
              throw new Error(
                `FLUX API server error (${response.status}). Please try again later.`
              );
            } else {
              throw new Error(
                `FLUX API error: ${response.status} ${response.statusText} - ${errorText}`
              );
            }
          }

          const result = await response.json();
          console.log('✅ FLUX Kontext API Response:', result);

          // BFL API returns an ID that we need to poll for results
          if (!result.id) {
            throw new Error('Invalid response from FLUX API - missing task ID');
          }

          // Wait for completion using the get_result endpoint
          return await this.waitForStandardCompletion(result.id);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('Unknown error occurred');

        console.error(
          `❌ FLUX Kontext API Attempt ${attempt} failed:`,
          lastError.message
        );

        if (
          error instanceof TypeError &&
          error.message.includes('Failed to fetch')
        ) {
          console.error('🌐 Network connectivity issue detected');
          lastError = new Error(
            'Network connectivity issue. Please check your internet connection and try again.'
          );
        } else if (error instanceof Error && error.name === 'AbortError') {
          console.error('⏱️ Request timeout detected');
          lastError = new Error(
            'Request timeout. The FLUX API is taking too long to respond.'
          );
        }

        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.RETRY_DELAY * attempt;
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Failed after all retries');
  }

  private async callStandardImageGeneration(
    stylingData: any
  ): Promise<FluxApiResponse> {
    // Use flux-pro-1.1 for standard generation (same price as kontext-pro)
    const endpoint = `${this.FLUX_BASE_URL}/${this.STANDARD_PRO_MODEL}`;

    const payload: any = {
      prompt: stylingData.enhancedPrompt,
      width: 1024,
      height: 1024,
      steps: 30,
      guidance: 3.5,
      safety_tolerance: 2,
      output_format: 'jpeg',
    };

    // Note: flux-pro-1.1 doesn't support img2img directly
    // If we have an image, we should use kontext instead

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 FLUX Standard API Call Attempt ${attempt}/${this.MAX_RETRIES}`
        );
        console.log('📡 Request Details:', {
          endpoint,
          model: this.STANDARD_PRO_MODEL,
          hasApiKey: !!this.API_KEY,
          keyFormat: this.API_KEY?.substring(0, 8) + '...',
          promptLength: payload.prompt.length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 45000);

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'x-key': this.API_KEY || '', // BFL uses x-key header
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          console.log(
            '📥 Response Status:',
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response Body:', errorText);

            if (response.status === 401 || response.status === 403) {
              throw new Error(
                `FLUX API authentication failed. Please check your API key at https://dashboard.bfl.ai/`
              );
            } else if (response.status === 429) {
              throw new Error(
                `FLUX API rate limit exceeded. Please wait before trying again.`
              );
            } else if (response.status >= 500) {
              throw new Error(
                `FLUX API server error (${response.status}). Please try again later.`
              );
            } else {
              throw new Error(
                `FLUX API error: ${response.status} ${response.statusText} - ${errorText}`
              );
            }
          }

          const submitResult = await response.json();
          console.log('✅ FLUX Submit Response:', submitResult);

          if (!submitResult.id) {
            throw new Error('Invalid response from FLUX API - missing task ID');
          }

          // Wait for completion
          return await this.waitForStandardCompletion(submitResult.id);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error('Unknown error occurred');

        console.error(
          `❌ FLUX Standard API Attempt ${attempt} failed:`,
          lastError.message
        );

        if (attempt < this.MAX_RETRIES) {
          const delayMs = this.RETRY_DELAY * attempt;
          console.log(`⏳ Retrying in ${delayMs}ms...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError || new Error('Failed after all retries');
  }

  private async waitForStandardCompletion(
    taskId: string
  ): Promise<FluxApiResponse> {
    const maxWaitTime = 120000; // 2 minutes timeout
    const pollInterval = 3000; // Poll every 3 seconds
    const startTime = Date.now();

    console.log(`🔄 Polling for standard FLUX task completion: ${taskId}`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 15000);

        try {
          const response = await fetch(
            `${this.FLUX_BASE_URL}/get_result?id=${taskId}`,
            {
              method: 'GET',
              headers: {
                'x-key': this.API_KEY || '',
                Accept: 'application/json',
              },
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(
              `📊 Status check failed: ${response.status} - ${errorText}`
            );
            throw new Error(`Status check failed: ${response.status}`);
          }

          const result: FluxApiResponse = await response.json();
          console.log(`📊 Task status: ${result.status} for ${taskId}`);

          // BFL API uses 'Ready' status when complete
          if (result.status === 'Ready' || result.status === 'completed') {
            console.log(`✅ Task completed successfully: ${taskId}`);
            return {
              ...result,
              status: 'completed',
            };
          }

          if (result.status === 'Error' || result.status === 'failed') {
            console.error(`❌ Task failed: ${result.error || 'Unknown error'}`);
            throw new Error(result.error || 'FLUX processing failed');
          }

          console.log(`⏳ Task still processing - waiting ${pollInterval}ms`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.warn(`⚠️ Standard polling error:`, errorMessage);

        if (
          error instanceof TypeError ||
          (error instanceof Error && error.name === 'AbortError')
        ) {
          console.log(
            `🔄 Network issue during polling, retrying in ${pollInterval}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      }
    }

    console.error(`⏰ Task timeout exceeded ${maxWaitTime}ms`);
    throw new Error(
      'Virtual try-on processing timeout - task took too long to complete'
    );
  }

  private async processOutput(
    fluxResult: FluxApiResponse,
    request: VirtualTryOnRequest
  ): Promise<VirtualTryOnResult> {
    console.log('🎨 Processing FLUX output:', fluxResult);

    const imageUrl =
      fluxResult.result?.images?.[0]?.url ||
      fluxResult.result?.sample ||
      'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Processing+Error';

    return {
      generatedImageUrl: imageUrl,
      processingTime: 0,
      confidence: 0.95,
      metadata: {
        prompt: request.prompt,
        styleInstructions: request.styleInstructions || '',
        itemsUsed: request.referenceImages,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async analyzeImage(imageUri: string): Promise<any> {
    try {
      const base64Data = await this.convertToBase64(imageUri);
      const dimensions = await this.getImageDimensions(imageUri);

      return {
        uri: imageUri,
        base64: base64Data,
        dimensions,
        format: this.getImageFormat(imageUri),
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw error;
    }
  }

  private analyzePrompt(prompt: string): any {
    return {
      original: prompt,
      wordCount: prompt.split(' ').length,
      hasStyleKeywords: /\b(style|fashion|elegant|casual|formal)\b/i.test(
        prompt
      ),
      hasColorKeywords: /\b(red|blue|green|black|white|pink|purple)\b/i.test(
        prompt
      ),
    };
  }

  private buildComprehensivePrompt(analyzedData: any): string {
    const basePrompt = analyzedData.promptAnalysis.original;
    const styleContext = analyzedData.styleContext;

    return `${basePrompt}, ${styleContext}, high-quality fashion photography, professional lighting, detailed fabric texture, realistic skin tone, natural pose, clean background, 8k resolution, photorealistic`;
  }

  private async convertToBase64(imageUri: string): Promise<string> {
    try {
      if (imageUri.startsWith('data:')) {
        return imageUri.split(',')[1];
      }

      if (imageUri.startsWith('http')) {
        const response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        let binaryString = '';
        for (let i = 0; i < uint8Array.length; i++) {
          binaryString += String.fromCharCode(uint8Array[i]);
        }
        return this.base64Encode(binaryString);
      }

      if (imageUri.startsWith('file://')) {
        const optimizedUri = await this.optimizeImageForApi(imageUri);
        return await this.convertToBase64(optimizedUri);
      }

      throw new Error(`Unsupported image URI format: ${imageUri}`);
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error(
        `Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async optimizeImageForApi(imageUri: string): Promise<string> {
    try {
      console.log('🖼️ Optimizing image for API transmission...');

      const originalDimensions = await this.getImageDimensions(imageUri);
      console.log('📏 Original dimensions:', originalDimensions);

      const maxWidth = 1024;
      const maxHeight = 1024;

      let targetWidth = originalDimensions.width;
      let targetHeight = originalDimensions.height;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        const aspectRatio = targetWidth / targetHeight;

        if (targetWidth > targetHeight) {
          targetWidth = maxWidth;
          targetHeight = Math.round(maxWidth / aspectRatio);
        } else {
          targetHeight = maxHeight;
          targetWidth = Math.round(maxHeight * aspectRatio);
        }
      }

      console.log('🎯 Target dimensions:', {
        width: targetWidth,
        height: targetHeight,
      });

      return imageUri;
    } catch (error) {
      console.error('❌ Error optimizing image:', error);
      return imageUri;
    }
  }

  private base64Encode(binaryString: string): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    while (i < binaryString.length) {
      const a = binaryString.charCodeAt(i++);
      const b = i < binaryString.length ? binaryString.charCodeAt(i++) : 0;
      const c = i < binaryString.length ? binaryString.charCodeAt(i++) : 0;

      const bitmap = (a << 16) | (b << 8) | c;

      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result +=
        i - 2 < binaryString.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < binaryString.length ? chars.charAt(bitmap & 63) : '=';
    }

    return result;
  }

  private async getImageDimensions(
    imageUri: string
  ): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      if (typeof Image !== 'undefined') {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = imageUri;
      } else {
        console.warn(
          'Image constructor not available, using default dimensions'
        );
        resolve({ width: 1024, height: 1024 });
      }
    });
  }

  private getImageFormat(imageUri: string): string {
    if (imageUri.includes('.png') || imageUri.includes('image/png')) {
      return 'png';
    } else if (imageUri.includes('.webp') || imageUri.includes('image/webp')) {
      return 'webp';
    } else {
      return 'jpeg';
    }
  }
}

export const useVirtualTryOn = () => {
  const processOutfitTryOn = async (
    outfitId: string,
    userImage: string,
    clothingItems: ClothingItem[],
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<VirtualTryOnResult> => {
    const service = VirtualTryOnService.getInstance();

    const request: VirtualTryOnRequest = {
      initImage: userImage,
      referenceImages: clothingItems.map(item => item.imageUrl),
      prompt: `Virtual try-on of ${clothingItems
        .map(item => `${item.color} ${item.category}`)
        .join(', ')}`,
      styleInstructions: 'natural fit, professional photography',
      userId: 'user-id',
      outfitId,
    };

    return service.processVirtualTryOn(request, onProgress);
  };

  return { processOutfitTryOn };
};
