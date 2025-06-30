import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Upload, User, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  CompressionPresets,
  useImageProcessing,
} from '../../utils/imageProcessing';
import { useAccessibility } from '../ui/AccessibilityProvider';
import { BodyMedium, BodySmall } from '../ui/AccessibleText';

interface FullBodyImageUploaderProps {
  fullBodyImageUrl?: string;
  onImageUpdate?: (url: string) => void;
}

export const FullBodyImageUploader: React.FC<FullBodyImageUploaderProps> = ({
  fullBodyImageUrl,
  onImageUpdate,
}) => {
  const { user, updateUserProfile } = useAuth();
  const { colors } = useAccessibility();
  const { compressImage } = useImageProcessing();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera roll permissions to upload your full body image.'
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1, // Use max quality from picker, we'll compress manually
    });

    if (!result.canceled && result.assets[0]) {
      const compressionResult = await compressImage(
        result.assets[0].uri,
        CompressionPresets.fullBody
      );
      await uploadImage(compressionResult.uri);
    }
  };

  const takePhoto = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Sorry, we need camera permissions to take your full body photo.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 1, // Use max quality from camera, we'll compress manually
    });

    if (!result.canceled && result.assets[0]) {
      const compressionResult = await compressImage(
        result.assets[0].uri,
        CompressionPresets.fullBody
      );
      await uploadImage(compressionResult.uri);
    }
  };

  const deleteImage = async () => {
    if (!user?.id || !fullBodyImageUrl) return;

    Alert.alert(
      'Delete Full Body Image',
      'Are you sure you want to delete your full body image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // Extract file path from URL
              const urlParts = fullBodyImageUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const filePath = `${user.id}/profile/${fileName}`;

              // Delete from storage
              const { error: deleteError } = await supabase.storage
                .from('user-avatars')
                .remove([filePath]);

              if (deleteError) {
                console.warn('Storage delete failed:', deleteError);
              }

              // Update profile to remove URL
              await updateUserProfile({ full_body_image_url: undefined });
              onImageUpdate?.('');

              Alert.alert('Success', 'Full body image deleted successfully!');
            } catch (error: any) {
              console.error('Error deleting full body image:', error);
              Alert.alert('Error', error.message || 'Failed to delete image');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    setUploading(true);

    try {
      const fileExt = 'jpg'; // Always use JPEG for compressed images
      const fileName = `full-body_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/profile/${fileName}`;

      let fileData: ArrayBuffer;

      const response = await fetch(uri);
      fileData = await response.arrayBuffer();

      console.log(`Uploading compressed image: ${fileData.byteLength} bytes`);

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

      // Database update enabled for user-avatars bucket
      try {
        await updateUserProfile({ full_body_image_url: publicUrl });
        onImageUpdate?.(publicUrl);
        Alert.alert('Success', 'Full body image uploaded successfully!');
      } catch (profileError: any) {
        console.error('Error updating profile:', profileError);

        // Handle different types of errors
        const errorMessage = profileError.message || '';
        const statusCode = profileError.statusCode || '';

        if (
          errorMessage.includes('full_body_image_url') ||
          errorMessage.includes('column')
        ) {
          console.warn(
            'Database column not ready yet, but image uploaded successfully'
          );
          Alert.alert(
            'Upload Complete',
            'Image uploaded successfully! The database will be updated once the migration is applied.'
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
            'Your full body image has been uploaded successfully! Profile database update is pending - please contact support if this persists.'
          );
          onImageUpdate?.(publicUrl);
        } else {
          throw profileError;
        }
      }
    } catch (error: any) {
      console.error('Error uploading full body image:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Full Body Image',
      'Choose how you want to add your full body image',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Full Body Image
        </Text>
        <BodySmall color="secondary">
          Upload a full body photo for better outfit recommendations and virtual
          try-on
        </BodySmall>
      </View>

      <View style={styles.imageSection}>
        {fullBodyImageUrl ? (
          <View style={styles.imageWrapper}>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={showImageOptions}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Update full body image"
              accessibilityHint="Double tap to update your full body image"
            >
              <Image
                source={{ uri: fullBodyImageUrl }}
                style={styles.fullBodyImage}
                contentFit="cover"
                transition={200}
              />
              <View
                style={[
                  styles.editOverlay,
                  { backgroundColor: 'rgba(0, 0, 0, 0.6)' },
                ]}
              >
                <Upload size={20} color={colors.white} />
                <Text style={[styles.editText, { color: colors.white }]}>
                  Update
                </Text>
              </View>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[
                styles.deleteButton,
                { backgroundColor: colors.surface.primary },
              ]}
              onPress={deleteImage}
              disabled={deleting}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Delete full body image"
              accessibilityHint="Double tap to delete your full body image"
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.text.secondary} />
              ) : (
                <X size={20} color={colors.text.secondary} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.placeholderContainer,
              {
                backgroundColor: colors.neutral[100],
                borderColor: colors.border.secondary,
              },
            ]}
            onPress={showImageOptions}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Add full body image"
            accessibilityHint="Double tap to add your full body image for outfit recommendations"
          >
            <User size={48} color={colors.text.tertiary} />
            <BodyMedium color="secondary" style={styles.placeholderText}>
              Add Full Body Image
            </BodyMedium>
            <BodySmall color="tertiary" style={styles.placeholderSubtext}>
              For better outfit matching
            </BodySmall>
          </TouchableOpacity>
        )}
      </View>

      {uploading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
          <BodySmall color="secondary" style={styles.loadingText}>
            Compressing and uploading image...
          </BodySmall>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
  },
  header: {
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.body.medium,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  imageSection: {
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
  },
  fullBodyImage: {
    width: 120,
    height: 160,
    borderRadius: Layout.borderRadius.lg,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  editText: {
    ...Typography.caption.medium,
    fontWeight: '500',
  },
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  placeholderContainer: {
    width: 120,
    height: 160,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  placeholderSubtext: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  loadingText: {
    fontStyle: 'italic',
  },
});
