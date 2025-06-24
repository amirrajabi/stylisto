import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

export interface ImageProcessingOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

export interface ProcessedImage {
  uri: string;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface BatchProcessingProgress {
  completed: number;
  total: number;
  currentImage: string;
  errors: string[];
}

class ImageProcessingService {
  private static instance: ImageProcessingService;

  static getInstance(): ImageProcessingService {
    if (!ImageProcessingService.instance) {
      ImageProcessingService.instance = new ImageProcessingService();
    }
    return ImageProcessingService.instance;
  }

  /**
   * Process a single image with optimization and optional cropping
   */
  async processImage(
    imageUri: string, 
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage> {
    const {
      maxWidth = 1200,
      maxHeight = 1600,
      quality = 0.8,
      format = 'jpeg',
      crop,
    } = options;

    try {
      // Get original image info
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      const originalWidth = imageInfo.width;
      const originalHeight = imageInfo.height;

      // Calculate resize dimensions while maintaining aspect ratio
      const { width: targetWidth, height: targetHeight } = this.calculateResizeDimensions(
        originalWidth,
        originalHeight,
        maxWidth,
        maxHeight
      );

      // Build manipulation actions
      const actions: ImageManipulator.Action[] = [];

      // Add crop action if specified
      if (crop) {
        actions.push({
          crop: {
            originX: crop.originX,
            originY: crop.originY,
            width: crop.width,
            height: crop.height,
          },
        });
      }

      // Add resize action if needed
      if (targetWidth !== originalWidth || targetHeight !== originalHeight) {
        actions.push({
          resize: {
            width: targetWidth,
            height: targetHeight,
          },
        });
      }

      // Process the image
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        {
          compress: quality,
          format: this.getImageManipulatorFormat(format),
          base64: false,
        }
      );

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(result.uri);
      const size = fileInfo.exists ? fileInfo.size || 0 : 0;

      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        size,
        format,
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error(`Failed to process image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process multiple images with progress tracking
   */
  async processBatch(
    imageUris: string[],
    options: ImageProcessingOptions = {},
    onProgress?: (progress: BatchProcessingProgress) => void
  ): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];
    const errors: string[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];
      
      try {
        // Update progress
        onProgress?.({
          completed: i,
          total: imageUris.length,
          currentImage: imageUri,
          errors: [...errors],
        });

        const processedImage = await this.processImage(imageUri, options);
        results.push(processedImage);
      } catch (error) {
        const errorMessage = `Failed to process image ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMessage);
        console.error(errorMessage);
      }
    }

    // Final progress update
    onProgress?.({
      completed: imageUris.length,
      total: imageUris.length,
      currentImage: '',
      errors,
    });

    return results;
  }

  /**
   * Create thumbnail from image
   */
  async createThumbnail(
    imageUri: string,
    size: number = 200,
    quality: number = 0.7
  ): Promise<ProcessedImage> {
    return this.processImage(imageUri, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'jpeg',
    });
  }

  /**
   * Crop image to specific aspect ratio
   */
  async cropToAspectRatio(
    imageUri: string,
    aspectRatio: number, // width/height
    quality: number = 0.8
  ): Promise<ProcessedImage> {
    try {
      // Get original dimensions
      const imageInfo = await ImageManipulator.manipulateAsync(
        imageUri,
        [],
        { format: ImageManipulator.SaveFormat.JPEG }
      );

      const { width: originalWidth, height: originalHeight } = imageInfo;
      const originalAspectRatio = originalWidth / originalHeight;

      let cropWidth: number;
      let cropHeight: number;
      let originX: number;
      let originY: number;

      if (originalAspectRatio > aspectRatio) {
        // Image is wider than target aspect ratio
        cropHeight = originalHeight;
        cropWidth = cropHeight * aspectRatio;
        originX = (originalWidth - cropWidth) / 2;
        originY = 0;
      } else {
        // Image is taller than target aspect ratio
        cropWidth = originalWidth;
        cropHeight = cropWidth / aspectRatio;
        originX = 0;
        originY = (originalHeight - cropHeight) / 2;
      }

      return this.processImage(imageUri, {
        crop: {
          originX,
          originY,
          width: cropWidth,
          height: cropHeight,
        },
        quality,
      });
    } catch (error) {
      console.error('Crop error:', error);
      throw new Error(`Failed to crop image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get optimized image for clothing items (3:4 aspect ratio)
   */
  async optimizeForClothing(
    imageUri: string,
    quality: number = 0.8
  ): Promise<ProcessedImage> {
    return this.cropToAspectRatio(imageUri, 3/4, quality);
  }

  /**
   * Calculate resize dimensions while maintaining aspect ratio
   */
  private calculateResizeDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;

    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    // Scale down if larger than max dimensions
    if (originalWidth > maxWidth) {
      targetWidth = maxWidth;
      targetHeight = targetWidth / aspectRatio;
    }

    if (targetHeight > maxHeight) {
      targetHeight = maxHeight;
      targetWidth = targetHeight * aspectRatio;
    }

    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight),
    };
  }

  /**
   * Convert format string to ImageManipulator format
   */
  private getImageManipulatorFormat(format: string): ImageManipulator.SaveFormat {
    switch (format.toLowerCase()) {
      case 'png':
        return ImageManipulator.SaveFormat.PNG;
      case 'webp':
        return Platform.OS === 'web' ? ImageManipulator.SaveFormat.WEBP : ImageManipulator.SaveFormat.JPEG;
      default:
        return ImageManipulator.SaveFormat.JPEG;
    }
  }

  /**
   * Get file size in a human-readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Validate image file
   */
  async validateImage(imageUri: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      
      if (!fileInfo.exists) {
        return { isValid: false, error: 'File does not exist' };
      }

      // Check file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (fileInfo.size && fileInfo.size > maxSize) {
        return { 
          isValid: false, 
          error: `File too large (${this.formatFileSize(fileInfo.size)}). Maximum size is ${this.formatFileSize(maxSize)}` 
        };
      }

      // Try to get image dimensions to validate it's a valid image
      await ImageManipulator.manipulateAsync(imageUri, [], { format: ImageManipulator.SaveFormat.JPEG });

      return { isValid: true };
    } catch (error) {
      return { 
        isValid: false, 
        error: `Invalid image file: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}

export const imageProcessing = ImageProcessingService.getInstance();

// Hook for using image processing in components
export const useImageProcessing = () => {
  const processImage = (imageUri: string, options?: ImageProcessingOptions) => {
    return imageProcessing.processImage(imageUri, options);
  };

  const processBatch = (
    imageUris: string[], 
    options?: ImageProcessingOptions,
    onProgress?: (progress: BatchProcessingProgress) => void
  ) => {
    return imageProcessing.processBatch(imageUris, options, onProgress);
  };

  const createThumbnail = (imageUri: string, size?: number, quality?: number) => {
    return imageProcessing.createThumbnail(imageUri, size, quality);
  };

  const optimizeForClothing = (imageUri: string, quality?: number) => {
    return imageProcessing.optimizeForClothing(imageUri, quality);
  };

  const validateImage = (imageUri: string) => {
    return imageProcessing.validateImage(imageUri);
  };

  const formatFileSize = (bytes: number) => {
    return imageProcessing.formatFileSize(bytes);
  };

  return {
    processImage,
    processBatch,
    createThumbnail,
    optimizeForClothing,
    validateImage,
    formatFileSize,
  };
};