import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Trash2, CreditCard as Edit2, Download, Eye, X } from 'lucide-react-native';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface ImageGalleryProps {
  userId: string;
  itemType: 'clothing' | 'outfit' | 'profile';
  itemId?: string;
  onSelectImage?: (imageUrl: string) => void;
  onDeleteImage?: (path: string) => void;
  selectable?: boolean;
  editable?: boolean;
  maxImages?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_SPACING = 8;
const GRID_COLUMNS = 3;
const IMAGE_SIZE = (screenWidth - (GRID_SPACING * (GRID_COLUMNS + 1))) / GRID_COLUMNS;

interface GalleryImage {
  id: string;
  path: string;
  url: string;
  thumbnailUrl: string;
  createdAt: string;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  userId,
  itemType,
  itemId,
  onSelectImage,
  onDeleteImage,
  selectable = true,
  editable = true,
  maxImages = 10,
}) => {
  const { user } = useAuth();
  const { getImageUrl, listFiles, deleteImage } = useStorage();
  
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const path = itemId 
        ? `${userId}/${itemType}/${itemId}`
        : `${userId}/${itemType}`;

      const { data, error } = await listFiles(path);

      if (error) {
        setError(`Failed to load images: ${error.message}`);
        return;
      }

      if (!data) {
        setImages([]);
        return;
      }

      const galleryImages: GalleryImage[] = data.map(file => {
        const path = `${path}/${file.name}`;
        return {
          id: file.id,
          path,
          url: getImageUrl(path, 'medium'),
          thumbnailUrl: getImageUrl(path, 'thumbnail'),
          createdAt: file.created_at,
        };
      });

      setImages(galleryImages);
    } catch (error) {
      setError(`Failed to load images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, userId, itemType, itemId, listFiles, getImageUrl]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const handleSelectImage = useCallback((image: GalleryImage) => {
    if (!selectable) return;
    
    setSelectedImage(image.path);
    onSelectImage?.(image.url);
  }, [selectable, onSelectImage]);

  const handleDeleteImage = useCallback(async (image: GalleryImage) => {
    if (!editable || !user) return;

    try {
      const { error } = await deleteImage(image.path);

      if (error) {
        setError(`Failed to delete image: ${error.message}`);
        return;
      }

      // Remove from local state
      setImages(prev => prev.filter(img => img.id !== image.id));

      // Notify parent
      onDeleteImage?.(image.path);

      // Clear selection if this was the selected image
      if (selectedImage === image.path) {
        setSelectedImage(null);
        onSelectImage?.('');
      }
    } catch (error) {
      setError(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [editable, user, deleteImage, selectedImage, onSelectImage, onDeleteImage]);

  const handlePreviewImage = useCallback((image: GalleryImage) => {
    setPreviewImage(image.url);
  }, []);

  const renderItem = useCallback(({ item }: { item: GalleryImage }) => (
    <View style={styles.imageContainer}>
      <TouchableOpacity
        onPress={() => handleSelectImage(item)}
        onLongPress={() => handlePreviewImage(item)}
        style={[
          styles.imageTouchable,
          selectedImage === item.path && styles.selectedImage,
        ]}
      >
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </TouchableOpacity>
      
      {editable && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteImage(item)}
        >
          <Trash2 size={16} color="#FFFFFF" />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.previewButton}
        onPress={() => handlePreviewImage(item)}
      >
        <Eye size={16} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  ), [handleSelectImage, handleDeleteImage, handlePreviewImage, selectedImage, editable]);

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[700]} />
          <Text style={styles.loadingText}>Loading images...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadImages}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : images.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No images found</Text>
        </View>
      ) : (
        <FlatList
          data={images}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          numColumns={GRID_COLUMNS}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <View style={styles.previewModal}>
          <View style={styles.previewContent}>
            <TouchableOpacity
              style={styles.closePreviewButton}
              onPress={() => setPreviewImage(null)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              contentFit="contain"
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gridContainer: {
    padding: GRID_SPACING,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    margin: GRID_SPACING,
    position: 'relative',
  },
  imageTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: Layout.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedImage: {
    borderColor: Colors.primary[700],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.error[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewButton: {
    position: 'absolute',
    bottom: Spacing.xs,
    right: Spacing.xs,
    width: 28,
    height: 28,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error[600],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary[700],
    borderRadius: Layout.borderRadius.md,
  },
  retryText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  previewModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  previewContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  closePreviewButton: {
    position: 'absolute',
    top: Spacing.xl,
    right: Spacing.xl,
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1001,
  },
});