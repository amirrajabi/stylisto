import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Image } from 'react-native';
import { gpt4Vision } from './gpt4Vision';

export interface ImageLayout {
  userImage: string;
  clothingImages: string[];
}

export interface ComposedImage {
  uri: string;
  width: number;
  height: number;
  layout: {
    user: { x: number; y: number; width: number; height: number };
    items: {
      x: number;
      y: number;
      width: number;
      height: number;
      index: number;
    }[];
  };
}

export interface CollageOptions {
  userImage: string;
  clothingImages: string[];
  outputWidth?: number;
  outputHeight?: number;
}

export class ImageComposer {
  /**
   * Creates a collage with user image in center and clothing items around it
   * Layout example for 3-4 items:
   * +--------+--------+--------+
   * | item 1 |  USER  | item 2 |
   * +--------+--------+--------+
   * | item 3 |        | item 4 |
   * +--------+--------+--------+
   */
  static async createVirtualTryOnCollage(
    layout: ImageLayout
  ): Promise<ComposedImage> {
    console.log('🎨 Creating virtual try-on collage');

    const { userImage, clothingImages } = layout;
    const itemCount = clothingImages.length;

    // Define grid size based on item count
    const gridSize = itemCount <= 2 ? 3 : 4; // 3x3 for 1-2 items, 4x4 for 3-4 items
    const cellSize = 512; // Each cell is 512x512
    const finalSize = cellSize * gridSize;

    try {
      // Get dimensions of user image
      const userDimensions = await getImageDimensions(userImage);

      // Calculate user image area (center, taking up most of the space)
      const userArea = {
        x: cellSize,
        y: 0,
        width: cellSize * (gridSize - 2),
        height: cellSize * gridSize,
      };

      // First, resize and position user image in center
      let composedImage = await manipulateAsync(
        userImage,
        [
          {
            resize: {
              width: userArea.width,
              height: userArea.height,
            },
          },
        ],
        {
          compress: 0.9,
          format: SaveFormat.JPEG,
        }
      );

      // Create white background canvas
      const canvas = await manipulateAsync(
        composedImage.uri,
        [
          {
            resize: {
              width: finalSize,
              height: finalSize,
            },
          },
        ],
        {
          compress: 1,
          format: SaveFormat.PNG,
        }
      );

      // Define positions for clothing items
      const positions = [
        { x: 0, y: 0 }, // Top-left
        { x: cellSize * (gridSize - 1), y: 0 }, // Top-right
        { x: 0, y: cellSize * (gridSize === 4 ? 2 : 1) }, // Bottom-left
        {
          x: cellSize * (gridSize - 1),
          y: cellSize * (gridSize === 4 ? 2 : 1),
        }, // Bottom-right
      ];

      // Process each clothing item
      for (let i = 0; i < clothingImages.length && i < positions.length; i++) {
        const clothingImage = clothingImages[i];
        const position = positions[i];

        // Resize clothing item to fit cell
        const resizedClothing = await manipulateAsync(
          clothingImage,
          [
            {
              resize: {
                width: cellSize,
                height: cellSize,
              },
            },
          ],
          {
            compress: 0.9,
            format: SaveFormat.JPEG,
          }
        );

        // TODO: Since expo-image-manipulator doesn't support direct compositing,
        // we'll need to use a different approach or server-side processing
        // For now, we'll return the layout information
      }

      const layoutInfo = {
        user: userArea,
        items: clothingImages.map((_, index) => {
          return {
            x: positions[index]?.x || 0,
            y: positions[index]?.y || 0,
            width: cellSize,
            height: cellSize,
            index,
          };
        }),
      };

      // Return the composed result
      // NOTE: In production, you would need server-side image composition
      // or use a library that supports overlaying images
      console.log(
        '⚠️ Note: Full image composition requires server-side processing'
      );
      console.log('📐 Layout info:', layoutInfo);

      return {
        uri: composedImage.uri, // For now, return resized user image
        width: finalSize,
        height: finalSize,
        layout: layoutInfo,
      };
    } catch (error) {
      console.error('❌ Error creating collage:', error);
      throw error;
    }
  }

