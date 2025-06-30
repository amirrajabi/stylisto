import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import {
  CompressionPresets,
  compressImage as compressImageUtil,
} from '../utils/imageProcessing';
import { supabase } from './supabase';

// Polyfill for atob in React Native environments
const safeAtob = (base64: string): string => {
  if (typeof atob !== 'undefined') {
    return atob(base64);
  }

  // React Native polyfill using base64-arraybuffer
  try {
    const buffer = decode(base64);
    const uint8Array = new Uint8Array(buffer);
    let binaryString = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binaryString += String.fromCharCode(uint8Array[i]);
    }
    return binaryString;
  } catch (error) {
    throw new Error(`Failed to decode base64 string: ${error}`);
  }
};

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File | string; // File object for web, URI string for mobile
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
  compress?: boolean; // New option to enable/disable compression

  // Virtual Try-On specific options
  processingTime?: number;
  confidence?: number;
  prompt?: string;
  styleInstructions?: string;
  itemsUsed?: string[];
  userImageUrl?: string; // URL of the user's image used for virtual try-on
}

export interface UploadResult {
  data: {
    id: string;
    path: string;
    fullPath: string;
  } | null;
  error: Error | null;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

export interface TransformOptions {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  format?: 'origin' | 'webp' | 'jpeg' | 'png';
  quality?: number;
}

class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Save Virtual Try-On result image to Supabase Storage
   * Simplified and refactored version
   */
  async saveVirtualTryOnResult(
    generatedImageUrl: string,
    userId: string,
    outfitId: string,
    outfitName: string,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    try {
      console.log('🚀 Starting Virtual Try-On save process...');
      console.log('📸 Image URL type:', {
        isDataUri: generatedImageUrl.startsWith('data:'),
        isHttpUrl: generatedImageUrl.startsWith('http'),
        isFileUrl: generatedImageUrl.startsWith('file:'),
        urlLength: generatedImageUrl.length,
        urlPreview: generatedImageUrl.substring(0, 100),
      });

      // Step 1: Verify authentication
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error('Authentication required - please login');
      }

      if (session.user.id !== userId) {
        console.warn('⚠️ User ID mismatch, using session user ID');
        userId = session.user.id;
      }

      console.log('✅ Auth verified:', { userId, email: session.user.email });

      // Step 2: Handle different image URL types and get file data
      let fileData: ArrayBuffer;

      if (generatedImageUrl.startsWith('data:')) {
        // Handle Data URI (base64 encoded image)
        console.log('📦 Processing Data URI...');
        const [mimeInfo, base64Data] = generatedImageUrl.split(',');
        if (!base64Data) {
          throw new Error('Invalid data URI format');
        }

        // Decode base64 to ArrayBuffer using safe polyfill
        const binaryString = safeAtob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileData = bytes.buffer;

        console.log('✅ Data URI processed successfully:', {
          mimeType: mimeInfo,
          sizeBytes: fileData.byteLength,
        });
      } else if (generatedImageUrl.startsWith('http')) {
        // Handle HTTP(S) URLs with retry logic
        console.log('🌐 Downloading from HTTP URL...');

        // Validate URL format before attempting download
        try {
          new URL(generatedImageUrl);
        } catch (urlError) {
          throw new Error(`Invalid URL format: ${generatedImageUrl}`);
        }

        // Check if URL looks like an incomplete Supabase storage URL
        if (
          generatedImageUrl.includes(
            'supabase.co/storage/v1/object/public/virtual-try-on-results'
          )
        ) {
          const urlParts = generatedImageUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];

          // Check if filename looks incomplete (too short or missing extension)
          if (
            !fileName ||
            fileName.length < 10 ||
            (!fileName.includes('.') && fileName.length < 36)
          ) {
            throw new Error(
              `URL appears to be incomplete or corrupted: ${generatedImageUrl}`
            );
          }
        }

        const maxRetries = 3;
        const retryDelay = 1000; // 1 second
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`📥 Download attempt ${attempt}/${maxRetries}`);

