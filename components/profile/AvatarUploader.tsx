import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CompressionPresets, compressImage } from '../../utils/imageProcessing';

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  onImageUpdate?: (url: string) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  avatarUrl,
  onImageUpdate,
}) => {
  const { user, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState(avatarUrl);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Sync with prop changes
  useEffect(() => {
    if (avatarUrl !== currentAvatarUrl) {
      setCurrentAvatarUrl(avatarUrl);
      setImageError(false);
      setImageLoading(!!avatarUrl); // Set loading only if there's a URL
    }
  }, [avatarUrl]);

  const pickImageFromGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permission Required',
        'Permission to access camera roll is required!'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1, // Use max quality from picker, we'll compress manually
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permission Required',
        'Permission to access camera is required!'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      aspect: [1, 1],
      quality: 1, // Use max quality from camera, we'll compress manually
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const showImagePicker = () => {
    Alert.alert('Select Image', 'Choose an option', [
      {
        text: 'Camera',
        onPress: pickImageFromCamera,
      },
      {
        text: 'Gallery',
        onPress: pickImageFromGallery,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const clearImageCache = () => {
    try {
      // Clear Expo Image cache
      if (Image.clearMemoryCache) {
        Image.clearMemoryCache();
      }
      if (Image.clearDiskCache) {
        Image.clearDiskCache();
      }
      console.log('Image cache cleared for avatar update');
    } catch (error) {
      console.warn('Failed to clear image cache:', error);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    setUploading(true);

    try {
      // Compress image for profile avatar
      console.log('Compressing avatar image...');
      const compressionResult = await compressImage(
        uri,
        CompressionPresets.profile
      );
      const compressedUri = compressionResult.uri;

      console.log(
        `Avatar compressed: ${compressionResult.compressionRatio * 100}% of original size`
      );

      const fileExt = 'jpg';
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/profile/${fileName}`;

      const response = await fetch(compressedUri);
      const fileData = await response.arrayBuffer();

      console.log(`Uploading compressed avatar: ${fileData.byteLength} bytes`);

      const { data, error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('user-avatars').getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);

      // Clear cache before setting new URL
      clearImageCache();

      // Test if the URL is accessible
      try {
        const testResponse = await fetch(publicUrl, { method: 'HEAD' });
        console.log(
          'URL accessibility test:',
          testResponse.status,
          testResponse.statusText
        );
      } catch (testError) {
        console.warn('URL accessibility test failed:', testError);
      }

      // Update user profile with new avatar URL
      try {
        await updateUserProfile({ avatar_url: publicUrl });

        // Set a delay to ensure the image is available
        setTimeout(() => {
          setCurrentAvatarUrl(publicUrl);
          setImageLoading(true);
          setImageError(false);
          onImageUpdate?.(publicUrl);
        }, 1000);

        Alert.alert('Success', 'Profile picture updated successfully!');
        console.log('Avatar updated successfully:', publicUrl);
      } catch (profileError: any) {
        console.error('Error updating profile:', profileError);

        const errorMessage = profileError.message || '';
        const statusCode = profileError.statusCode || '';

        // Handle gracefully and still update UI
        setTimeout(() => {
          setCurrentAvatarUrl(publicUrl);
          setImageLoading(true);
          setImageError(false);
          onImageUpdate?.(publicUrl);
        }, 1000);

        if (
          errorMessage.includes('avatar_url') ||
          errorMessage.includes('column')
        ) {
          Alert.alert(
            'Upload Complete',
            'Profile picture uploaded successfully! The database will be updated once the migration is applied.'
          );
        } else if (
          errorMessage.includes('row-level security') ||
          errorMessage.includes('Unauthorized') ||
          statusCode === '403'
        ) {
          Alert.alert(
            'Upload Complete',
            'Your profile picture has been uploaded successfully! Profile database update is pending.'
          );
        } else {
          throw profileError;
        }
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleImageLoad = () => {
    console.log('Avatar image loaded successfully');
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = (error: any) => {
    console.error('Avatar image failed to load:', error);
    console.error('Current avatar URL:', currentAvatarUrl);
    console.error('Prop avatar URL:', avatarUrl);

    setImageLoading(false);
    setImageError(true);

    // If this is a newly uploaded image that failed to load,
    // try falling back to the original avatar URL
    if (currentAvatarUrl && avatarUrl && currentAvatarUrl !== avatarUrl) {
      console.log('Falling back to original avatar URL');
      setTimeout(() => {
        setCurrentAvatarUrl(avatarUrl);
        setImageLoading(true);
        setImageError(false);
      }, 2000);
    }
  };

  const renderAvatarContent = () => {
    const hasAvatarUrl = currentAvatarUrl || avatarUrl;

    console.log('Rendering avatar content - hasAvatarUrl:', hasAvatarUrl);
    console.log('Current avatar URL:', currentAvatarUrl);
    console.log('Prop avatar URL:', avatarUrl);
    console.log('Image loading:', imageLoading);
    console.log('Image error:', imageError);

    if (!hasAvatarUrl) {
      return (
        <View style={styles.avatarPlaceholder}>
          <User size={48} color={Colors.primary[500]} />
        </View>
      );
    }

    // Show placeholder if error and no loading state
    if (imageError && !imageLoading) {
      return (
        <View style={styles.avatarPlaceholder}>
          <User size={48} color={Colors.primary[500]} />
        </View>
      );
    }

    return (
      <>
        <Image
          source={{ uri: hasAvatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          transition={200}
          onLoad={handleImageLoad}
          onError={handleImageError}
          accessibilityIgnoresInvertColors
          cachePolicy="none" // Don't cache to always get fresh image
        />

        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={Colors.white} />
          </View>
        )}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={styles.avatarContainer}
      onPress={showImagePicker}
      disabled={uploading}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Update profile picture"
      accessibilityHint="Double tap to update your profile picture"
    >
      {renderAvatarContent()}

      <View style={styles.cameraButton}>
        {uploading ? (
          <ActivityIndicator size={16} color={Colors.white} />
        ) : (
          <Camera size={16} color={Colors.white} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary[100],
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
});
