import { useCallback, useState } from 'react';
import { storageService, UploadOptions, UploadResult } from '../lib/storage';

export interface UploadProgress {
  completed: number;
  total: number;
  percentage: number;
}

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    completed: 0,
    total: 0,
    percentage: 0,
  });

  const uploadImage = useCallback(
    async (
      imageUri: string,
      userId: string,
      itemType: 'clothing' | 'outfit' | 'profile',
      itemId?: string,
      options?: Partial<UploadOptions>
    ): Promise<UploadResult> => {
      setUploading(true);

      try {
        const result = await storageService.uploadImage(
          imageUri,
          userId,
          itemType,
          itemId,
          options
        );
        return result;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const uploadBatch = useCallback(
    async (
      imageUris: string[],
      userId: string,
      itemType: 'clothing' | 'outfit' | 'profile',
      itemId?: string,
      options?: Partial<UploadOptions>
    ): Promise<UploadResult[]> => {
      setUploading(true);
      setUploadProgress({
        completed: 0,
        total: imageUris.length,
        percentage: 0,
      });

      try {
        const results = await storageService.uploadBatch(
          imageUris,
          userId,
          itemType,
          itemId,
          (completed, total) => {
            const percentage = Math.round((completed / total) * 100);
            setUploadProgress({ completed, total, percentage });
          },
          options
        );

        return results;
      } finally {
        setUploading(false);
        setUploadProgress({ completed: 0, total: 0, percentage: 0 });
      }
    },
    []
  );

  const getImageUrl = useCallback(
    (
      path: string,
      type: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'
    ): string => {
      return storageService.getOptimizedImageUrl(path, type);
    },
    []
  );

  const deleteImage = useCallback(async (path: string) => {
    return storageService.deleteImage(path);
  }, []);

  const deleteBatch = useCallback(async (paths: string[]) => {
    return storageService.deleteBatch(paths);
  }, []);

  const cleanupOrphanedFiles = useCallback(
    async (userId: string, dryRun: boolean = true) => {
      return storageService.cleanupOrphanedFiles(userId, dryRun);
    },
    []
  );

  const getStorageStats = useCallback(async (userId: string) => {
    return storageService.getStorageStats(userId);
  }, []);

  return {
    uploading,
    uploadProgress,
    uploadImage,
    uploadBatch,
    getImageUrl,
    deleteImage,
    deleteBatch,
    cleanupOrphanedFiles,
    getStorageStats,
  };
};
