import type { ClothingItem } from '../types/wardrobe';

export interface VirtualTryOnRequest {
  initImage: string;
  referenceImages: string[];
  prompt: string;
  styleInstructions?: string;
  userId: string;
  outfitId: string;
  clothingItems?: ClothingItem[];
}

export interface VirtualTryOnResult {
  generatedImageUrl: string;
  collageImageUrl?: string;
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

  private workflowState: TryOnWorkflowState = {
    phase: 'input_analysis',
    progress: 0,
    message: 'Initializing...',
  };

  private logApiCommunication(
    direction: 'REQUEST' | 'RESPONSE',
    data: {
      timestamp?: string;
      endpoint?: string;
      method?: string;
      headers?: Record<string, string>;
      payload?: any;
      status?: number;
      statusText?: string;
      responseData?: any;
      processingTime?: number;
      error?: string;
    }
  ): void {
    const timestamp = data.timestamp || new Date().toISOString();

    if (direction === 'REQUEST') {
      console.log(
        '\n🚀 ═══════════════════════════════════════════════════════════════'
      );
      console.log('📤 AI API REQUEST - VIRTUAL TRY-ON');
      console.log(
        '═══════════════════════════════════════════════════════════════'
      );

      // Request Summary Table
      const requestSummary = {
        'زمان ارسال': timestamp,
        'مقصد API': data.endpoint || 'نامشخص',
        'نوع درخواست': data.method || 'نامشخص',
        'سایز Payload': data.payload
          ? `${JSON.stringify(data.payload).length} bytes`
          : '0 bytes',
        'تعداد Headers': data.headers ? Object.keys(data.headers).length : 0,
      };

      console.table(requestSummary);

      // Headers Table
      if (data.headers) {
        console.log('\n📋 HEADERS ارسالی:');
        const headersTable = Object.entries(data.headers).reduce(
          (acc, [key, value]) => {
            acc[key] =
              key.toLowerCase().includes('key') ||
              key.toLowerCase().includes('token')
                ? `${value.substring(0, 8)}...`
                : value;
            return acc;
          },
          {} as Record<string, string>
        );
        console.table(headersTable);
      }

      // Payload Details
      if (data.payload) {
        console.log('\n📦 PAYLOAD جزئیات:');
        const payloadDetails = {
          Prompt: data.payload.prompt
            ? `${data.payload.prompt.substring(0, 100)}...`
            : 'ندارد',
          'Image Format': data.payload.image ? 'base64 data URI' : 'ندارد',
          'Image Size': data.payload.image
            ? `${data.payload.image.length} chars`
            : '0',
          Guidance: data.payload.guidance || 'پیشفرض',
          'Safety Tolerance': data.payload.safety_tolerance || 'پیشفرض',
          'Output Format': data.payload.output_format || 'پیشفرض',
        };
        console.table(payloadDetails);
      }
    } else if (direction === 'RESPONSE') {
      console.log(
        '\n📥 ═══════════════════════════════════════════════════════════════'
      );
      console.log('📨 AI API RESPONSE - VIRTUAL TRY-ON');
      console.log(
        '═══════════════════════════════════════════════════════════════'
      );

      // Response Summary Table
      const responseSummary = {
        'زمان دریافت': timestamp,
        'وضعیت HTTP': data.status || 'نامشخص',
        'متن وضعیت': data.statusText || 'نامشخص',
        'زمان پردازش': data.processingTime
          ? `${data.processingTime}ms`
          : 'نامشخص',
        'نوع پاسخ': data.responseData ? 'موفق' : data.error ? 'خطا' : 'نامشخص',
        'سایز پاسخ': data.responseData
          ? `${JSON.stringify(data.responseData).length} bytes`
          : '0 bytes',
      };

      console.table(responseSummary);

      // Success Response Details
      if (data.responseData && !data.error) {
        console.log('\n✅ جزئیات پاسخ موفق:');
        const responseDetails = {
          'Request ID': data.responseData.id || 'ندارد',
          Status: data.responseData.status || 'نامشخص',
          'Images Count': data.responseData.result?.images?.length || 0,
          'Image URL': data.responseData.result?.images?.[0]?.url
            ? `${data.responseData.result.images[0].url.substring(0, 50)}...`
            : 'ندارد',
          'Image Dimensions': data.responseData.result?.images?.[0]
            ? `${data.responseData.result.images[0].width}x${data.responseData.result.images[0].height}`
            : 'نامشخص',
          'Polling URL': data.responseData.polling_url ? 'موجود' : 'ندارد',
        };
        console.table(responseDetails);
      }

      // Error Response Details
      if (data.error) {
        console.log('\n❌ جزئیات خطا:');
        const errorDetails = {
          'نوع خطا': data.error.substring(0, 100),
          'HTTP Status': data.status || 'نامشخص',
          'خطای کامل': data.error,
        };
        console.table(errorDetails);
      }

      console.log(
        '═══════════════════════════════════════════════════════════════\n'
      );
    }
  }

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
      platform: this.getPlatform(),
      isWeb: this.isWebEnvironment(),
      isDevelopment: process.env.NODE_ENV === 'development',
    });

    if (!this.API_KEY) {
      console.warn('FLUX API key not configured');
    }

    // Show helpful development message for web environment
    if (this.isWebEnvironment() && process.env.NODE_ENV === 'development') {
      console.info(`
🌐 Development Mode - Web Environment Detected

CORS Limitation: External API calls are blocked by browsers for security.

Recommended Testing Approaches:
1. 📱 Test on mobile device/simulator (no CORS restrictions)
2. 🖥️  Use Expo development build 
3. 🔧 Run backend server for API proxying
4. 📖 Continue with mock data for UI development

Platform: ${this.getPlatform()}
      `);
    }
  }

  private isWebEnvironment(): boolean {
    // Check if we're running in a web browser (Expo web)
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }

  private getPlatform(): string {
    if (typeof window !== 'undefined') {
      if (window.location?.hostname === 'localhost') return 'web-dev';
      return 'web';
    }
    return 'native';
  }

  private isCorsError(error: Error): boolean {
    const corsIndicators = [
      'fetch',
      'cors',
      'cross-origin',
      'access-control-allow-origin',
      'preflight',
      'network error',
    ];

    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    return corsIndicators.some(
      indicator =>
        errorMessage.includes(indicator) || errorName.includes(indicator)
    );
  }

  private async generateMockVirtualTryOnResult(
    request: VirtualTryOnRequest
  ): Promise<FluxApiResponse> {
    console.log('🎭 Generating mock virtual try-on result for development');

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create a data URI instead of relying on external services
    const mockImageDataUri = this.createMockImageDataUri(
      request.referenceImages.length
    );

    return {
      id: 'mock-dev-' + Date.now(),
      status: 'completed',
      result: {
        images: [
          {
            url: mockImageDataUri,
            width: 1024,
            height: 1024,
          },
        ],
      },
    };
  }

  private createMockImageDataUri(itemCount: number): string {
    // Create a simple SVG placeholder that doesn't rely on external services
    const svg = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#4F46E5"/>
        <text x="50%" y="30%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
          Virtual Try-On Demo
        </text>
        <text x="50%" y="40%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32">
          Web Development Mode
        </text>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28">
          CORS Limitation
        </text>
        <text x="50%" y="60%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="28">
          Test on Mobile Device
        </text>
        <text x="50%" y="70%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="32">
          ${itemCount} Items Used
        </text>
        <text x="50%" y="85%" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24">
          🎭 Mock Result - No API Call Made
        </text>
      </svg>
    `;

    // Convert SVG to data URI
    const encodedSvg = encodeURIComponent(svg);
    return `data:image/svg+xml,${encodedSvg}`;
  }

  /**
   * ساخت توضیحات جایگزین برای آیتم‌هایی که AI description ندارند
   */
  private buildFallbackDescription(item: ClothingItem): string {
    const parts: string[] = [];

    // افزودن نام آیتم
    if (item.name) {
      parts.push(item.name);
    }

    // افزودن برند
    if (item.brand) {
      parts.push(`by ${item.brand}`);
    }

    // افزودن دسته‌بندی و زیردسته
    if (item.category) {
      const categoryParts: string[] = [item.category as string];
      if (item.subcategory) {
        categoryParts.push(item.subcategory);
      }
      parts.push(`(${categoryParts.join(' - ')})`);
    }

    // افزودن رنگ
    if (item.color) {
      parts.push(`in ${item.color}`);
    }

    // افزودن سایز
    if (item.size) {
      parts.push(`size ${item.size}`);
    }

    // افزودن مناسبت
    if (item.occasion && item.occasion.length > 0) {
      parts.push(`for ${item.occasion.join('/')}`);
    }

    // افزودن فصل
    if (item.season && item.season.length > 0) {
      parts.push(`suitable for ${item.season.join('/')}`);
    }

    // افزودن تگ‌ها
    if (item.tags && item.tags.length > 0) {
      parts.push(`[${item.tags.join(', ')}]`);
    }

    // افزودن یادداشت‌ها
    if (item.notes) {
      parts.push(`- ${item.notes}`);
    }

    const description = parts.filter(p => p.trim()).join(' ');
    return description || 'Clothing item';
  }

  /**
   * ساخت توضیحات دقیق برای هر آیتم لباس بر اساس اطلاعات موجود
   */
  private generateItemDescriptions(items?: ClothingItem[]): string {
    if (!items || items.length === 0) {
      return 'Item 1: Clothing item';
    }

    // Debug log برای بررسی وجود description_with_ai
    console.log('🔍 Checking clothing items for AI descriptions:');
    let missingAIDescriptions = false;

    items.forEach((item, index) => {
      console.log(`Item ${index + 1} (${item.name}):`);
      console.log(`  - Has description_with_ai: ${!!item.description_with_ai}`);
      console.log(
        `  - AI Description: ${item.description_with_ai || 'NOT AVAILABLE ⚠️'}`
      );
      console.log(
        `  - Other fields: category=${item.category}, color=${item.color}, brand=${item.brand}`
      );

      if (!item.description_with_ai) {
        missingAIDescriptions = true;
      }
    });

    if (missingAIDescriptions) {
      console.warn('\n⚠️ WARNING: Some items are missing AI descriptions!');
      console.warn(
        'For best virtual try-on results, please use "Describe with AI" feature for all clothing items.'
      );
      console.warn(
        'The system will use fallback descriptions, but results may not be as accurate.\n'
      );
    }

    return items
      .map((item, index) => {
        // اول از description_with_ai استفاده می‌کنیم (اولویت بالا)
        if (item.description_with_ai && item.description_with_ai.trim()) {
          console.log(`✅ Using AI description for item ${index + 1}`);
          // استفاده از فرمت [Item X] که در prompt جدید تعریف شده
          return `[Item ${index + 1}]\n${item.description_with_ai}`;
        }

        // اگر description_with_ai موجود نبود، از فیلدهای دیگر استفاده می‌کنیم
        console.log(
          `⚠️ No AI description for item ${index + 1}, using fallback fields`
        );

        // ساخت توضیحات جایگزین با استفاده از فیلدهای موجود
        const fallbackDescription = this.buildFallbackDescription(item);
        return `[Item ${index + 1}]\n${fallbackDescription}`;
      })
      .join('\n');
  }

  async processVirtualTryOn(
    request: VirtualTryOnRequest,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<VirtualTryOnResult> {
    console.log('🚀 Starting Virtual Try-On Process');
    console.log('📋 Request details:', {
      hasUserImage: !!request.initImage,
      clothingItemsCount: request.referenceImages.length,
    });

    let collageUri = ''; // برای ذخیره کولاژ

    try {
      // Update progress
      onProgress?.({
        phase: 'input_analysis',
        progress: 10,
        message: 'Processing images...',
      });

      // Check if we already have a collage (from Native UI)
      // In native environments, the collage is already created and passed as initImage
      const isNativeCollage =
        (typeof document === 'undefined' || typeof window === 'undefined') &&
        request.initImage &&
        request.referenceImages.length > 0;

      if (isNativeCollage) {
        console.log('📱 Using pre-created native collage');
        collageUri = request.initImage;
      } else {
        console.log('🌐 Creating web collage');
        // Web environment - create collage here
        collageUri = await this.createOpenArtStyleCollage(
          request.initImage,
          request.referenceImages
        );
      }

      console.log('✅ Collage ready for processing');

      // 2. Send collage to GPT-4 Vision to create a professional prompt
      console.log('🤖 Generating prompt for virtual try-on...');

      // Update progress
      onProgress?.({
        phase: 'ai_styling',
        progress: 30,
        message:
          'AI is analyzing your outfit and creating styling instructions...',
      });

      let enhancedPrompt: string;

      // استفاده از پرامپت جدید که کاربر تعریف کرده
      const fixedPromptTemplate = `Generate a realistic full-body render of the person on the right wearing the complete outfit from the left images.
Outfit details to apply:

[ITEM_DESCRIPTIONS]

Dress the model accurately with these garments, ensuring natural fabric flow, body fitting, and realistic shadow and lighting. Maintain her original body shape and natural pose. Generate two final images:
– One front view of the model wearing the outfit.
– One back view of the same outfit on the model.
Do not include underwear or original clothing in the final output. The final result should look like a professionally styled fashion lookbook with no visual glitches.`;

      // ساخت توضیحات آیتم‌ها
      const itemDescriptions = this.generateItemDescriptions(
        request.clothingItems
      );

      // آمار AI descriptions
      if (request.clothingItems) {
        const itemsWithAI = request.clothingItems.filter(
          item => item.description_with_ai
        ).length;
        const totalItems = request.clothingItems.length;

        console.log('\n📊 AI Description Statistics:');
        console.log(
          `✅ Items with AI description: ${itemsWithAI}/${totalItems}`
        );
        console.log(
          `❌ Items without AI description: ${totalItems - itemsWithAI}/${totalItems}`
        );
        console.log(
          `📈 Coverage: ${Math.round((itemsWithAI / totalItems) * 100)}%\n`
        );
      }

      // جایگزینی توضیحات در پرامپت
      enhancedPrompt = fixedPromptTemplate.replace(
        '[ITEM_DESCRIPTIONS]',
        itemDescriptions
      );

      console.log('✅ Virtual try-on prompt generated with item descriptions');
      console.log('\n📝 Item Descriptions Format:');
      console.log('─────────────────────────────');
      console.log(itemDescriptions);
      console.log('─────────────────────────────\n');

      console.log('🎨 Collage created and will be sent to Flux Kontext API');
      console.log('\n📝 Final Prompt for FLUX API:');
      console.log(
        '═════════════════════════════════════════════════════════════════'
      );
      console.log(enhancedPrompt);
      console.log(
        '═════════════════════════════════════════════════════════════════\n'
      );

      // Update progress
      onProgress?.({
        phase: 'api_transmission',
        progress: 50,
        message: 'Sending to AI for processing...',
      });

      // 3. Call FLUX API with the collage
      await this.testNetworkConnectivity();

      const fluxResult = await this.callFluxKontextAPI({
        collageImageMetadata: await this.analyzeImage(collageUri),
        enhancedPrompt: enhancedPrompt,
      });

      // Update progress
      onProgress?.({
        phase: 'output_delivery',
        progress: 90,
        message: 'Finalizing result...',
      });

      // 4. Process the output
      const result = await this.processOutput(fluxResult, request);

      // Add collage URL to the result
      const enhancedResult: VirtualTryOnResult = {
        ...result,
        collageImageUrl: collageUri,
      };

      // Update progress - completed
      onProgress?.({
        phase: 'completed',
        progress: 100,
        message: 'Virtual try-on completed successfully!',
      });

      console.log('✅ Virtual try-on process completed successfully');
      return enhancedResult;
    } catch (error) {
      console.error('❌ Virtual try-on process failed:', error);

      // Update progress - error
      onProgress?.({
        phase: 'error',
        progress: 0,
        message:
          error instanceof Error ? error.message : 'Unknown error occurred',
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

    // Analyze each clothing item to extract details for OpenArt-style prompt
    const referenceImagesMetadata = await Promise.all(
      request.referenceImages.map(async (img: string, index: number) => {
        const metadata = await this.analyzeImage(img);
        // Extract clothing type from URL or use generic description
        const clothingType = this.detectClothingType(img, index);
        return {
          ...metadata,
          description: clothingType,
          index: index + 1,
        };
      })
    );

    const analysis = {
      initImageMetadata: await this.analyzeImage(request.initImage),
      referenceImagesMetadata,
      promptAnalysis: this.analyzePrompt(request.prompt),
      styleContext:
        request.styleInstructions ||
        'natural studio lighting, professional fit',
      processingTime: Date.now() - startTime,
      // OpenArt approach metadata
      itemCount: request.referenceImages.length,
      isMultiItem: request.referenceImages.length > 1,
    };

    console.log('📊 Analysis complete:', {
      userImage: !!analysis.initImageMetadata,
      clothingItems: analysis.itemCount,
      isMultiItem: analysis.isMultiItem,
    });

    return analysis;
  }

  private detectClothingType(imageUrl: string, index: number): string {
    // Simple heuristic to detect clothing type from URL or index
    const url = imageUrl.toLowerCase();

    if (url.includes('shirt') || url.includes('top')) return 'shirt/top';
    if (
      url.includes('pant') ||
      url.includes('trouser') ||
      url.includes('bottom')
    )
      return 'pants/bottoms';
    if (url.includes('shoe') || url.includes('sneaker') || url.includes('boot'))
      return 'shoes/footwear';
    if (url.includes('dress')) return 'dress';
    if (url.includes('jacket') || url.includes('coat'))
      return 'jacket/outerwear';
    if (url.includes('bag') || url.includes('purse')) return 'bag/accessory';

    // Default based on index
    const defaults = ['top/shirt', 'bottom/pants', 'shoes', 'accessory'];
    return defaults[index] || `item ${index + 1}`;
  }

  private async executeAIStyling(analyzedData: any): Promise<any> {
    // OpenArt approach: Enhance the prompt to work with multiple clothing items
    // They likely use a specific prompt structure that tells FLUX to apply ALL items

    const itemDescriptions = analyzedData.referenceImagesMetadata
      .map(
        (item: any, index: number) =>
          `Item ${index + 1}: ${item.description || 'clothing item'}`
      )
      .join(', ');

    const openArtStylePrompt = this.buildOpenArtStylePrompt(
      analyzedData,
      itemDescriptions
    );

    return {
      ...analyzedData,
      enhancedPrompt: openArtStylePrompt,
      technicalSpecs: {
        lighting: 'cinematic studio lighting',
        fit: 'natural draping and precise fit',
        quality: 'magazine-quality, high-resolution',
        style: 'professional fashion photography',
        instruction:
          'Apply ALL clothing items shown to the person, maintaining exact details of each piece',
      },
    };
  }

  private buildOpenArtStylePrompt(
    analyzedData: any,
    itemDescriptions: string
  ): string {
    // OpenArt-style prompt that works with FLUX Kontext
    const basePrompt = analyzedData.promptAnalysis.original;

    return `Virtual try-on transformation: Take the person from the main image and dress them in ALL the clothing items shown. 
    ${itemDescriptions}. 
    CRITICAL INSTRUCTIONS:
    1. Preserve the person's face, hair, body shape, and pose EXACTLY
    2. Apply each clothing item with proper layering (shirt, then jacket, etc.)
    3. Ensure natural fit and realistic fabric draping
    4. Maintain the exact colors, patterns, and details of each clothing piece
    5. Keep the original background unchanged
    6. Professional fashion photography quality with consistent lighting
    The final result should look like a professional e-commerce or fashion shoot.`;
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

      // Check if this is a CORS error in web development environment
      if (
        kontextError instanceof Error &&
        this.isCorsError(kontextError) &&
        this.isWebEnvironment() &&
        process.env.NODE_ENV === 'development'
      ) {
        console.warn('🎭 CORS detected in development - using mock result');
        return await this.generateMockVirtualTryOnResult({
          initImage: '',
          referenceImages:
            stylingData.referenceImagesMetadata?.map(() => '') || [],
          prompt: stylingData.enhancedPrompt || '',
          userId: '',
          outfitId: '',
        });
      }

      // Fallback to standard image generation API
      try {
        return await this.callStandardImageGeneration(stylingData);
      } catch (standardError) {
        // If both APIs fail due to CORS in development, provide mock
        if (
          standardError instanceof Error &&
          this.isCorsError(standardError) &&
          this.isWebEnvironment() &&
          process.env.NODE_ENV === 'development'
        ) {
          console.warn(
            '🎭 Both APIs blocked by CORS - using mock result for development'
          );
          return await this.generateMockVirtualTryOnResult({
            initImage: '',
            referenceImages:
              stylingData.referenceImagesMetadata?.map(() => '') || [],
            prompt: stylingData.enhancedPrompt || '',
            userId: '',
            outfitId: '',
          });
        }
        throw standardError;
      }
    }
  }

  private async callKontextImageEditing(
    stylingData: any
  ): Promise<FluxApiResponse> {
    const hasCollageImage =
      stylingData.collageImageMetadata &&
      stylingData.collageImageMetadata.base64;

    if (!hasCollageImage) {
      throw new Error('No collage image available for Kontext editing');
    }

    // استفاده از کولاژ که شامل user + clothing items هست
    console.log('🎨 Using collage for virtual try-on');
    console.log('📸 Collage includes user image and clothing items');

    // Use Kontext Max model for better accuracy (though more expensive)
    const endpoint = `${this.FLUX_BASE_URL}/${this.KONTEXT_MAX_MODEL}`;

    // Prepare the request payload according to BFL API docs
    // ارسال کولاژ کامل به جای user image منفرد
    const payload = {
      prompt: stylingData.enhancedPrompt,
      image: `data:image/jpeg;base64,${stylingData.collageImageMetadata.base64}`, // استفاده از کولاژ
      guidance: 7.5, // Increased guidance for stricter prompt following
      safety_tolerance: 2,
      output_format: 'jpeg',
      steps: 50, // افزایش steps برای کیفیت بهتر
    };

    // لاگ کامل پارامترهای ارسالی به Flux
    console.log(
      '\n🎯 ═══════════════════════════════════════════════════════════════'
    );
    console.log('📤 FLUX KONTEXT API - پارامترهای ارسالی به فلاکس');
    console.log(
      '═══════════════════════════════════════════════════════════════'
    );
    console.log('\n1️⃣ PROMPT ارسالی (با AI descriptions):');
    console.log('─────────────────────────────────────────');
    console.log(payload.prompt);
    console.log('─────────────────────────────────────────');
    console.log('\n2️⃣ تنظیمات تصویر:');
    console.log('─────────────────');
    console.log(`- Guidance: ${payload.guidance}`);
    console.log(`- Safety Tolerance: ${payload.safety_tolerance}`);
    console.log(`- Output Format: ${payload.output_format}`);
    console.log(`- Steps: ${payload.steps}`);
    console.log('\n3️⃣ تصویر کولاژ:');
    console.log('─────────────────');
    console.log(`- Format: data:image/jpeg;base64`);
    console.log(
      `- Base64 Length: ${stylingData.collageImageMetadata.base64.length} characters`
    );
    console.log(
      `- Image Size: ~${Math.round((stylingData.collageImageMetadata.base64.length * 0.75) / 1024)} KB`
    );
    console.log('\n4️⃣ اطلاعات اضافی از stylingData:');
    console.log('─────────────────');
    console.log(
      `- User Image: ${stylingData.userImageMetadata ? 'موجود' : 'ندارد'}`
    );
    console.log(
      `- Reference Images Count: ${stylingData.referenceImagesMetadata?.length || 0}`
    );
    console.log(`- Original Prompt: ${stylingData.originalPrompt || 'ندارد'}`);
    console.log(
      '═══════════════════════════════════════════════════════════════\n'
    );

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `🚀 FLUX Kontext API Call Attempt ${attempt}/${this.MAX_RETRIES}`
        );
        console.log('📡 Request Details:', {
          endpoint,
          model: this.KONTEXT_MAX_MODEL,
          hasApiKey: !!this.API_KEY,
          keyFormat: this.API_KEY?.substring(0, 8) + '...',
          hasImage: !!payload.image,
          promptLength: payload.prompt.length,
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, 45000);

        const requestTimestamp = new Date().toISOString();
        const requestStartTime = Date.now();

        // Log API Request
        this.logApiCommunication('REQUEST', {
          timestamp: requestTimestamp,
          endpoint,
          method: 'POST',
          headers: {
            'x-key': this.API_KEY || '',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          payload,
        });

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
          const processingTime = Date.now() - requestStartTime;

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

            // Log Error Response
            this.logApiCommunication('RESPONSE', {
              timestamp: new Date().toISOString(),
              status: response.status,
              statusText: response.statusText,
              processingTime,
              error: errorText,
            });

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

          // Log Success Response
          this.logApiCommunication('RESPONSE', {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            processingTime,
            responseData: result,
          });

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

        // Check for CORS errors specifically
        if (this.isCorsError(lastError) && this.isWebEnvironment()) {
          console.error('🚫 CORS Error Detected in Web Environment');
          throw new Error(
            `CORS error: The FLUX API cannot be called directly from a web browser due to security restrictions. 
            
Solutions:
1. Test on a mobile device where CORS doesn't apply (recommended)
2. Use a backend server to proxy API calls
3. Wait for backend implementation
4. Use Expo development build instead of web

Current environment: ${this.getPlatform()}`
          );
        }

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

        const requestTimestamp = new Date().toISOString();
        const requestStartTime = Date.now();

        // Log API Request
        this.logApiCommunication('REQUEST', {
          timestamp: requestTimestamp,
          endpoint,
          method: 'POST',
          headers: {
            'x-key': this.API_KEY || '',
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          payload,
        });

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
          const processingTime = Date.now() - requestStartTime;

          console.log(
            '📥 Response Status:',
            response.status,
            response.statusText
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error Response Body:', errorText);

            // Log Error Response
            this.logApiCommunication('RESPONSE', {
              timestamp: new Date().toISOString(),
              status: response.status,
              statusText: response.statusText,
              processingTime,
              error: errorText,
            });

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

          // Log Success Response
          this.logApiCommunication('RESPONSE', {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            processingTime,
            responseData: submitResult,
          });

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

        // Check for CORS errors specifically
        if (this.isCorsError(lastError) && this.isWebEnvironment()) {
          console.error('🚫 CORS Error Detected in Web Environment');
          throw new Error(
            `CORS error: The FLUX API cannot be called directly from a web browser due to security restrictions. 
            
Solutions:
1. Test on a mobile device where CORS doesn't apply (recommended)
2. Use a backend server to proxy API calls
3. Wait for backend implementation
4. Use Expo development build instead of web

Current environment: ${this.getPlatform()}`
          );
        }

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

        const requestTimestamp = new Date().toISOString();
        const requestStartTime = Date.now();
        const pollEndpoint = `${this.FLUX_BASE_URL}/get_result?id=${taskId}`;

        // Log Polling Request
        this.logApiCommunication('REQUEST', {
          timestamp: requestTimestamp,
          endpoint: pollEndpoint,
          method: 'GET',
          headers: {
            'x-key': this.API_KEY || '',
            Accept: 'application/json',
          },
          payload: { taskId },
        });

        try {
          const response = await fetch(pollEndpoint, {
            method: 'GET',
            headers: {
              'x-key': this.API_KEY || '',
              Accept: 'application/json',
            },
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          const processingTime = Date.now() - requestStartTime;

          if (!response.ok) {
            const errorText = await response.text();
            console.warn(
              `📊 Status check failed: ${response.status} - ${errorText}`
            );

            // Log Polling Error Response
            this.logApiCommunication('RESPONSE', {
              timestamp: new Date().toISOString(),
              status: response.status,
              statusText: response.statusText,
              processingTime,
              error: errorText,
            });

            throw new Error(`Status check failed: ${response.status}`);
          }

          const result: FluxApiResponse = await response.json();
          console.log(`📊 Task status: ${result.status} for ${taskId}`);

          // Log Polling Success Response
          this.logApiCommunication('RESPONSE', {
            timestamp: new Date().toISOString(),
            status: response.status,
            statusText: response.statusText,
            processingTime,
            responseData: result,
          });

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

  // Helper function to create a collage from multiple images
  private async createImageCollage(imageUrls: string[]): Promise<string> {
    console.log('🎨 Creating collage from', imageUrls.length, 'images');

    // For now, we'll use the first image as primary
    // In a full implementation, you'd use a library like jimp or canvas
    // to create a grid layout of all images

    // TODO: Implement actual image stitching logic
    // Example layout for 3-4 images:
    // +-------+-------+
    // | img1  | img2  |
    // +-------+-------+
    // | img3  | img4  |
    // +-------+-------+

    return imageUrls[0]; // Temporary: just return first image
  }

  private async createOpenArtStyleCollage(
    userImage: string,
    clothingItems: string[]
  ): Promise<string> {
    console.log('🎨 Creating OpenArt-style collage');
    console.log('👤 User image:', userImage.substring(0, 50) + '...');
    console.log('👗 Clothing items:', clothingItems.length);

    // ساخت کولاژ با Canvas API در Web Environment
    if (this.isWebEnvironment() && typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // تنظیم سایز کولاژ (مثلاً 1024x1024)
        canvas.width = 1024;
        canvas.height = 1024;

        // پس‌زمینه سفید
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // لود کردن تصاویر
        const loadImage = (src: string): Promise<HTMLImageElement> => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
        };

        const [userImg, ...clothingImgs] = await Promise.all([
          loadImage(userImage),
          ...clothingItems.map(item => loadImage(item)),
        ]);

        // چینش OpenArt-style: user در وسط، آیتم‌ها در اطراف
        const centerSize = 500; // بزرگتر برای واضح‌تر بودن person
        const centerX = (canvas.width - centerSize) / 2;
        const centerY = (canvas.height - centerSize) / 2;

        // کادر سفید دور user image
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeRect(
          centerX - 2,
          centerY - 2,
          centerSize + 4,
          centerSize + 4
        );

        // رسم user image در وسط
        ctx.drawImage(userImg, centerX, centerY, centerSize, centerSize);

        // رسم آیتم‌ها در اطراف با کادر
        const itemSize = 220; // بزرگتر برای واضح‌تر بودن آیتم‌ها
        const positions = [
          { x: 30, y: 30 }, // بالا چپ
          { x: 774, y: 30 }, // بالا راست
          { x: 30, y: 774 }, // پایین چپ
          { x: 774, y: 774 }, // پایین راست
        ];

        clothingImgs.forEach((img, index) => {
          if (index < positions.length) {
            const pos = positions[index];
            // کادر دور هر آیتم
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 2;
            ctx.strokeRect(pos.x - 2, pos.y - 2, itemSize + 4, itemSize + 4);
            // رسم آیتم
            ctx.drawImage(img, pos.x, pos.y, itemSize, itemSize);
          }
        });

        // تبدیل به base64
        return canvas.toDataURL('image/jpeg', 0.9);
      } catch (error) {
        console.warn('⚠️ Canvas collage creation failed:', error);
        // fallback به user image
        return userImage;
      }
    }

    // Native Environment: فعلاً user image رو برمی‌گردونه
    // در آینده می‌توان از react-native-canvas یا backend service استفاده کرد
    console.log('⚠️ Native collage not implemented, using user image only');
    return userImage;
  }

  private async analyzeClothingForDescriptions(
    clothingItems: string[]
  ): Promise<string[]> {
    console.log('🔍 Analyzing clothing items for descriptions');

    // In production, send each image to GPT-4 Vision or similar
    // For now, return placeholder descriptions based on common patterns

    const descriptions = clothingItems.map((item, index) => {
      // Extract hints from URL if possible
      const urlLower = item.toLowerCase();

      if (urlLower.includes('dress')) {
        return 'elegant dress with modern cut and flowing fabric';
      } else if (urlLower.includes('shirt') || urlLower.includes('top')) {
        return 'stylish top with comfortable fit';
      } else if (urlLower.includes('pant') || urlLower.includes('trouser')) {
        return 'well-fitted pants with classic design';
      } else if (urlLower.includes('shoe') || urlLower.includes('boot')) {
        return 'fashionable footwear with quality materials';
      } else if (urlLower.includes('bag')) {
        return 'designer handbag with premium finish';
      } else {
        return `clothing item ${index + 1}`;
      }
    });

    return descriptions;
  }

  private generateOpenArtPrompt(
    itemDescriptions: string[],
    originalPrompt: string
  ): string {
    console.log('📝 Generating OpenArt-style prompt');

    const itemList = itemDescriptions
      .map((desc, idx) => `   Item ${idx + 1}: ${desc}`)
      .join('\n');

    return `Virtual Try-On Transformation Instructions:

IMPORTANT: This is a collage image. The person to dress is in the CENTER of the image.
The clothing items are shown in the surrounding areas.

YOUR TASK:
1. Identify the person in the CENTER of the collage
2. Apply ALL the clothing items shown around them
3. Create a professional fashion photograph result

CLOTHING ITEMS TO APPLY:
${itemList}

CRITICAL REQUIREMENTS:
- Use ONLY the person from the CENTER of the image
- Apply ALL clothing items shown in the surrounding squares
- Maintain the person's EXACT facial features, hair, and body proportions
- Ensure natural fabric draping and realistic shadows
- Professional studio lighting
- Magazine-quality output

${originalPrompt ? `\nAdditional instructions: ${originalPrompt}` : ''}

The final result should show the person wearing all specified items in a natural, photorealistic manner.`;
  }

  private async executeAnalysis(
    request: VirtualTryOnRequest,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<any> {
    // Implementation of executeAnalysis method
    // This method should return the analyzed data
    throw new Error('Method not implemented');
  }

  private async executeStyling(
    analyzedData: any,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<any> {
    // Implementation of executeStyling method
    // This method should return the styled data
    throw new Error('Method not implemented');
  }

  private async executeProcessing(
    styledData: any,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<any> {
    // Implementation of executeProcessing method
    // This method should return the processed data
    throw new Error('Method not implemented');
  }

  private async executeEnhancement(
    processedData: any,
    onProgress?: (state: TryOnWorkflowState) => void
  ): Promise<any> {
    // Implementation of executeEnhancement method
    // This method should return the enhanced data
    throw new Error('Method not implemented');
  }

  private async prepareFinalResult(
    enhancedData: any,
    request: VirtualTryOnRequest
  ): Promise<VirtualTryOnResult> {
    // Implementation of prepareFinalResult method
    // This method should return the final result
    throw new Error('Method not implemented');
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

    // Create a simple request - the service will handle the collage creation
    const request: VirtualTryOnRequest = {
      initImage: userImage,
      referenceImages: clothingItems.map(item => item.imageUrl),
      prompt: '', // Empty prompt - will be generated in processVirtualTryOn
      styleInstructions: 'Professional fashion photography',
      userId: 'user-id',
      outfitId,
      clothingItems, // ارسال آیتم‌های لباس برای دسترسی به توضیحات کامل
    };

    return service.processVirtualTryOn(request, onProgress);
  };

  return { processOutfitTryOn };
};
