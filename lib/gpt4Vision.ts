import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

interface ClothingAnalysis {
  name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: string;
  season: string[];
  occasion: string[];
  tags: string[];
  notes: string;
  description: string; // AI description - comprehensive analysis
  pattern?: string;
  material?: string;
  style?: string;
  detailedDescription: string; // Legacy field for compatibility
  stylingNotes?: string; // Legacy field for compatibility
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

  /**
   * Convert local file URI to base64 for OpenAI API
   */
  private async getBase64FromUri(uri: string): Promise<string> {
    if (Platform.OS === 'web') {
      // For web, fetch the image and convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get pure base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // For native platforms, use FileSystem
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  }

  /**
   * Check if URL is a local file URI that needs base64 conversion
   */
  private isLocalFileUri(uri: string): boolean {
    return (
      uri.startsWith('file://') ||
      uri.startsWith('/') ||
      uri.includes('ImagePicker') ||
      uri.includes('ExponentExperienceData')
    );
  }

  /**
   * Prepare image for OpenAI API - convert local files to base64 or use direct URL
   */
  private async prepareImageForAPI(
    imageUri: string
  ): Promise<{ url?: string; base64?: string }> {
    if (this.isLocalFileUri(imageUri)) {
      console.log('🔄 Converting local image to base64 for API...');
      const base64 = await this.getBase64FromUri(imageUri);
      return { base64 };
    } else {
      // It's already a valid HTTP/HTTPS URL
      return { url: imageUri };
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

      // Prepare image for API (convert to base64 if local file)
      const imageData = await this.prepareImageForAPI(imageUrl);

      const imageContent = imageData.base64
        ? {
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${imageData.base64}`,
              detail: 'high' as const,
            },
          }
        : {
            type: 'image_url' as const,
            image_url: {
              url: imageData.url!,
              detail: 'high' as const,
            },
          };

      const payload = {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional fashion expert and clothing analyst. Your task is to thoroughly examine clothing items and provide comprehensive, detailed descriptions that capture every aspect of the garment. You must respond with valid JSON only - no markdown, no code blocks, no additional text.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this clothing item comprehensively and provide detailed information. Extract as much information as possible from the image.

CRITICAL REQUIREMENTS:
1. ALWAYS provide a comprehensive "description" field - this is mandatory and must never be empty
2. Respond with ONLY valid JSON - no markdown, no code blocks, no additional text
3. Every field must be filled with meaningful content or appropriate defaults

Required JSON format with ALL fields mandatory:
{
  "name": "Create a descriptive product name like 'Navy Cotton Crew Neck T-Shirt' or 'Black Leather High-Top Sneakers'",
  "category": "exact clothing type: shirt, dress, pants, shoes, jacket, tops, bottoms, outerwear, underwear, swimwear, etc.",
  "brand": "identify brand if visible in image, otherwise use empty string",  
  "size": "estimate size if visible tags/labels, or suggest typical size like 'M' based on appearance, or empty string",
  "color": "primary color name: black, white, blue, red, etc.",
  "price": "estimate reasonable retail price in AUD without currency symbol, just number like '45' or empty string",
  "season": ["suitable seasons array: spring, summer, fall, winter"],
  "occasion": ["suitable occasions array: casual, work, formal, party, sport, travel"],  
  "tags": ["descriptive tags array: cotton, comfortable, versatile, classic, modern - maximum 8 tags"],
  "notes": "styling tips and care instructions in 2-3 sentences",
  "description": "MANDATORY: Write a comprehensive 2-3 paragraph description including: visual appearance, fabric/material analysis, style characteristics, fit assessment, quality indicators, styling versatility, and fashion context. This field must NEVER be empty - provide rich, detailed analysis of every visual aspect you can observe."
}

DESCRIPTION FIELD REQUIREMENTS:
- Minimum 150 words, maximum 300 words
- Include fabric texture analysis (cotton, polyester, leather, etc.)
- Describe visual elements (patterns, prints, textures, hardware)
- Assess quality indicators (stitching, construction, finishing)
- Provide styling suggestions and versatility notes
- Never leave this field empty - always provide comprehensive analysis

Extract maximum information from the image. For brand, look for logos, labels, or distinctive design elements. For size, check for visible tags or estimate based on fit/style. For price, provide realistic Australian retail estimates based on apparent quality and brand.

Remember: Return ONLY the JSON object with no additional text, markdown, or formatting. The description field is CRITICAL and must always contain detailed analysis.`,
              },
              imageContent,
            ],
          },
        ],
        max_tokens: 1200,
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

