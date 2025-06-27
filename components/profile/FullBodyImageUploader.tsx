import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Upload, User } from 'lucide-react-native';
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
  const [uploading, setUploading] = useState(false);

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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
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
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    setUploading(true);

    try {
      const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user.id}_fullbody_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/full-body-images/${fileName}`;

      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('user-content')
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('user-content').getPublicUrl(filePath);

      await updateUserProfile({ full_body_image_url: publicUrl });

      onImageUpdate?.(publicUrl);

      Alert.alert('Success', 'Full body image uploaded successfully!');
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
    <View
      style={[styles.container, { backgroundColor: colors.surface.primary }]}
    >
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
            Uploading image...
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
