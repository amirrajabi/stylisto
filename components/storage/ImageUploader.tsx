import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { Camera, Image as ImageIcon, X, Upload, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useStorage, UploadProgress } from '../../hooks/useStorage';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface ImageUploaderProps {
  onImageUploaded: (imageUrl: string) => void;
  itemType: 'clothing' | 'outfit' | 'profile';
  itemId?: string;
  existingImageUrl?: string;
  maxSize?: number; // in MB
  aspectRatio?: number; // width/height
  style?: any;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUploaded,
  itemType,
  itemId,
  existingImageUrl,
  maxSize = 10, // 10MB default
  aspectRatio = 3/4, // 3:4 default for clothing
  style,
}) => {
  const { user } = useAuth();
  const { uploading, uploadProgress, uploadImage, getImageUrl } = useStorage();
  
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState<string | null>(null);

  const handleCameraPress = useCallback(() => {
    if (!user) {
      setError('You must be logged in to upload images');
      return;
    }

    // Navigate to camera screen
    router.push({
      pathname: '/camera',
      params: {
        mode: 'camera',
        maxPhotos: '1',
        returnTo: '/wardrobe/add-item',
        itemType,
        itemId,
      },
    });
  }, [user, itemType, itemId]);

  const handleGalleryPress = useCallback(() => {
    if (!user) {
      setError('You must be logged in to upload images');
      return;
    }

    // Navigate to image picker
    router.push({
      pathname: '/camera',
      params: {
        mode: 'gallery',
        maxPhotos: '1',
        returnTo: '/wardrobe/add-item',
        itemType,
        itemId,
      },
    });
  }, [user, itemType, itemId]);

  const handleUpload = useCallback(async (imageUri: string) => {
    if (!user) {
      setError('You must be logged in to upload images');
      return;
    }

    setError(null);

    try {
      const result = await uploadImage(imageUri, user.id, itemType, itemId);
      
      if (result.error) {
        setError(`Upload failed: ${result.error.message}`);
        return;
      }

      if (result.data) {
        const publicUrl = getImageUrl(result.data.path, 'medium');
        setImageUrl(publicUrl);
        onImageUploaded(publicUrl);
      }
    } catch (error) {
      setError(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [user, itemType, itemId, uploadImage, getImageUrl, onImageUploaded]);

  const handleRemoveImage = useCallback(() => {
    setImageUrl(null);
    onImageUploaded('');
  }, [onImageUploaded]);

  return (
    <View style={[styles.container, style]}>
      {imageUrl ? (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image,
              { aspectRatio },
            ]}
            contentFit="cover"
          />
          
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemoveImage}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.changeButton}
            onPress={handleCameraPress}
          >
            <Camera size={20} color="#FFFFFF" />
            <Text style={styles.changeButtonText}>Change</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.uploaderContainer}>
          {uploading ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[700]} />
              <Text style={styles.uploadingText}>
                Uploading... {uploadProgress.percentage}%
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleCameraPress}
                >
                  <Camera size={24} color={Colors.primary[700]} />
                  <Text style={styles.buttonText}>Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={handleGalleryPress}
                >
                  <ImageIcon size={24} color={Colors.primary[700]} />
                  <Text style={styles.buttonText}>Gallery</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.helperText}>
                Max file size: {maxSize}MB
              </Text>
            </>
          )}
          
          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color={Colors.error[500]} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: undefined,
    borderRadius: Layout.borderRadius.lg,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeButton: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    gap: Spacing.xs,
  },
  changeButtonText: {
    ...Typography.caption.medium,
    color: Colors.white,
  },
  uploaderContainer: {
    width: '100%',
    aspectRatio: 3/4,
    borderWidth: 2,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
    borderRadius: Layout.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    padding: Spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: 100,
  },
  buttonText: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
  helperText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  uploadingContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  uploadingText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  errorText: {
    ...Typography.caption.medium,
    color: Colors.error[700],
    flex: 1,
  },
});