  /**
   * Analyzes clothing images and generates descriptions using GPT-4 Vision
   */
  static async analyzeClothingItems(images: string[]): Promise<string[]> {
    console.log('🔍 Analyzing clothing items with AI');

    try {
      // Use GPT-4 Vision to analyze all clothing items
      const analyses = await gpt4Vision.analyzeMultipleClothingItems(images);

      // Convert analyses to detailed descriptions
      const descriptions = analyses.map((analysis, index) => {
        const parts = [];

        // Build comprehensive description
        parts.push(analysis.category);

        if (analysis.color && analysis.color !== 'unknown') {
          parts.push(`in ${analysis.color}`);
        }

        if (analysis.pattern) {
          parts.push(`with ${analysis.pattern} pattern`);
        }

        if (analysis.material) {
          parts.push(`made of ${analysis.material}`);
        }

        if (analysis.style) {
          parts.push(`${analysis.style} style`);
        }

        // Use the detailed description if parts are too generic
        const basicDescription = parts.join(' ');

        return analysis.detailedDescription || basicDescription;
      });

      console.log('✅ AI analysis complete:', descriptions);
      return descriptions;
    } catch (error) {
      console.error('❌ Error in AI analysis, using fallback:', error);

      // Fallback to basic descriptions
      return images.map((_, index) => {
        const types = [
          'stylish dress with elegant design',
          'fashionable footwear with comfortable fit',
          'modern top with quality fabric',
          'versatile accessory',
        ];

        return types[index] || `clothing item ${index + 1}`;
      });
    }
  }

  /**
   * Generates OpenArt-style prompt for virtual try-on
   */
  static generateVirtualTryOnPrompt(
    descriptions: string[],
    additionalInstructions?: string
  ): string {
    const itemList = descriptions
      .map((desc, idx) => `   ${idx + 1}. ${desc}`)
      .join('\n');

    return `Virtual Try-On Transformation:

Take the person from the CENTER of this image and dress them in ALL the clothing items shown around them.

CLOTHING ITEMS TO APPLY:
${itemList}

CRITICAL INSTRUCTIONS:
1. The person is in the CENTER of the image - use ONLY that person
2. Apply ALL clothing items shown in the surrounding squares
3. Maintain the person's EXACT face, hair, body shape, and pose
4. Layer clothing items naturally (underwear → tops → outerwear → accessories)
5. Ensure perfect fit with realistic fabric draping and shadows
6. Keep the original background from the center image
7. Professional fashion photography quality

${additionalInstructions || ''}

The result should look like a professional fashion shoot with the person wearing all specified items.`;
  }

  /**
   * Alternative approach: Generate a detailed prompt without actual collage
   * This method creates a very specific prompt that tells FLUX exactly what to do
   */
  static generateDetailedVirtualTryOnPrompt(
    userImageDescription: string,
    clothingDescriptions: { item: string; description: string }[],
    additionalInstructions?: string
  ): string {
    const itemList = clothingDescriptions
      .map(
        ({ item, description }, idx) => `   ${idx + 1}. ${item}: ${description}`
      )
      .join('\n');

    return `Professional Virtual Try-On Request:

I need you to dress the person in this image with the following EXACT clothing items. This is a fashion virtual try-on task where accuracy is crucial.

PERSON DESCRIPTION:
${userImageDescription}

CLOTHING ITEMS TO APPLY (in layering order):
${itemList}

CRITICAL REQUIREMENTS:
1. IDENTITY PRESERVATION: Keep the person's face, hair, skin tone, and body shape EXACTLY as shown
2. EXACT CLOTHING: Use the EXACT clothing items described - do not create similar items
3. NATURAL FIT: Ensure all clothing fits naturally with proper draping and realistic shadows
4. LAYERING: Apply items in the correct order (underwear → shirts → pants/skirts → outerwear → accessories)
5. POSE & BACKGROUND: Maintain the original pose and background unchanged
6. QUALITY: Professional fashion photography quality with sharp details

STYLE NOTES:
- Lighting should match the original photo
- Fabric textures should be clearly visible
- All items should look naturally worn, not superimposed
- The final result should look like a real outfit worn by the person

${additionalInstructions || ''}

OUTPUT: A single, photorealistic image of the person wearing all specified clothing items.`;
  }

