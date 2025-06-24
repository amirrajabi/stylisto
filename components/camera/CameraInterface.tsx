import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import { Image } from 'expo-image';
import { X, Camera, RotateCcw, Slash as Flash, FlashlightOff as FlashOff, Check, RefreshCw, Download } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface CameraInterfaceProps {
  onCapture: (imageUri: string) => void;
  onClose: () => void;
  maxPhotos?: number;
  capturedPhotos?: string[];
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CAPTURE_BUTTON_SIZE = 80;
const CONTROL_BUTTON_SIZE = 56;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const CameraInterface: React.FC<CameraInterfaceProps> = ({
  onCapture,
  onClose,
  maxPhotos = 10,
  capturedPhotos = [],
}) => {
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isCapturing, setIsCapturing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  const cameraRef = useRef<CameraView>(null);
  const captureButtonScale = useSharedValue(1);
  const flashButtonScale = useSharedValue(1);
  const flipButtonScale = useSharedValue(1);
  const previewScale = useSharedValue(0);
  const previewOpacity = useSharedValue(0);

  const canCaptureMore = capturedPhotos.length < maxPhotos;

  // Permission handling
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <View style={styles.permissionContent}>
          <Camera size={64} color="#6B7280" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionMessage}>
            Stylisto needs camera access to take photos of your clothing items. 
            This helps you build your digital wardrobe.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleCameraFlip = useCallback(() => {
    flipButtonScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }, []);

  const handleFlashToggle = useCallback(() => {
    flashButtonScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );
    setFlash(current => {
      switch (current) {
        case 'off': return 'on';
        case 'on': return 'auto';
        case 'auto': return 'off';
        default: return 'off';
      }
    });
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing || !canCaptureMore) return;

    setIsCapturing(true);
    captureButtonScale.value = withSequence(
      withSpring(0.8),
      withSpring(1)
    );

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      if (photo?.uri) {
        setLastCapturedImage(photo.uri);
        
        // Animate preview appearance
        previewScale.value = withSpring(1);
        previewOpacity.value = withTiming(1);
        
        // Auto-hide preview after 2 seconds
        setTimeout(() => {
          previewScale.value = withSpring(0);
          previewOpacity.value = withTiming(0);
        }, 2000);

        onCapture(photo.uri);
      }
    } catch (error) {
      console.error('Failed to take picture:', error);
      if (Platform.OS === 'web') {
        alert('Failed to take picture. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, canCaptureMore, onCapture]);

  // Gesture for capture button
  const captureGesture = Gesture.Tap()
    .onStart(() => {
      runOnJS(handleCapture)();
    });

  const captureButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: captureButtonScale.value }],
  }));

  const flashButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flashButtonScale.value }],
  }));

  const flipButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flipButtonScale.value }],
  }));

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
    opacity: previewOpacity.value,
  }));

  const getFlashIcon = () => {
    switch (flash) {
      case 'on': return <Flash size={24} color="#FFFFFF" />;
      case 'auto': return <Flash size={24} color="#FCD34D" />;
      default: return <FlashOff size={24} color="#FFFFFF" />;
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mode="picture"
      >
        {/* Header Controls */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Take Photo</Text>
            <Text style={styles.headerSubtitle}>
              {capturedPhotos.length}/{maxPhotos} photos
            </Text>
          </View>

          <AnimatedTouchableOpacity
            style={[styles.headerButton, flashButtonAnimatedStyle]}
            onPress={handleFlashToggle}
          >
            {getFlashIcon()}
          </AnimatedTouchableOpacity>
        </View>

        {/* Camera Guidelines */}
        <View style={styles.guidelines}>
          <View style={styles.guideline} />
          <View style={[styles.guideline, styles.guidelineHorizontal]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Position your clothing item in the frame
          </Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {/* Gallery Preview */}
          <View style={styles.galleryPreview}>
            {capturedPhotos.length > 0 && (
              <Image
                source={{ uri: capturedPhotos[capturedPhotos.length - 1] }}
                style={styles.galleryThumbnail}
                contentFit="cover"
              />
            )}
            {capturedPhotos.length > 1 && (
              <View style={styles.galleryCount}>
                <Text style={styles.galleryCountText}>{capturedPhotos.length}</Text>
              </View>
            )}
          </View>

          {/* Capture Button */}
          <GestureDetector gesture={captureGesture}>
            <AnimatedTouchableOpacity
              style={[
                styles.captureButton,
                captureButtonAnimatedStyle,
                !canCaptureMore && styles.captureButtonDisabled,
              ]}
              disabled={isCapturing || !canCaptureMore}
            >
              <View style={[
                styles.captureButtonInner,
                isCapturing && styles.captureButtonCapturing,
              ]}>
                {isCapturing ? (
                  <RefreshCw size={32} color="#FFFFFF" />
                ) : (
                  <Camera size={32} color="#FFFFFF" />
                )}
              </View>
            </AnimatedTouchableOpacity>
          </GestureDetector>

          {/* Flip Camera Button */}
          <AnimatedTouchableOpacity
            style={[styles.controlButton, flipButtonAnimatedStyle]}
            onPress={handleCameraFlip}
          >
            <RotateCcw size={24} color="#FFFFFF" />
          </AnimatedTouchableOpacity>
        </View>

        {/* Last Captured Preview */}
        {lastCapturedImage && (
          <Animated.View style={[styles.capturePreview, previewAnimatedStyle]}>
            <Image
              source={{ uri: lastCapturedImage }}
              style={styles.capturePreviewImage}
              contentFit="cover"
            />
            <View style={styles.capturePreviewOverlay}>
              <Check size={32} color="#FFFFFF" />
            </View>
          </Animated.View>
        )}
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 400,
  },
  permissionText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 2,
  },
  guidelines: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 200,
    height: 200,
    marginTop: -100,
    marginLeft: -100,
  },
  guideline: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  guidelineHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  instructions: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  galleryPreview: {
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
    overflow: 'hidden',
  },
  galleryThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  galleryCount: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  captureButton: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: CAPTURE_BUTTON_SIZE - 16,
    height: CAPTURE_BUTTON_SIZE - 16,
    borderRadius: (CAPTURE_BUTTON_SIZE - 16) / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonCapturing: {
    backgroundColor: '#3B82F6',
  },
  controlButton: {
    width: CONTROL_BUTTON_SIZE,
    height: CONTROL_BUTTON_SIZE,
    borderRadius: CONTROL_BUTTON_SIZE / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturePreview: {
    position: 'absolute',
    top: 100,
    right: 24,
    width: 80,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
  },
  capturePreviewImage: {
    width: '100%',
    height: '100%',
  },
  capturePreviewOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(34, 197, 94, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});