      // Try to parse JSON response with enhanced error handling
      try {
        // First, try direct JSON parsing
        let analysis = JSON.parse(content);
        console.log('✅ Direct JSON parse successful:', analysis);

        // Validate the parsed result has required fields
        if (analysis && typeof analysis === 'object' && analysis.name) {
          return analysis;
        } else {
          console.warn(
            '⚠️ Parsed JSON lacks required fields, trying extraction...'
          );
          throw new Error('Invalid JSON structure');
        }
      } catch (directParseError) {
        console.log(
          '❌ Direct JSON parse failed, trying content extraction...'
        );

        // Try to extract JSON from content that might be wrapped in markdown or text
        try {
          // Remove markdown code blocks if present
          let cleanContent = content
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');
          cleanContent = cleanContent
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '');

          // Try to find JSON object in the cleaned content
          const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const jsonStr = jsonMatch[0];
            // Fix common JSON issues
            const fixedJsonStr = jsonStr
              .replace(/\\"/g, '"') // Unescape quotes
              .replace(/\n/g, ' ') // Remove newlines
              .replace(/\s+/g, ' ') // Normalize whitespace
              .trim();

            const analysis = JSON.parse(fixedJsonStr);
            console.log('✅ Extracted and parsed JSON successfully:', analysis);

            // Validate the extracted result
            if (analysis && typeof analysis === 'object' && analysis.name) {
              return analysis;
            }
          }
        } catch (extractError) {
          console.error('❌ JSON extraction also failed:', extractError);
        }

        // If all JSON parsing fails, extract information from text
        console.log('🔄 Falling back to text parsing...');
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
    console.log('🔧 Parsing text response as fallback...');
    console.log('📄 Raw text content:', text.substring(0, 200) + '...');

    // Try to extract JSON from the text first
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const potentialJson = jsonMatch[0];
        console.log(
          '🔍 Found potential JSON in text:',
          potentialJson.substring(0, 100) + '...'
        );

