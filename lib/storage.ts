import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface UploadOptions {
  bucket: string;
  path: string;
  file: File | string; // File object for web, URI string for mobile
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
  metadata?: Record<string, any>;
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
   * Upload image to Supabase Storage with automatic path organization
   */
  async uploadImage(
    imageUri: string,
    userId: string,
    itemType: 'clothing' | 'outfit' | 'profile',
    itemId?: string,
    options: Partial<UploadOptions> = {}
  ): Promise<UploadResult> {
    try {
      const bucket = 'wardrobe-images';
      const timestamp = Date.now();
      const fileExtension = this.getFileExtension(imageUri);

      // Organize storage paths by user and item type
      const basePath = `${userId}/${itemType}`;
      const fileName = itemId
        ? `${itemId}_${timestamp}.${fileExtension}`
        : `${timestamp}.${fileExtension}`;
      const fullPath = `${basePath}/${fileName}`;

      let fileData: ArrayBuffer;
      let contentType = options.contentType || this.getMimeType(fileExtension);

      if (Platform.OS === 'web') {
        // Web: Convert data URL to blob
        const response = await fetch(imageUri);
        fileData = await response.arrayBuffer();
      } else {
        // Mobile: Handle different URI types
        if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
          // Remote URL: Download first, then read
          const downloadResult = await FileSystem.downloadAsync(
            imageUri,
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
        } else if (imageUri.startsWith('file://') || imageUri.startsWith('/')) {
          // Local file: Read directly
          const fileInfo = await FileSystem.getInfoAsync(imageUri);
          if (!fileInfo.exists) {
            throw new Error(`File not found: ${imageUri}`);
          }

          const base64 = await FileSystem.readAsStringAsync(imageUri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          fileData = decode(base64);
        } else if (imageUri.startsWith('data:')) {
          // Data URL: Extract base64
          const base64 = imageUri.split(',')[1];
          fileData = decode(base64);
        } else {
          throw new Error(`Unsupported URI format: ${imageUri}`);
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
            ...options.metadata,
          },
        });

      if (error) {
        throw error;
      }

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
   * Upload multiple images with progress tracking
   */
  async uploadBatch(
    imageUris: string[],
    userId: string,
    itemType: 'clothing' | 'outfit' | 'profile',
    itemId?: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      const imageUri = imageUris[i];

      try {
        const result = await this.uploadImage(
          imageUri,
          userId,
          itemType,
          itemId
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
   * Get optimized image URL for different use cases
   */
  getOptimizedImageUrl(
    path: string,
    type: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium',
    bucket: string = 'wardrobe-images'
  ): string {
    const transformOptions: Record<string, TransformOptions> = {
      thumbnail: {
        width: 200,
        height: 200,
        resize: 'cover',
        format: 'webp',
        quality: 80,
      },
      medium: {
        width: 800,
        height: 1000,
        resize: 'contain',
        format: 'webp',
        quality: 85,
      },
      large: {
        width: 1200,
        height: 1600,
        resize: 'contain',
        format: 'webp',
        quality: 90,
      },
      original: {} as TransformOptions,
    };

    return this.getImageUrl(path, bucket, transformOptions[type]);
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
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      const { data: savedOutfits } = await supabase
        .from('saved_outfits')
        .select('image_url')
        .eq('user_id', userId)
        .not('deleted_at', 'is', null);

      const { data: userProfile } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      // Collect all referenced paths
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

      if (userProfile?.avatar_url) {
        const path = this.extractPathFromUrl(userProfile.avatar_url);
        if (path) referencedPaths.add(path);
      }

      // Find orphaned files
      const orphanedFiles = files.filter(file => {
        const fullPath = `${userId}/${file.name}`;
        return !referencedPaths.has(fullPath);
      });

      if (!dryRun && orphanedFiles.length > 0) {
        // Delete orphaned files
        const pathsToDelete = orphanedFiles.map(
          file => `${userId}/${file.name}`
        );
        const { error: deleteError } = await this.deleteBatch(pathsToDelete);

        if (deleteError) {
          errors.push(`Failed to delete files: ${deleteError.message}`);
        } else {
          deletedFiles.push(...pathsToDelete);
        }
      } else {
        // Dry run - just return what would be deleted
        deletedFiles.push(
          ...orphanedFiles.map(file => `${userId}/${file.name}`)
        );
      }
    } catch (error) {
      errors.push(
        `Cleanup error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return { deletedFiles, errors };
  }

  /**
   * Get storage usage statistics for a user
   */
  async getStorageStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
  }> {
    try {
      const { data: files } = await this.listFiles(`${userId}/`);

      if (!files) {
        return {
          totalFiles: 0,
          totalSize: 0,
          filesByType: {},
          sizeByType: {},
        };
      }

      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        filesByType: {} as Record<string, number>,
        sizeByType: {} as Record<string, number>,
      };

      files.forEach(file => {
        const type = this.getItemTypeFromPath(file.name);
        const size = file.metadata?.size || 0;

        stats.totalSize += size;
        stats.filesByType[type] = (stats.filesByType[type] || 0) + 1;
        stats.sizeByType[type] = (stats.sizeByType[type] || 0) + size;
      });

      return stats;
    } catch (error) {
      console.error('Storage stats error:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        filesByType: {},
        sizeByType: {},
      };
    }
  }

  /**
   * Create signed URL for temporary access
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
      console.error('Signed URL error:', error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Move file to different location
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
      console.error('Move file error:', error);
      return { error: error as Error };
    }
  }

  /**
   * Copy file to different location
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
      console.error('Copy file error:', error);
      return { error: error as Error };
    }
  }

  // Helper methods
  private getFileExtension(uri: string): string {
    const extension = uri.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      tiff: 'image/tiff',
      svg: 'image/svg+xml',
    };

    return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
  }

  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(
        part => part === 'wardrobe-images'
      );

      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }

      return null;
    } catch {
      return null;
    }
  }

  private getItemTypeFromPath(path: string): string {
    if (path.includes('/clothing/')) return 'clothing';
    if (path.includes('/outfit/')) return 'outfit';
    if (path.includes('/profile/')) return 'profile';
    return 'unknown';
  }
}

export const storageService = StorageService.getInstance();
