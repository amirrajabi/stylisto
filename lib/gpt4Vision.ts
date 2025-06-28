interface ClothingAnalysis {
  category: string;
  color: string;
  pattern?: string;
  material?: string;
  style?: string;
  occasion?: string;
  detailedDescription: string;
}

export class GPT4VisionService {
  private static instance: GPT4VisionService;
  private readonly API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
  private readonly API_URL = 'https://api.openai.com/v1/chat/completions';

  static getInstance(): GPT4VisionService {
    if (!GPT4VisionService.instance) {
      GPT4VisionService.instance = new GPT4VisionService();
    }
    return GPT4VisionService.instance;
  }

  private constructor() {
    console.log('🤖 GPT-4 Vision Service initialized');
    console.log(
      '🔑 API Key status:',
      !!this.API_KEY ? 'Configured' : 'Missing'
    );
  }

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
        '\n🤖 ═══════════════════════════════════════════════════════════════'
      );
      console.log('📤 GPT-4 VISION API REQUEST');
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
            acc[key] = key.toLowerCase().includes('authorization')
              ? `Bearer ${value.toString().substring(7, 15)}...`
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
          Model: data.payload.model || 'نامشخص',
          'Max Tokens': data.payload.max_tokens || 'پیشفرض',
          Temperature: data.payload.temperature || 'پیشفرض',
          'Messages Count': data.payload.messages?.length || 0,
          'System Prompt': data.payload.messages?.[0]?.content
            ? `${data.payload.messages[0].content.substring(0, 50)}...`
            : 'ندارد',
          'Has Image': data.payload.messages?.[1]?.content?.some?.(
            (c: any) => c.type === 'image_url'
          )
            ? 'بله'
            : 'خیر',
          'Image URL': data.payload.messages?.[1]?.content?.find?.(
            (c: any) => c.type === 'image_url'
          )?.image_url?.url
            ? `${data.payload.messages[1].content.find((c: any) => c.type === 'image_url').image_url.url.substring(0, 50)}...`
            : 'ندارد',
        };
        console.table(payloadDetails);
      }
    } else if (direction === 'RESPONSE') {
      console.log(
        '\n📥 ═══════════════════════════════════════════════════════════════'
      );
      console.log('📨 GPT-4 VISION API RESPONSE');
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
          'Model Used': data.responseData.model || 'نامشخص',
          'Choices Count': data.responseData.choices?.length || 0,
          'Content Length':
            data.responseData.choices?.[0]?.message?.content?.length || 0,
          'Content Preview': data.responseData.choices?.[0]?.message?.content
            ? `${data.responseData.choices[0].message.content.substring(0, 100)}...`
            : 'ندارد',
          'Usage - Prompt Tokens':
            data.responseData.usage?.prompt_tokens || 'نامشخص',
          'Usage - Completion Tokens':
            data.responseData.usage?.completion_tokens || 'نامشخص',
          'Usage - Total Tokens':
            data.responseData.usage?.total_tokens || 'نامشخص',
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

  async analyzeClothingImage(imageUrl: string): Promise<ClothingAnalysis> {
    if (!this.API_KEY) {
      console.warn('⚠️ OpenAI API key not configured, using fallback analysis');
      return this.getFallbackAnalysis(imageUrl);
    }

    try {
      console.log('🔍 Analyzing clothing image with GPT-4 Vision');

      const requestTimestamp = new Date().toISOString();
      const requestStartTime = Date.now();

      const payload = {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content:
              'You are a fashion expert AI that analyzes clothing items. Provide detailed, accurate descriptions focusing on style, color, pattern, material, and suitable occasions.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this clothing item and provide:
1. Category (e.g., dress, shirt, pants, shoes, accessory)
2. Primary color and any secondary colors
3. Pattern (if any)
4. Material/fabric type (if visible)
5. Style (e.g., casual, formal, sporty)
6. Suitable occasions
7. A detailed description for virtual try-on

Format as JSON with these fields: category, color, pattern, material, style, occasion, detailedDescription`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      };

      const headers = {
        Authorization: `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      };

      // Log API Request
      this.logApiCommunication('REQUEST', {
        timestamp: requestTimestamp,
        endpoint: this.API_URL,
        method: 'POST',
        headers,
        payload,
      });

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const processingTime = Date.now() - requestStartTime;

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ GPT-4 Vision API error:', error);

        // Log Error Response
        this.logApiCommunication('RESPONSE', {
          timestamp: new Date().toISOString(),
          status: response.status,
          statusText: response.statusText,
          processingTime,
          error,
        });

        return this.getFallbackAnalysis(imageUrl);
      }

      const data = await response.json();

      // Log Success Response
      this.logApiCommunication('RESPONSE', {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        processingTime,
        responseData: data,
      });

      const content = data.choices[0]?.message?.content || '';

      // Try to parse JSON response
      try {
        const analysis = JSON.parse(content);
        console.log('✅ Clothing analysis complete:', analysis);
        return analysis;
      } catch {
        // If not valid JSON, extract information from text
        return this.parseTextResponse(content, imageUrl);
      }
    } catch (error) {
      console.error('❌ Error analyzing clothing:', error);
      return this.getFallbackAnalysis(imageUrl);
    }
  }

  async analyzeMultipleClothingItems(
    imageUrls: string[]
  ): Promise<ClothingAnalysis[]> {
    console.log(`🎯 Analyzing ${imageUrls.length} clothing items`);

    // Process in parallel for speed
    const analyses = await Promise.all(
      imageUrls.map(url => this.analyzeClothingImage(url))
    );

    return analyses;
  }

  private parseTextResponse(text: string, imageUrl: string): ClothingAnalysis {
    // Simple parsing logic for non-JSON responses
    const categoryMatch = text.match(/category[:\s]+([^\n,]+)/i);
    const colorMatch = text.match(/color[:\s]+([^\n,]+)/i);
    const patternMatch = text.match(/pattern[:\s]+([^\n,]+)/i);
    const materialMatch = text.match(/material[:\s]+([^\n,]+)/i);
    const styleMatch = text.match(/style[:\s]+([^\n,]+)/i);
    const occasionMatch = text.match(/occasion[:\s]+([^\n,]+)/i);

    return {
      category:
        categoryMatch?.[1]?.trim() || this.detectCategoryFromUrl(imageUrl),
      color: colorMatch?.[1]?.trim() || 'unknown',
      pattern: patternMatch?.[1]?.trim(),
      material: materialMatch?.[1]?.trim(),
      style: styleMatch?.[1]?.trim() || 'casual',
      occasion: occasionMatch?.[1]?.trim(),
      detailedDescription: text || 'A clothing item',
    };
  }

  private getFallbackAnalysis(imageUrl: string): ClothingAnalysis {
    const category = this.detectCategoryFromUrl(imageUrl);

    const fallbackDescriptions: Record<string, ClothingAnalysis> = {
      dress: {
        category: 'dress',
        color: 'elegant',
        style: 'feminine',
        occasion: 'versatile wear',
        detailedDescription:
          'An elegant dress with feminine styling, perfect for various occasions',
      },
      shirt: {
        category: 'shirt',
        color: 'classic',
        style: 'smart casual',
        occasion: 'daily wear',
        detailedDescription:
          'A classic shirt with smart casual appeal, suitable for everyday wear',
      },
      pants: {
        category: 'pants',
        color: 'versatile',
        style: 'modern fit',
        occasion: 'all occasions',
        detailedDescription:
          'Modern fit pants with versatile styling for various occasions',
      },
      shoes: {
        category: 'footwear',
        color: 'stylish',
        style: 'contemporary',
        occasion: 'daily wear',
        detailedDescription:
          'Contemporary footwear with comfortable design and stylish appearance',
      },
      jacket: {
        category: 'outerwear',
        color: 'sophisticated',
        style: 'layered look',
        occasion: 'transitional weather',
        detailedDescription:
          'Sophisticated outerwear perfect for layering and transitional weather',
      },
      accessory: {
        category: 'accessory',
        color: 'accent',
        style: 'complementary',
        occasion: 'style enhancement',
        detailedDescription:
          'A stylish accessory to complement and enhance any outfit',
      },
    };

    return (
      fallbackDescriptions[category] || {
        category: category,
        color: 'stylish',
        style: 'modern',
        detailedDescription: `A ${category} with modern styling and quality construction`,
      }
    );
  }

  private detectCategoryFromUrl(url: string): string {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('dress')) return 'dress';
    if (
      urlLower.includes('shirt') ||
      urlLower.includes('top') ||
      urlLower.includes('blouse')
    )
      return 'shirt';
    if (
      urlLower.includes('pant') ||
      urlLower.includes('trouser') ||
      urlLower.includes('jean')
    )
      return 'pants';
    if (
      urlLower.includes('shoe') ||
      urlLower.includes('boot') ||
      urlLower.includes('sneaker')
    )
      return 'shoes';
    if (urlLower.includes('jacket') || urlLower.includes('coat'))
      return 'jacket';
    if (
      urlLower.includes('bag') ||
      urlLower.includes('purse') ||
      urlLower.includes('belt')
    )
      return 'accessory';
    if (urlLower.includes('skirt')) return 'skirt';

    return 'clothing item';
  }

  generateVirtualTryOnPrompt(analyses: ClothingAnalysis[]): string {
    const itemDescriptions = analyses
      .map((item, index) => {
        const description = `${index + 1}. ${item.category.toUpperCase()}: ${item.detailedDescription}`;
        return description;
      })
      .join('\n');

    return `Professional Virtual Try-On Instructions:

Apply these EXACT clothing items to the person in the image:

${itemDescriptions}

CRITICAL REQUIREMENTS:
1. IDENTITY: Preserve the person's face, hair, body shape, and pose EXACTLY
2. ACCURACY: Use the EXACT clothing items as described - colors, patterns, and styles must match
3. LAYERING: Apply items in natural order (underwear → tops → bottoms → outerwear → accessories)
4. FIT: Ensure realistic draping, natural shadows, and proper proportions
5. QUALITY: Professional fashion photography standard with consistent lighting

The result should look like the person is actually wearing these specific items.`;
  }

  async analyzeCollageAndGeneratePrompt(
    collageImageUrl: string
  ): Promise<string> {
    if (!this.API_KEY) {
      console.warn(
        '⚠️ OpenAI API key not configured, using fallback prompt generation'
      );
      return this.getFallbackPrompt();
    }

    try {
      console.log(
        '🎨 Analyzing collage image with GPT-4 Vision for prompt generation'
      );

      const requestTimestamp = new Date().toISOString();
      const requestStartTime = Date.now();

      const payload = {
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert fashion AI that creates detailed prompts for virtual try-on systems. 
You will analyze a collage image showing:
- A person (full body) on the right side
- Clothing items arranged on the left side

Your task is to create a professional, detailed prompt for FLUX API that will dress the person in these exact clothing items.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this collage image carefully:
1. The person on the RIGHT side needs to wear all the clothing items shown on the LEFT side
2. Describe each clothing item in EXTREME detail (color, pattern, material, style, brand characteristics)
3. Create a professional English prompt for virtual try-on that:
   - Lists EVERY clothing item with precise descriptions
   - Emphasizes keeping the person's identity (face, body, pose) EXACTLY the same
   - Ensures natural, realistic fitting and layering
   - Maintains professional fashion photography quality
   
Generate ONLY the English prompt, no explanations. The prompt should be detailed enough that an AI can recreate these EXACT items on the person.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: collageImageUrl,
                  detail: 'high',
                },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      };

      const headers = {
        Authorization: `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      };

      // Log API Request
      this.logApiCommunication('REQUEST', {
        timestamp: requestTimestamp,
        endpoint: this.API_URL,
        method: 'POST',
        headers,
        payload,
      });

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const processingTime = Date.now() - requestStartTime;

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ GPT-4 Vision API error:', error);

        // Log Error Response
        this.logApiCommunication('RESPONSE', {
          timestamp: new Date().toISOString(),
          status: response.status,
          statusText: response.statusText,
          processingTime,
          error,
        });

        return this.getFallbackPrompt();
      }

      const data = await response.json();

      // Log Success Response
      this.logApiCommunication('RESPONSE', {
        timestamp: new Date().toISOString(),
        status: response.status,
        statusText: response.statusText,
        processingTime,
        responseData: data,
      });

      const generatedPrompt = data.choices[0]?.message?.content || '';

      console.log('✅ Generated virtual try-on prompt:', generatedPrompt);

      // Add extra instructions to ensure quality
      const enhancedPrompt = `${generatedPrompt}

ADDITIONAL REQUIREMENTS:
- Maintain the exact lighting and background from the original person's photo
- Ensure all clothing items fit naturally with proper physics and fabric behavior
- Keep shadows and reflections consistent with the original lighting
- The final image should look like a professional fashion photoshoot
- All clothing items must be clearly visible and properly layered`;

      return enhancedPrompt;
    } catch (error) {
      console.error('❌ Error generating prompt from collage:', error);
      return this.getFallbackPrompt();
    }
  }

  private getFallbackPrompt(): string {
    return `Virtual Try-On Task:

Dress the person in the image with the clothing items shown on the left side of the collage.

IMPORTANT INSTRUCTIONS:
1. Keep the person's face, hair, body shape, skin tone, and pose EXACTLY the same
2. Apply ALL clothing items from the left side to the person on the right
3. Ensure natural fabric draping, realistic shadows, and proper fit
4. Maintain professional fashion photography quality
5. The person should be wearing ALL items in a coordinated, natural way

Style: Professional fashion photography, consistent lighting
Background: Keep the original background unchanged`;
  }
}

// Export singleton instance
export const gpt4Vision = GPT4VisionService.getInstance();
