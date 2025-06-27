import * as ImagePicker from 'expo-image-picker';
import { Camera, User } from 'lucide-react-native';
import React, { useState } from 'react';
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
import OptimizedImage from '../ui/OptimizedImage';

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
      console.log(
        `Original: ${compressionResult.originalSize.width}x${compressionResult.originalSize.height}`
      );
      console.log(
        `Compressed: ${compressionResult.compressedSize.width}x${compressionResult.compressedSize.height}`
      );

      const fileExt = 'jpg'; // Always use JPEG for compressed images
      const fileName = `avatar_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/profile/${fileName}`;

      let fileData: ArrayBuffer;

      const response = await fetch(compressedUri);
      fileData = await response.arrayBuffer();

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

      // Update user profile with new avatar URL
      try {
        await updateUserProfile({ avatar_url: publicUrl });
        onImageUpdate?.(publicUrl);
        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (profileError: any) {
        console.error('Error updating profile:', profileError);

        // Handle different types of errors gracefully
        const errorMessage = profileError.message || '';
        const statusCode = profileError.statusCode || '';

        if (
          errorMessage.includes('avatar_url') ||
          errorMessage.includes('column')
        ) {
          console.warn(
            'Database column not ready yet, but image uploaded successfully'
          );
          Alert.alert(
            'Upload Complete',
            'Profile picture uploaded successfully! The database will be updated once the migration is applied.'
          );
          onImageUpdate?.(publicUrl);
        } else if (
          errorMessage.includes('row-level security') ||
          errorMessage.includes('Unauthorized') ||
          statusCode === '403'
        ) {
          console.warn(
            'RLS policy issue - image uploaded but profile not updated'
          );
          Alert.alert(
            'Upload Complete',
            'Your profile picture has been uploaded successfully! Profile database update is pending - please contact support if this persists.'
          );
          onImageUpdate?.(publicUrl);
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
      {avatarUrl ? (
        <OptimizedImage
          source={{ uri: avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          accessibilityLabel="Profile picture"
          priority="high"
          cachePolicy="memory-disk"
          placeholder={{ uri: avatarUrl }}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <User size={48} color={Colors.primary[500]} />
        </View>
      )}

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
