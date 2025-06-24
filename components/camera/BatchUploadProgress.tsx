import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Upload, X } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

interface UploadItem {
  id: string;
  uri: string;
  name: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
}

interface BatchUploadProgressProps {
  visible: boolean;
  items: UploadItem[];
  onClose?: () => void;
  canClose?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const BatchUploadProgress: React.FC<BatchUploadProgressProps> = ({
  visible,
  items,
  onClose,
  canClose = false,
}) => {
  const overallProgress = items.length > 0 
    ? items.reduce((sum, item) => sum + item.progress, 0) / items.length 
    : 0;

  const completedCount = items.filter(item => item.status === 'completed').length;
  const errorCount = items.filter(item => item.status === 'error').length;
  const isComplete = completedCount + errorCount === items.length && items.length > 0;

  const progressBarWidth = useSharedValue(0);

  React.useEffect(() => {
    progressBarWidth.value = withTiming(overallProgress, { duration: 300 });
  }, [overallProgress]);

  const progressBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value}%`,
  }));

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#10B981" />;
      case 'error':
        return <AlertCircle size={20} color="#EF4444" />;
      case 'uploading':
        return <Upload size={20} color="#3B82F6" />;
      default:
        return <Upload size={20} color="#9CA3AF" />;
    }
  };

  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981';
      case 'error':
        return '#EF4444';
      case 'uploading':
        return '#3B82F6';
      default:
        return '#9CA3AF';
    }
  };

  const UploadItemComponent: React.FC<{ item: UploadItem; index: number }> = ({ item, index }) => {
    const itemProgress = useSharedValue(0);
    const itemScale = useSharedValue(0.95);

    React.useEffect(() => {
      itemProgress.value = withTiming(item.progress, { duration: 300 });
      itemScale.value = withSpring(1, { damping: 15, stiffness: 150 });
    }, [item.progress]);

    const itemProgressAnimatedStyle = useAnimatedStyle(() => ({
      width: `${itemProgress.value}%`,
    }));

    const itemAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: itemScale.value }],
    }));

    return (
      <Animated.View style={[styles.uploadItem, itemAnimatedStyle]}>
        <Image
          source={{ uri: item.uri }}
          style={styles.itemThumbnail}
          contentFit="cover"
        />
        
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            {getStatusIcon(item.status)}
          </View>
          
          <View style={styles.itemProgressContainer}>
            <View style={styles.itemProgressBar}>
              <Animated.View 
                style={[
                  styles.itemProgressFill,
                  { backgroundColor: getStatusColor(item.status) },
                  itemProgressAnimatedStyle,
                ]} 
              />
            </View>
            <Text style={styles.itemProgressText}>
              {Math.round(item.progress)}%
            </Text>
          </View>
          
          {item.error && (
            <Text style={styles.itemError} numberOfLines={2}>
              {item.error}
            </Text>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={canClose ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>
                {isComplete ? 'Upload Complete' : 'Uploading Photos'}
              </Text>
              <Text style={styles.subtitle}>
                {completedCount} of {items.length} completed
                {errorCount > 0 && ` • ${errorCount} failed`}
              </Text>
            </View>
            
            {canClose && onClose && (
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Overall Progress */}
          <View style={styles.overallProgress}>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <Animated.View 
                  style={[
                    styles.progressFill,
                    progressBarAnimatedStyle,
                    { 
                      backgroundColor: isComplete 
                        ? errorCount > 0 ? '#F59E0B' : '#10B981'
                        : '#3B82F6' 
                    },
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(overallProgress)}%
              </Text>
            </View>
          </View>

          {/* Upload Items */}
          <View style={styles.itemsList}>
            {items.map((item, index) => (
              <UploadItemComponent key={item.id} item={item} index={index} />
            ))}
          </View>

          {/* Summary */}
          {isComplete && (
            <View style={styles.summary}>
              <View style={styles.summaryStats}>
                <View style={styles.summaryItem}>
                  <CheckCircle size={16} color="#10B981" />
                  <Text style={styles.summaryText}>
                    {completedCount} uploaded
                  </Text>
                </View>
                
                {errorCount > 0 && (
                  <View style={styles.summaryItem}>
                    <AlertCircle size={16} color="#EF4444" />
                    <Text style={styles.summaryText}>
                      {errorCount} failed
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  closeButton: {
    padding: 4,
    marginLeft: 16,
  },
  overallProgress: {
    marginBottom: 24,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    minWidth: 40,
    textAlign: 'right',
  },
  itemsList: {
    maxHeight: 300,
    gap: 12,
  },
  uploadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 12,
  },
  itemThumbnail: {
    width: 48,
    height: 60,
    borderRadius: 8,
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  itemProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemProgressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  itemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  itemProgressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 32,
    textAlign: 'right',
  },
  itemError: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    lineHeight: 16,
  },
  summary: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});