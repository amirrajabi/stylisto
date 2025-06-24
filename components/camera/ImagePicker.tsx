import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import * as ImagePickerExpo from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera, Image as ImageIcon, X, Plus, Check, CircleAlert as AlertCircle } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface ImagePickerProps {
  onImagesSelected: (imageUris: string[]) => void;
  onClose: () => void;
  maxImages?: number;
  selectedImages?: string[];
  allowsEditing?: boolean;
  quality?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_SPACING = 8;
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (screenWidth - (GRID_SPACING * (GRID_COLUMNS + 1))) / GRID_COLUMNS;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const ImagePicker: React.FC<ImagePickerProps> = ({
  onImagesSelected,
  onClose,
  maxImages = 10,
  selectedImages = [],
  allowsEditing = true,
  quality = 0.8,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  
  const cameraButtonScale = useSharedValue(1);
  const galleryButtonScale = useSharedValue(1);

  const canSelectMore = selectedImages.length < maxImages;

  // Check and request permissions
  const checkPermissions = useCallback(async (type: 'camera' | 'gallery') => {
    try {
      let permission;
      
      if (type === 'camera') {
        permission = await ImagePickerExpo.requestCameraPermissionsAsync();
      } else {
        permission = await ImagePickerExpo.requestMediaLibraryPermissionsAsync();
      }

      if (!permission.granted) {
        setPermissionStatus('denied');
        
        const message = type === 'camera' 
          ? 'Camera access is required to take photos of your clothing items.'
          : 'Photo library access is required to select images from your gallery.';
        
        if (Platform.OS === 'web') {
          alert(`Permission Required\n\n${message}`);
        } else {
          Alert.alert(
            'Permission Required',
            message,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => {
                // On native platforms, you could open settings
                console.log('Open settings');
              }},
            ]
          );
        }
        return false;
      }

      setPermissionStatus('granted');
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }, []);

  const handleCameraPress = useCallback(async () => {
    if (!canSelectMore) {
      Alert.alert('Limit Reached', `You can only select up to ${maxImages} images.`);
      return;
    }

    cameraButtonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    const hasPermission = await checkPermissions('camera');
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const result = await ImagePickerExpo.launchCameraAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing,
        aspect: [3, 4],
        quality,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const newImages = [...selectedImages, result.assets[0].uri];
        onImagesSelected(newImages);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canSelectMore, maxImages, selectedImages, onImagesSelected, allowsEditing, quality, checkPermissions]);

  const handleGalleryPress = useCallback(async () => {
    if (!canSelectMore) {
      Alert.alert('Limit Reached', `You can only select up to ${maxImages} images.`);
      return;
    }

    galleryButtonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    const hasPermission = await checkPermissions('gallery');
    if (!hasPermission) return;

    setIsLoading(true);

    try {
      const remainingSlots = maxImages - selectedImages.length;
      
      const result = await ImagePickerExpo.launchImageLibraryAsync({
        mediaTypes: ImagePickerExpo.MediaTypeOptions.Images,
        allowsEditing: remainingSlots === 1 ? allowsEditing : false,
        allowsMultipleSelection: remainingSlots > 1,
        selectionLimit: remainingSlots,
        aspect: [3, 4],
        quality,
        base64: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImageUris = result.assets.map(asset => asset.uri);
        const updatedImages = [...selectedImages, ...newImageUris];
        onImagesSelected(updatedImages);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canSelectMore, maxImages, selectedImages, onImagesSelected, allowsEditing, quality, checkPermissions]);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    const updatedImages = selectedImages.filter((_, index) => index !== indexToRemove);
    onImagesSelected(updatedImages);
  }, [selectedImages, onImagesSelected]);

  const cameraButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cameraButtonScale.value }],
  }));

  const galleryButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: galleryButtonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Photos</Text>
        <View style={styles.headerRight}>
          <Text style={styles.counterText}>
            {selectedImages.length}/{maxImages}
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <AnimatedTouchableOpacity
          style={[styles.actionButton, cameraButtonAnimatedStyle]}
          onPress={handleCameraPress}
          disabled={isLoading || !canSelectMore}
        >
          <View style={[styles.actionButtonIcon, { backgroundColor: '#3B82F6' }]}>
            <Camera size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.actionButtonText}>Take Photo</Text>
          <Text style={styles.actionButtonSubtext}>Use camera to capture</Text>
        </AnimatedTouchableOpacity>

        <AnimatedTouchableOpacity
          style={[styles.actionButton, galleryButtonAnimatedStyle]}
          onPress={handleGalleryPress}
          disabled={isLoading || !canSelectMore}
        >
          <View style={[styles.actionButtonIcon, { backgroundColor: '#10B981' }]}>
            <ImageIcon size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.actionButtonText}>Choose from Gallery</Text>
          <Text style={styles.actionButtonSubtext}>Select existing photos</Text>
        </AnimatedTouchableOpacity>
      </View>

      {/* Selected Images Grid */}
      {selectedImages.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.sectionTitle}>Selected Photos</Text>
          <ScrollView 
            style={styles.imageGrid}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.gridContainer}>
              {selectedImages.map((imageUri, index) => (
                <Animated.View
                  key={`${imageUri}-${index}`}
                  entering={FadeIn.delay(index * 100)}
                  exiting={FadeOut}
                  style={styles.imageContainer}
                >
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.selectedImage}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.imageIndex}>
                    <Text style={styles.imageIndexText}>{index + 1}</Text>
                  </View>
                </Animated.View>
              ))}
              
              {/* Add More Button */}
              {canSelectMore && (
                <TouchableOpacity
                  style={styles.addMoreButton}
                  onPress={handleGalleryPress}
                  disabled={isLoading}
                >
                  <Plus size={32} color="#9CA3AF" />
                  <Text style={styles.addMoreText}>Add More</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>📸 Photo Tips</Text>
        <View style={styles.tipsList}>
          <Text style={styles.tipItem}>• Use good lighting for best results</Text>
          <Text style={styles.tipItem}>• Keep the item flat and wrinkle-free</Text>
          <Text style={styles.tipItem}>• Include the full garment in frame</Text>
          <Text style={styles.tipItem}>• Take photos from multiple angles</Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Processing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  counterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  actionButtonIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  imageGrid: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_SPACING,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 1.2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndex: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndexText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addMoreButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE * 1.2,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addMoreText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  tipsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F0F9FF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipsList: {
    gap: 4,
  },
  tipItem: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
});