        try {
          const parsed = JSON.parse(potentialJson);
          if (parsed && typeof parsed === 'object') {
            console.log('✅ Successfully parsed JSON from text response');
            return {
              name: parsed.name || 'Clothing Item',
              category: parsed.category || this.detectCategoryFromUrl(imageUrl),
              brand: parsed.brand || '',
              size: parsed.size || '',
              color: parsed.color || 'unknown',
              price: parsed.price || '',
              season: Array.isArray(parsed.season) ? parsed.season : ['spring'],
              occasion: Array.isArray(parsed.occasion)
                ? parsed.occasion
                : ['casual'],
              tags: Array.isArray(parsed.tags) ? parsed.tags : [],
              notes: parsed.notes || '',
              description: parsed.description || text || 'A clothing item',
              pattern: parsed.pattern,
              material: parsed.material,
              style: parsed.style || 'casual',
              detailedDescription:
                parsed.description || text || 'A clothing item',
            };
          }
        } catch (jsonParseError) {
          console.warn(
            '⚠️ JSON found in text but parsing failed:',
            jsonParseError
          );
        }
      }
    } catch (extractionError) {
      console.warn('⚠️ JSON extraction from text failed:', extractionError);
    }

    // Fallback to regex parsing
    console.log('🔧 Using regex pattern matching as final fallback...');
    const categoryMatch = text.match(/category[:\s]+([^\n,]+)/i);
    const colorMatch = text.match(/color[:\s]+([^\n,]+)/i);
    const patternMatch = text.match(/pattern[:\s]+([^\n,]+)/i);
    const materialMatch = text.match(/material[:\s]+([^\n,]+)/i);
    const styleMatch = text.match(/style[:\s]+([^\n,]+)/i);
    const occasionMatch = text.match(/occasion[:\s]+([^\n,]+)/i);
    const nameMatch = text.match(/name[:\s]+([^\n,]+)/i);
    const brandMatch = text.match(/brand[:\s]+([^\n,]+)/i);
    const sizeMatch = text.match(/size[:\s]+([^\n,]+)/i);
    const priceMatch = text.match(/price[:\s]+([^\n,]+)/i);

    const result: ClothingAnalysis = {
      name: nameMatch?.[1]?.trim() || 'Clothing Item',
      category:
        categoryMatch?.[1]?.trim() || this.detectCategoryFromUrl(imageUrl),
      brand: brandMatch?.[1]?.trim() || '',
      size: sizeMatch?.[1]?.trim() || '',
      color: colorMatch?.[1]?.trim() || 'unknown',
      price: priceMatch?.[1]?.trim() || '',
      season: ['spring'],
      occasion: occasionMatch?.[1]?.trim()
        ? [occasionMatch[1].trim()]
        : ['casual'],
      tags: [],
      notes: '',
      description: text || 'A clothing item',
      pattern: patternMatch?.[1]?.trim(),
      material: materialMatch?.[1]?.trim(),
      style: styleMatch?.[1]?.trim() || 'casual',
      detailedDescription: text || 'A clothing item',
    };

    console.log('✅ Regex parsing complete:', result);
    return result;
  }

  private getFallbackAnalysis(imageUrl: string): ClothingAnalysis {
    const category = this.detectCategoryFromUrl(imageUrl);

    const fallbackDescriptions: Record<string, ClothingAnalysis> = {
      dress: {
        name: 'Elegant Dress',
        category: 'dress',
        brand: '',
        size: '',
        color: 'elegant',
        price: '',
        season: ['spring', 'summer'],
        occasion: ['casual', 'formal'],
        tags: ['elegant', 'feminine'],
        notes:
          'Perfect for various occasions. Hand wash or dry clean to maintain quality.',
        description:
          'An elegant dress featuring feminine design elements and flattering silhouette. The garment displays quality construction with careful attention to fit and draping. The fabric appears to have a smooth texture with good color retention. This versatile piece can be dressed up or down depending on accessories and styling choices. The cut and design suggest it would complement various body types while maintaining a sophisticated aesthetic. Perfect for both professional and social settings.',
        style: 'feminine',
        detailedDescription:
          'An elegant dress featuring feminine design elements and flattering silhouette. The garment displays quality construction with careful attention to fit and draping. The fabric appears to have a smooth texture with good color retention. This versatile piece can be dressed up or down depending on accessories and styling choices.',
      },
      shirt: {
        name: 'Classic Shirt',
        category: 'shirt',
        brand: '',
        size: '',
        color: 'classic',
        price: '',
        season: ['spring', 'fall'],
        occasion: ['casual', 'work'],
        tags: ['classic', 'versatile'],
        notes: 'Machine washable. Iron on medium heat. Versatile for layering.',
        description:
          'A classic shirt design featuring clean lines and traditional tailoring. The fabric quality appears consistent with good color depth and minimal wrinkle retention. Construction details include proper seaming and finishing touches that suggest durability. The cut provides a balanced fit that works well for professional and casual settings. This piece demonstrates versatility in styling - can be worn alone, layered under sweaters, or paired with blazers. The collar and cuff construction maintain their shape well over time.',
        style: 'smart casual',
        detailedDescription:
          'A classic shirt design featuring clean lines and traditional tailoring. The fabric quality appears consistent with good color depth and minimal wrinkle retention. Construction details include proper seaming and finishing touches that suggest durability.',
      },
      pants: {
        name: 'Modern Pants',
        category: 'pants',
        brand: '',
        size: '',
        color: 'versatile',
        price: '',
        season: ['spring', 'fall', 'winter'],
        occasion: ['casual', 'work'],
        tags: ['modern', 'versatile'],
        notes: '',
        description:
          'Modern fit pants with versatile styling for various occasions',
        style: 'modern fit',
        detailedDescription:
          'Modern fit pants with versatile styling for various occasions',
      },
      shoes: {
        name: 'Stylish Footwear',
        category: 'footwear',
        brand: '',
        size: '',
        color: 'stylish',
        price: '',
        season: ['spring', 'summer', 'fall'],
        occasion: ['casual'],
        tags: ['stylish', 'comfortable'],
        notes: '',
        description:
          'Contemporary footwear with comfortable design and stylish appearance',
        style: 'contemporary',
        detailedDescription:
          'Contemporary footwear with comfortable design and stylish appearance',
      },
      jacket: {
        name: 'Sophisticated Outerwear',
        category: 'outerwear',
        brand: '',
        size: '',
        color: 'sophisticated',
        price: '',
        season: ['fall', 'winter'],
        occasion: ['casual', 'work'],
        tags: ['sophisticated', 'layering'],
        notes: '',
        description:
          'Sophisticated outerwear perfect for layering and transitional weather',
        style: 'layered look',
        detailedDescription:
          'Sophisticated outerwear perfect for layering and transitional weather',
      },
      accessory: {
        name: 'Stylish Accessory',
        category: 'accessory',
        brand: '',
        size: '',
        color: 'accent',
        price: '',
        season: ['spring', 'summer', 'fall', 'winter'],
        occasion: ['casual', 'formal'],
        tags: ['stylish', 'complementary'],
        notes: '',
        description: 'A stylish accessory to complement and enhance any outfit',
        style: 'complementary',
        detailedDescription:
          'A stylish accessory to complement and enhance any outfit',
      },
    };

    return (
      fallbackDescriptions[category] || {
        name: `${category.charAt(0).toUpperCase() + category.slice(1)}`,
        category: category,
        brand: '',
        size: '',
        color: 'stylish',
        price: '',
        season: ['spring'],
        occasion: ['casual'],
        tags: ['modern', 'stylish', 'versatile'],
        notes: 'Follow care label instructions. Store in cool, dry place.',
        description: `A ${category} featuring contemporary design and quality construction. The piece showcases modern styling with attention to detail and finishing. The fabric appears to have good texture and color consistency. This versatile garment can be incorporated into various outfits and styling approaches. The construction quality suggests durability and long-term wear value. Perfect for building a modern wardrobe with pieces that offer both style and functionality.`,
        style: 'modern',
        detailedDescription: `A ${category} featuring contemporary design and quality construction. The piece showcases modern styling with attention to detail and finishing. The fabric appears to have good texture and color consistency.`,
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
  ): Promise<{ prompt: string; analysis?: any }> {
    if (!this.API_KEY) {
      console.warn(
        '⚠️ OpenAI API key not configured, using fallback prompt generation'
      );
      return { prompt: this.getFallbackPrompt() };
    }

    try {
      console.log(
        '🎨 Analyzing collage image with GPT-4 Vision for prompt generation'
      );

      const requestTimestamp = new Date().toISOString();
      const requestStartTime = Date.now();

      // Prepare image for API (convert to base64 if local file)
      const imageData = await this.prepareImageForAPI(collageImageUrl);

      const imageContent = imageData.base64
        ? {
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${imageData.base64}`,
              detail: 'high' as const,
            },
          }
        : {
            type: 'image_url' as const,
            image_url: {
              url: imageData.url!,
              detail: 'high' as const,
            },
          };

      const payload = {
        model: 'gpt-4o',
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
                text: `Please analyze this collage image and create a detailed FLUX prompt for virtual try-on. Also provide a JSON analysis of the outfit:

FLUX PROMPT REQUIREMENTS:
1. Describe the person's body type, pose, and background setting
2. Detail each clothing item being worn (colors, styles, fit, textures)
3. Specify how the clothes should fit and look on the person
4. Include lighting, shadows, and fabric behavior details
5. Ensure photorealistic quality and natural appearance

JSON ANALYSIS REQUIREMENTS:
Provide a separate JSON object with these fields:
- category: (overall outfit type)
- color: (dominant colors in the outfit)
- pattern: (any patterns visible or null)
- material: (fabric types if identifiable or null)
- style: (overall style/aesthetic)
- occasion: (suitable occasions for this outfit)
- detailedDescription: (comprehensive description of the complete outfit)
- stylingNotes: (styling tips for this outfit combination, care instructions, and recommendations)

Format your response as:
FLUX_PROMPT: [your detailed prompt here]

JSON_ANALYSIS: [your JSON analysis here]`,
              },
              imageContent,
            ],
          },
        ],
        max_tokens: 1000,
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

        return { prompt: this.getFallbackPrompt() };
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

      const responseText = data.choices[0]?.message?.content || '';
      console.log('📝 GPT-4 Vision response:', responseText);

      // Extract FLUX prompt and JSON analysis from the response
      const fluxPromptMatch = responseText.match(
        /FLUX_PROMPT:\s*(.*?)(?=JSON_ANALYSIS:|$)/s
      );
      const jsonAnalysisMatch = responseText.match(/JSON_ANALYSIS:\s*({.*})/s);

      let fluxPrompt = responseText;
      let outfitAnalysis: any = null;

      if (fluxPromptMatch) {
        fluxPrompt = fluxPromptMatch[1].trim();
      }

      if (jsonAnalysisMatch) {
        try {
          outfitAnalysis = JSON.parse(jsonAnalysisMatch[1]);
          console.log('📊 Extracted outfit analysis:', outfitAnalysis);
        } catch (parseError) {
          console.warn('⚠️ Could not parse JSON analysis:', parseError);
        }
      }

      console.log('✅ Generated virtual try-on prompt:', fluxPrompt);

      // Add extra instructions to ensure quality
      const enhancedPrompt = `${fluxPrompt}

ADDITIONAL REQUIREMENTS:
- Maintain the exact lighting and background from the original person's photo
- Ensure all clothing items fit naturally with proper physics and fabric behavior
- Keep shadows and reflections consistent with the original lighting
- The final image should look like a professional fashion photoshoot
- All clothing items must be clearly visible and properly layered`;

      return {
        prompt: enhancedPrompt,
        analysis: outfitAnalysis,
      };
    } catch (error) {
      console.error('❌ Error generating prompt from collage:', error);
      return { prompt: this.getFallbackPrompt() };
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