            if (Platform.OS === 'web') {
              // Web: Use standard fetch
              const response = await fetch(generatedImageUrl, {
                method: 'GET',
                headers: {
                  Accept: 'image/*',
                  'User-Agent': 'Stylisto-App/1.0',
                },
              });

              if (!response.ok) {
                throw new Error(
                  `HTTP ${response.status}: ${response.statusText}`
                );
              }

              const contentType = response.headers.get('content-type');
              console.log('📄 Content type:', contentType);

              fileData = await response.arrayBuffer();
              console.log('✅ Web download successful:', {
                sizeBytes: fileData.byteLength,
                contentType,
              });
              break;
            } else {
              // React Native: Download to temporary file
              const tempTimestamp = Date.now();
              const tempPath = `${FileSystem.documentDirectory}temp_virtual_tryon_${tempTimestamp}_${attempt}.jpg`;

              console.log('📱 Downloading to temporary file:', tempPath);

              const downloadResult = await FileSystem.downloadAsync(
                generatedImageUrl,
                tempPath,
                {
                  headers: {
                    Accept: 'image/*',
                    'User-Agent': 'Stylisto-App/1.0',
                  },
                }
              );

              if (downloadResult.status !== 200) {
                throw new Error(
                  `Download failed with status: ${downloadResult.status}`
                );
              }

              console.log('📖 Reading file as base64...');
              const base64 = await FileSystem.readAsStringAsync(tempPath, {
                encoding: FileSystem.EncodingType.Base64,
              });

              // Convert base64 to ArrayBuffer
              fileData = decode(base64);

              // Clean up temporary file
              console.log('🧹 Cleaning up temporary file...');
              await FileSystem.deleteAsync(tempPath, { idempotent: true });

              console.log('✅ Mobile download successful:', {
                sizeBytes: fileData.byteLength,
                tempPath,
              });
              break;
            }
          } catch (error) {
            lastError = error as Error;
            console.warn(`❌ Download attempt ${attempt} failed:`, error);

            if (attempt < maxRetries) {
              console.log(`⏳ Retrying in ${retryDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
            }
          }
        }

        if (!fileData!) {
          throw new Error(
            `Failed to download image after ${maxRetries} attempts. Last error: ${lastError?.message}`
          );
        }
      } else if (generatedImageUrl.startsWith('file://')) {
        // Handle local file URLs
        console.log('📁 Processing local file...');

        const fileInfo = await FileSystem.getInfoAsync(generatedImageUrl);
        if (!fileInfo.exists) {
          throw new Error(`Local file not found: ${generatedImageUrl}`);
        }

        const base64 = await FileSystem.readAsStringAsync(generatedImageUrl, {
          encoding: FileSystem.EncodingType.Base64,
        });
        fileData = decode(base64);

        console.log('✅ Local file processed successfully:', {
          sizeBytes: fileData.byteLength,
        });
      } else {
        throw new Error(
          `Unsupported URL format: ${generatedImageUrl.substring(0, 50)}...`
        );
      }

      // Validate file data
      if (!fileData || fileData.byteLength === 0) {
        throw new Error('Image file is empty or invalid');
      }

      if (fileData.byteLength > 50 * 1024 * 1024) {
        // 50MB limit
        throw new Error(
          `Image file too large: ${fileData.byteLength} bytes (max 50MB)`
        );
      }

      console.log('✅ Image data validated:', {
        sizeBytes: fileData.byteLength,
        sizeMB: (fileData.byteLength / (1024 * 1024)).toFixed(2),
      });

      // Step 3: Create storage path
      const timestamp = Date.now();
      const fileName = `${outfitId}_${timestamp}.jpg`;
      const storagePath = `${userId}/virtual-tryon/${fileName}`;

      console.log('📁 Storage path:', storagePath);

      // Step 4: Upload to storage with retry logic
      const maxUploadRetries = 2;
      let uploadError: Error | null = null;
      let uploadData: any = null;

      for (let attempt = 1; attempt <= maxUploadRetries; attempt++) {
        try {
          console.log(`📤 Upload attempt ${attempt}/${maxUploadRetries}`);

          // Check if bucket exists and is accessible
          try {
            const { data: bucketData, error: bucketError } =
              await supabase.storage
                .from('virtual-try-on-results')
                .list('', { limit: 1 });

            if (bucketError) {
              console.warn(
                '⚠️ Bucket accessibility check failed:',
                bucketError
              );
            } else {
              console.log('✅ Bucket is accessible');
            }
          } catch (bucketCheckError) {
            console.warn(
              '⚠️ Could not verify bucket access:',
              bucketCheckError
            );
          }

          const { data, error } = await supabase.storage
            .from('virtual-try-on-results')
            .upload(storagePath, fileData, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error('❌ Storage upload error details:', {
              message: error.message,
              name: error.name,
              status: (error as any)?.status,
              statusCode: (error as any)?.statusCode,
              details: (error as any)?.details,
            });
            throw error;
          }

          uploadData = data;
          console.log('✅ File uploaded successfully');
          break;
        } catch (error) {
          uploadError = error as Error;
          console.warn(`❌ Upload attempt ${attempt} failed:`, error);

          if (attempt < maxUploadRetries) {
            console.log('⏳ Retrying upload...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (!uploadData) {
        throw new Error(
          `Upload failed after ${maxUploadRetries} attempts: ${uploadError?.message}`
        );
      }

      // Step 5: Get public URL
      const { data: urlData } = supabase.storage
        .from('virtual-try-on-results')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // Step 6: Save to database using the new function
      try {
        // Generate a UUID for the outfit if it's not already one
        let outfitUuid = null;
        try {
          // Check if outfitId is a valid UUID
          if (
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              outfitId
            )
          ) {
            outfitUuid = outfitId;
          } else {
            // Generate a new UUID for this outfit
            const { data: uuidData } = await supabase.rpc('gen_random_uuid');
            outfitUuid = uuidData;
            console.log('📝 Generated new UUID for outfit:', outfitUuid);
          }
        } catch (e) {
          console.log('📝 Using null for outfit ID');
        }

        const { data: dbResult, error: dbError } = await supabase.rpc(
          'save_virtual_tryon_result',
          {
            p_outfit_id: outfitUuid,
            p_outfit_name: outfitName,
            p_user_image_url:
              options.userImageUrl || 'https://via.placeholder.com/400x600',
            p_generated_image_url: publicUrl,
            p_storage_path: storagePath,
            p_processing_time_ms: options.processingTime || 0,
            p_confidence_score: options.confidence || 0.85,
            p_prompt_used: options.prompt || `Virtual try-on of ${outfitName}`,
            p_style_instructions: options.styleInstructions || 'natural fit',
            p_items_used: options.itemsUsed || [],
          }
        );

        if (dbError) {
          console.error('❌ Database save error:', dbError);
          // Continue even if DB save fails - we have the image in storage
        } else if (dbResult?.success) {
          console.log('✅ Database save successful:', dbResult);
        } else {
          console.warn('⚠️ Database save returned:', dbResult);
        }
      } catch (dbError) {
        console.error('❌ Database operation failed:', dbError);
        // Don't fail the whole operation - storage upload was successful
      }

      // Return success - image is uploaded to storage
      return {
        data: {
          id: uploadData.id,
          path: uploadData.path,
          fullPath: uploadData.fullPath || storagePath,
        },
        error: null,
      };
    } catch (error) {
      console.error('💥 Virtual Try-On save failed:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Save failed'),
      };
    }
  }

  /**
   * Upload image with optional compression
   */
  async uploadImage(
    imageUri: string,
    userId: string,
    itemType: 'clothing' | 'outfit' | 'profile',
    itemId?: string,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    try {
      let finalImageUri = imageUri;

      // Compress image if requested (default: true)
      if (options.compress !== false) {
        try {
          // Choose compression preset based on item type
          const compressionOptions =
            itemType === 'profile'
              ? CompressionPresets.profile
              : itemType === 'outfit'
                ? CompressionPresets.wardrobe
                : CompressionPresets.wardrobe;

          const compressionResult = await compressImageUtil(
            imageUri,
            compressionOptions
          );
          finalImageUri = compressionResult.uri;

          console.log(
            `Image compressed for ${itemType}: ${compressionResult.compressionRatio * 100}% of original size`
          );
        } catch (compressionError) {
          console.warn(
            'Image compression failed, using original:',
            compressionError
          );
          // Continue with original image if compression fails
        }
      }

      // Use user-avatars bucket for profile images, wardrobe-images for others
      const bucket =
        itemType === 'profile' ? 'user-avatars' : 'wardrobe-images';
      const timestamp = Date.now();
      const fileExtension =
        options.compress !== false
          ? 'jpg'
          : this.getFileExtension(finalImageUri);

      // Organize storage paths by user and item type
      let basePath: string;
      let fileName: string;
      let fullPath: string;

      if (itemType === 'profile') {
        // Profile images go to user-avatars/[user-id]/profile/
        basePath = `${userId}/profile`;
        fileName = itemId
          ? `${itemId}_${timestamp}.${fileExtension}`
          : `avatar_${timestamp}.${fileExtension}`;
        fullPath = `${basePath}/${fileName}`;
      } else {
        // Other images go to wardrobe-images/[user-id]/[item-type]/
        basePath = `${userId}/${itemType}`;
        fileName = itemId
          ? `${itemId}_${timestamp}.${fileExtension}`
          : `${timestamp}.${fileExtension}`;
        fullPath = `${basePath}/${fileName}`;
      }

      let fileData: ArrayBuffer;
      let contentType =
        options.contentType ||
        (options.compress !== false
          ? 'image/jpeg'
          : this.getMimeType(fileExtension));

      if (Platform.OS === 'web') {
        // Web: Convert data URL to blob
        const response = await fetch(finalImageUri);
        fileData = await response.arrayBuffer();
      } else {
        // Mobile: Handle different URI types
        if (
          finalImageUri.startsWith('http://') ||
          finalImageUri.startsWith('https://')
        ) {
          // Remote URL: Download first, then read
          const downloadResult = await FileSystem.downloadAsync(
            finalImageUri,
            FileSystem.documentDirectory +
              'temp_' +
              Date.now() +
              '.' +
              fileExtension
          );
          const base64 = await FileSystem.readAsStringAsync(
            downloadResult.uri,
            {
              encoding: FileSystem.EncodingType.Base64,
            }
          );
          fileData = decode(base64);

          // Clean up temporary file
          await FileSystem.deleteAsync(downloadResult.uri, {
            idempotent: true,
          });
        } else if (
          finalImageUri.startsWith('file://') ||
          finalImageUri.startsWith('/')
        ) {
          // Local file: Read directly
          const fileInfo = await FileSystem.getInfoAsync(finalImageUri);
          if (!fileInfo.exists) {
            throw new Error(`File not found: ${finalImageUri}`);
          }

          const base64 = await FileSystem.readAsStringAsync(finalImageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fileData = decode(base64);
        } else if (finalImageUri.startsWith('data:')) {
          // Data URL: Extract base64
          const base64 = finalImageUri.split(',')[1];
          fileData = decode(base64);
        } else {
          throw new Error(`Unsupported URI format: ${finalImageUri}`);
        }
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fullPath, fileData, {
          contentType,
          cacheControl: options.cacheControl || '3600',
          upsert: options.upsert || false,
          metadata: {
            userId,
            itemType,
            itemId,
            uploadedAt: new Date().toISOString(),
            platform: Platform.OS,
            compressed: options.compress !== false,
            originalUri: imageUri !== finalImageUri ? imageUri : undefined,
            ...options.metadata,
          },
        });

      if (error) {
        throw error;
      }

      console.log(
        `Image uploaded successfully: ${fullPath} (${fileData.byteLength} bytes)`
      );

      return {
        data: data
          ? {
              id: data.id,
              path: data.path,
              fullPath: data.fullPath,
            }
          : null,
        error: null,
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        data: null,
        error: error as Error,
      };
    }
  }

  /**
   * Upload multiple images with progress tracking and compression
   */
  async uploadBatch(
    imageUris: string[],
    userId: string,
    itemType: 'clothing' | 'outfit' | 'profile',
    itemId?: string,
    onProgress?: (completed: number, total: number) => void,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];

      try {
        const result = await this.uploadImage(
          imageUri,
          userId,
          itemType,
          itemId,
          options
        );
        results.push(result);

        onProgress?.(i + 1, imageUris.length);
      } catch (error) {
        results.push({
          data: null,
          error: error as Error,
        });
      }
    }

    return results;
  }

  /**
   * Get public URL for an image with optional transformations
   */
  getImageUrl(
    path: string,
    bucket: string = 'wardrobe-images',
    transforms?: TransformOptions
  ): string {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
        transform: transforms as any,
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      return '';
    }
  }

  /**
   * Get simple image URL without transformations to avoid render/image endpoint issues
   */
  getSimpleImageUrl(path: string, bucket: string = 'wardrobe-images'): string {
    try {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    } catch (error) {
      console.error('Error getting simple image URL:', error);
      return '';
    }
  }

  /**
   * Get optimized image URL for different use cases
   */
  getOptimizedImageUrl(
    path: string,
    type: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium',
    bucket?: string
  ): string {
    // Auto-detect bucket based on path if not provided
    const finalBucket = bucket || this.getBucketFromPath(path);

    // Use simple URLs without transformations to avoid render/image endpoint 400 errors
    // Client-side optimization will handle resizing as needed
    return this.getSimpleImageUrl(path, finalBucket);
  }

  /**
   * Determine the appropriate bucket based on the file path
   */
  private getBucketFromPath(path: string): string {
    // If path contains profile images pattern, use user-avatars bucket
    if (path.includes('/profile/') || path.includes('avatar_')) {
      return 'user-avatars';
    }
    // Default to wardrobe-images for clothing/outfit items
    return 'wardrobe-images';
  }

  /**
   * Delete image from storage
   */
  async deleteImage(
    path: string,
    bucket: string = 'wardrobe-images'
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      return { error };
    } catch (error) {
      console.error('Delete error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Delete multiple images
   */
  async deleteBatch(
    paths: string[],
    bucket: string = 'wardrobe-images'
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove(paths);

      return { error };
    } catch (error) {
      console.error('Batch delete error:', error);
      return { error: error as Error };
    }
  }

  /**
   * List files in a directory
   */
  async listFiles(
    path: string,
    bucket: string = 'wardrobe-images',
    options: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    } = {}
  ): Promise<{ data: StorageFile[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(path, {
        limit: options.limit || 100,
        offset: options.offset || 0,
        sortBy: options.sortBy || { column: 'created_at', order: 'desc' },
      });

      return { data, error };
    } catch (error) {
      console.error('List files error:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get file metadata
   */
  async getFileInfo(
    path: string,
    bucket: string = 'wardrobe-images'
  ): Promise<{ data: any | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', {
        search: path,
        limit: 1,
      });

      if (error) throw error;

      return {
        data: data && data.length > 0 ? data[0] : null,
        error: null,
      };
    } catch (error) {
      console.error('Get file info error:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Clean up orphaned files (files not referenced in database)
   */
  async cleanupOrphanedFiles(
    userId: string,
    dryRun: boolean = true
  ): Promise<{ deletedFiles: string[]; errors: string[] }> {
    const deletedFiles: string[] = [];
    const errors: string[] = [];

    try {
      // Get all files for user
      const { data: files, error: listError } = await this.listFiles(
        `${userId}/`
      );

      if (listError) {
        errors.push(`Failed to list files: ${listError.message}`);
        return { deletedFiles, errors };
      }

      if (!files) {
        return { deletedFiles, errors };
      }

      // Get all referenced image paths from database
      const { data: clothingItems } = await supabase
        .from('clothing_items')
        .select('image_url')
        .eq('user_id', userId);

      const { data: savedOutfits } = await supabase
        .from('saved_outfits')
        .select('image_url')
        .eq('user_id', userId);

      const { data: userProfiles } = await supabase
        .from('users')
        .select('avatar_url, full_body_image_url')
        .eq('id', userId);

      // Extract referenced paths
      const referencedPaths = new Set<string>();

      clothingItems?.forEach(item => {
        if (item.image_url) {
          const path = this.extractPathFromUrl(item.image_url);
          if (path) referencedPaths.add(path);
        }
      });

      savedOutfits?.forEach(outfit => {
        if (outfit.image_url) {
          const path = this.extractPathFromUrl(outfit.image_url);
          if (path) referencedPaths.add(path);
        }
      });

      userProfiles?.forEach(profile => {
        if (profile.avatar_url) {
          const path = this.extractPathFromUrl(profile.avatar_url);
          if (path) referencedPaths.add(path);
        }
        if (profile.full_body_image_url) {
          const path = this.extractPathFromUrl(profile.full_body_image_url);
          if (path) referencedPaths.add(path);
        }
      });

      // Find orphaned files
      for (const file of files) {
        const fullPath = `${userId}/${file.name}`;
        if (!referencedPaths.has(fullPath)) {
          if (!dryRun) {
            const { error } = await this.deleteImage(fullPath);
            if (error) {
              errors.push(`Failed to delete ${fullPath}: ${error.message}`);
            } else {
              deletedFiles.push(fullPath);
            }
          } else {
            deletedFiles.push(fullPath); // In dry run, just track what would be deleted
          }
        }
      }
    } catch (error) {
      errors.push(
        `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return { deletedFiles, errors };
  }

  /**
   * Get storage statistics for a user
   */
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
  }> {
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: {} as Record<string, number>,
      sizeByType: {} as Record<string, number>,
    };

    try {
      const { data: files } = await this.listFiles(`${userId}/`);

      if (files) {
        for (const file of files) {
          const fileType = this.getItemTypeFromPath(file.name);
          const fileSize = file.metadata?.size || 0;

          stats.totalFiles++;
          stats.totalSize += fileSize;

          stats.filesByType[fileType] = (stats.filesByType[fileType] || 0) + 1;
          stats.sizeByType[fileType] =
            (stats.sizeByType[fileType] || 0) + fileSize;
        }
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
    }

    return stats;
  }

  /**
   * Create a signed URL for temporary access to a file
   */
  async createSignedUrl(
    path: string,
    expiresIn: number = 3600, // 1 hour default
    bucket: string = 'wardrobe-images'
  ): Promise<{ data: { signedUrl: string } | null; error: Error | null }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      return { data, error };
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Move a file from one location to another
   */
  async moveFile(
    fromPath: string,
    toPath: string,
    bucket: string = 'wardrobe-images'
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .move(fromPath, toPath);

      return { error };
    } catch (error) {
      console.error('Error moving file:', error);
      return { error: error as Error };
    }
  }

  /**
   * Copy a file from one location to another
   */
  async copyFile(
    fromPath: string,
    toPath: string,
    bucket: string = 'wardrobe-images'
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .copy(fromPath, toPath);

      return { error };
    } catch (error) {
      console.error('Error copying file:', error);
      return { error: error as Error };
    }
  }

  private getFileExtension(uri: string): string {
    return uri.split('.').pop()?.toLowerCase() || 'jpg';
  }

  private getMimeType(extension: string): string {
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      default:
        return 'image/jpeg';
    }
  }

  extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract path after /storage/v1/object/public/bucket-name/
      const match = pathname.match(
        /\/storage\/v1\/object\/public\/[^\/]+\/(.+)/
      );
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }

  private getItemTypeFromPath(path: string): string {
    if (path.includes('/clothing/')) return 'clothing';
    if (path.includes('/outfit/')) return 'outfit';
    if (path.includes('/profile/')) return 'profile';
    return 'unknown';
  }

  /**
   * Test authentication context for debugging RLS issues
   */
  async testAuth(): Promise<{
    isAuthenticated: boolean;
    user: any;
    error: string | null;
  }> {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        return {
          isAuthenticated: false,
          user: null,
          error: `Auth error: ${authError.message}`,
        };
      }

      if (!user) {
        return {
          isAuthenticated: false,
          user: null,
          error: 'No authenticated user found',
        };
      }

      // Test if we can call the debug function in the database
      try {
        const { data: debugData, error: debugError } =
          await supabase.rpc('debug_auth_context');

        console.log('🔍 Debug auth context result:', debugData);

        return {
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            aud: user.aud,
            confirmed_at: user.confirmed_at,
            debugContext: debugData,
          },
          error: debugError?.message || null,
        };
      } catch (debugError) {
        return {
          isAuthenticated: true,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            aud: user.aud,
            confirmed_at: user.confirmed_at,
          },
          error: `Debug function failed: ${debugError instanceof Error ? debugError.message : 'Unknown error'}`,
        };
      }
    } catch (error) {
      return {
        isAuthenticated: false,
        user: null,
        error: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Test Virtual Try-On upload functionality
   */
  async testVirtualTryOnUpload(userId: string): Promise<void> {
    try {
      console.log('🧪 Testing Virtual Try-On upload functionality...');

      // Test with a small data URI
      const testDataUri =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

      const result = await this.saveVirtualTryOnResult(
        testDataUri,
        userId,
        'test-outfit',
        'Test Outfit',
        {
          processingTime: 1000,
          confidence: 0.9,
          prompt: 'Test virtual try-on',
          styleInstructions: 'Test style',
          itemsUsed: ['test-item'],
        }
      );

      if (result.error) {
        console.error('❌ Virtual Try-On test failed:', result.error);
        throw result.error;
      }

      console.log('✅ Virtual Try-On test successful:', result.data);

      // Clean up test file
      if (result.data?.path) {
        try {
          await supabase.storage
            .from('virtual-try-on-results')
            .remove([result.data.path]);
          console.log('🧹 Test file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up test file:', cleanupError);
        }
      }
    } catch (error) {
      console.error('💥 Virtual Try-On test error:', error);
      throw error;
    }
  }
}

export const storageService = StorageService.getInstance();
