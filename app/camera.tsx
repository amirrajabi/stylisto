import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CameraInterface } from '../components/camera/CameraInterface';
import { ImagePicker } from '../components/camera/ImagePicker';
import { BatchUploadProgress } from '../components/camera/BatchUploadProgress';
import { useImageProcessing, BatchProcessingProgress } from '../utils/imageProcessing';

interface UploadItem {
  id: string;
  uri: string;
  name: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function CameraScreen() {
  const params = useLocalSearchParams<{ 
    mode?: 'camera' | 'gallery';
    maxPhotos?: string;
    returnTo?: string;
  }>();
  
  const mode = params.mode || 'camera';
  const maxPhotos = parseInt(params.maxPhotos || '10');
  const returnTo = params.returnTo || '/(tabs)/wardrobe';

  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [currentMode, setCurrentMode] = useState<'camera' | 'gallery'>(mode);

  const { processBatch, optimizeForClothing } = useImageProcessing();

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handlePhotoCapture = useCallback((imageUri: string) => {
    setCapturedPhotos(prev => [...prev, imageUri]);
  }, []);

  const handleImagesSelected = useCallback((imageUris: string[]) => {
    setCapturedPhotos(imageUris);
  }, []);

  const handleStartUpload = useCallback(async () => {
    if (capturedPhotos.length === 0) return;

    // Initialize upload items
    const items: UploadItem[] = capturedPhotos.map((uri, index) => ({
      id: `upload-${Date.now()}-${index}`,
      uri,
      name: `Photo ${index + 1}`,
      status: 'pending',
      progress: 0,
    }));

    setUploadItems(items);
    setShowUploadProgress(true);

    try {
      // Process images for clothing optimization
      const processedImages = await processBatch(
        capturedPhotos,
        {
          maxWidth: 1200,
          maxHeight: 1600,
          quality: 0.8,
          format: 'jpeg',
        },
        (progress: BatchProcessingProgress) => {
          // Update upload progress
          setUploadItems(prevItems => 
            prevItems.map((item, index) => {
              if (index < progress.completed) {
                return { ...item, status: 'completed', progress: 100 };
              } else if (index === progress.completed) {
                return { ...item, status: 'uploading', progress: 50 };
              }
              return item;
            })
          );
        }
      );

      // Simulate upload completion
      setTimeout(() => {
        setUploadItems(prevItems => 
          prevItems.map(item => ({ ...item, status: 'completed', progress: 100 }))
        );

        // Navigate back after successful upload
        setTimeout(() => {
          router.replace(returnTo);
        }, 1500);
      }, 1000);

    } catch (error) {
      console.error('Upload error:', error);
      
      // Mark all as error
      setUploadItems(prevItems => 
        prevItems.map(item => ({ 
          ...item, 
          status: 'error', 
          progress: 0,
          error: 'Upload failed. Please try again.',
        }))
      );

      if (Platform.OS === 'web') {
        alert('Upload failed. Please try again.');
      } else {
        Alert.alert('Upload Error', 'Failed to upload photos. Please try again.');
      }
    }
  }, [capturedPhotos, returnTo, processBatch]);

  // Auto-start upload when photos are captured/selected
  React.useEffect(() => {
    if (capturedPhotos.length > 0) {
      // Small delay to show the photos were captured
      const timer = setTimeout(() => {
        handleStartUpload();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [capturedPhotos, handleStartUpload]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {currentMode === 'camera' ? (
        <CameraInterface
          onCapture={handlePhotoCapture}
          onClose={handleClose}
          maxPhotos={maxPhotos}
          capturedPhotos={capturedPhotos}
        />
      ) : (
        <ImagePicker
          onImagesSelected={handleImagesSelected}
          onClose={handleClose}
          maxImages={maxPhotos}
          selectedImages={capturedPhotos}
        />
      )}

      <BatchUploadProgress
        visible={showUploadProgress}
        items={uploadItems}
        onClose={() => {
          const allCompleted = uploadItems.every(item => 
            item.status === 'completed' || item.status === 'error'
          );
          if (allCompleted) {
            router.replace(returnTo);
          }
        }}
        canClose={uploadItems.every(item => 
          item.status === 'completed' || item.status === 'error'
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});