  /**
   * Simplified approach for immediate use
   * Combines all images into a description-based request
   */
  static async prepareVirtualTryOnRequest(
    userImage: string,
    clothingImages: { url: string; category: string; color?: string }[]
  ): Promise<{ prompt: string; primaryImage: string }> {
    console.log('📝 Preparing virtual try-on request');

    // Analyze user image (in production, use AI vision)
    const userDescription = 'person in the image';

    // Create detailed clothing descriptions
    const clothingDescriptions = clothingImages.map((item, index) => {
      const baseDescription = `${item.color || ''} ${item.category}`.trim();

      // Add more specific details based on category
      let detailedDescription = baseDescription;

      if (item.category.toLowerCase().includes('dress')) {
        detailedDescription += ' with elegant design and flowing fabric';
      } else if (item.category.toLowerCase().includes('shirt')) {
        detailedDescription += ' with comfortable fit and quality material';
      } else if (
        item.category.toLowerCase().includes('pants') ||
        item.category.toLowerCase().includes('jeans')
      ) {
        detailedDescription += ' with perfect fit and modern style';
      } else if (item.category.toLowerCase().includes('shoe')) {
        detailedDescription += ' with stylish design and comfortable fit';
      }

      return {
        item: `Item ${index + 1}`,
        description: detailedDescription,
      };
    });

    // Generate the detailed prompt
    const prompt = this.generateDetailedVirtualTryOnPrompt(
      userDescription,
      clothingDescriptions
    );

    return {
      prompt,
      primaryImage: userImage,
    };
  }
}

// Helper function to get image dimensions
export async function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

export class ImageComposerService {
  private static instance: ImageComposerService;

  static getInstance(): ImageComposerService {
    if (!ImageComposerService.instance) {
      ImageComposerService.instance = new ImageComposerService();
    }
    return ImageComposerService.instance;
  }

  private constructor() {
    console.log('🎨 Image Composer Service initialized');
  }

  /**
   * Creates an OpenArt-style collage with user image in center and clothing items around
   * Layout:
   * +-------+-------+-------+
   * | item1 | item2 | item3 |
   * +-------+-------+-------+
   * | item4 | USER  | item5 |
   * +-------+-------+-------+
   * | item6 | item7 | item8 |
   * +-------+-------+-------+
   */
  async createOpenArtCollage(options: CollageOptions): Promise<string> {
    const {
      userImage,
      clothingImages,
      outputWidth = 1024,
      outputHeight = 1024,
    } = options;

    console.log('🎨 Creating OpenArt-style collage');
    console.log('👤 User image:', userImage.substring(0, 50) + '...');
    console.log('👗 Clothing items:', clothingImages.length);

    try {
      // Since expo-image-manipulator doesn't support overlay,
      // we'll use a web-based approach for now (works in Expo web)
      // For production, consider using a server-side solution or react-native-canvas

      if (typeof document !== 'undefined' && typeof window !== 'undefined') {
        // Web environment - use Canvas API
        return await this.createCollageWithCanvas(
          userImage,
          clothingImages,
          outputWidth,
          outputHeight
        );
      } else {
        // Native environment - for now, return a composite prompt approach
        console.warn(
          '⚠️ Native collage creation not yet implemented, using alternative approach'
        );
        return await this.createAlternativeCollage(userImage, clothingImages);
      }
    } catch (error) {
      console.error('❌ Error creating collage:', error);
      throw new Error(
        `Failed to create collage: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Creates collage using Canvas API (web only)
   */
  private async createCollageWithCanvas(
    userImage: string,
    clothingImages: string[],
    outputWidth: number,
    outputHeight: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, outputWidth, outputHeight);

      const gridSize = 3;
      const cellWidth = Math.floor(outputWidth / gridSize);
      const cellHeight = Math.floor(outputHeight / gridSize);

      // Load all images
      const imagePromises: Promise<HTMLImageElement>[] = [];

      // Load user image
      imagePromises.push(this.loadImage(userImage));

      // Load clothing images
      clothingImages.forEach(url => {
        imagePromises.push(this.loadImage(url));
      });

      Promise.all(imagePromises)
        .then(images => {
          const [userImg, ...clothingImgs] = images;

          // Draw user image in center (larger)
          const centerCellSize = cellWidth * 1.2;
          const centerOffset = (outputWidth - centerCellSize) / 2;

          ctx.drawImage(
            userImg,
            centerOffset,
            centerOffset,
            centerCellSize,
            centerCellSize
          );

          // Positions for clothing items (skip center)
          const positions = [
            { x: 0, y: 0 }, // Top-left
            { x: cellWidth, y: 0 }, // Top-center
            { x: cellWidth * 2, y: 0 }, // Top-right
            { x: 0, y: cellHeight }, // Middle-left
            { x: cellWidth * 2, y: cellHeight }, // Middle-right
            { x: 0, y: cellHeight * 2 }, // Bottom-left
            { x: cellWidth, y: cellHeight * 2 }, // Bottom-center
            { x: cellWidth * 2, y: cellHeight * 2 }, // Bottom-right
          ];

          // Draw clothing items
          clothingImgs.forEach((img, index) => {
            if (index < positions.length) {
              const pos = positions[index];
              const padding = cellWidth * 0.05;

              ctx.drawImage(
                img,
                pos.x + padding,
                pos.y + padding,
                cellWidth * 0.9,
                cellHeight * 0.9
              );
            }
          });

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          resolve(dataUrl);
        })
        .catch(reject);
    });
  }

  /**
   * Alternative collage approach for native environments
   * Returns the user image with metadata about clothing positions
   */
  private async createAlternativeCollage(
    userImage: string,
    clothingImages: string[]
  ): Promise<string> {
    // For native environments, we'll return the user image
    // and rely on the prompt to describe the clothing items
    console.log('📱 Using alternative collage approach for native environment');

    // In a production app, you would:
    // 1. Use a native image manipulation library
    // 2. Send images to a server for processing
    // 3. Use react-native-canvas or similar

    // For now, return user image with enhanced prompt handling
    return userImage;
  }

  /**
   * Helper to load image for Canvas
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      // Check if we're in web environment
      if (
        typeof window !== 'undefined' &&
        typeof window.Image !== 'undefined'
      ) {
        const img = new window.Image();
        img.crossOrigin = 'anonymous'; // For CORS
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      } else {
        reject(new Error('Image loading only supported in web environment'));
      }
    });
  }

  /**
   * Creates a simple grid collage (placeholder for now)
   */
  async createGridCollage(
    images: string[],
    columns: number = 2,
    outputWidth: number = 1024,
    outputHeight: number = 1024
  ): Promise<string> {
    console.log(
      `📐 Creating ${columns}x grid collage with ${images.length} images`
    );

    // For now, return first image as placeholder
    // In production, implement proper grid collage
    return images[0] || '';
  }

  /**
   * Creates a data URI with instructions for the AI
   */
  createInstructionImage(
    userImage: string,
    clothingImages: string[],
    width: number = 1024,
    height: number = 1024
  ): string {
    // Create an SVG with layout instructions
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="10%" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">
          Virtual Try-On Instructions
        </text>
        <text x="50%" y="15%" text-anchor="middle" font-family="Arial" font-size="16" fill="#666">
          User image: Center | Clothing: Surrounding positions
        </text>
        <rect x="40%" y="40%" width="20%" height="20%" fill="#ddd" stroke="#999"/>
        <text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="14" fill="#666">
          USER
        </text>
        ${clothingImages
          .map(
            (_, i) => `
          <text x="10%" y="${20 + i * 5}%" font-family="Arial" font-size="12" fill="#666">
            Item ${i + 1}: Position ${i + 1}
          </text>
        `
          )
          .join('')}
      </svg>
    `;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Creates collage using react-native-view-shot for native environments
   */
  async createNativeCollage(
    userImage: string,
    clothingImages: string[],
    outputWidth: number,
    outputHeight: number
  ): Promise<string> {
    console.log('📱 Creating native collage with react-native-view-shot');

    // This method will be called from the UI component which renders NativeCollageView
    // The actual capture happens in the component that uses this service

    // For now, we'll return a placeholder and the actual implementation
    // will be in the component that uses ViewShot

    return userImage; // Will be replaced by ViewShot capture
  }
}

export const imageComposer = ImageComposerService.getInstance();
