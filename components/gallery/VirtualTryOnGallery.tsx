import { Image } from 'expo-image';
import { Eye, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useAuth } from '../../hooks/useAuth';
import {
  VirtualTryOnResult,
  VirtualTryOnService,
} from '../../services/virtualTryOnService';
import { AccessibleText } from '../ui/AccessibleText';

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - Spacing.lg * 3) / 2;

interface VirtualTryOnGalleryProps {
  onImagePress?: (result: VirtualTryOnResult) => void;
  onShare?: (result: VirtualTryOnResult) => void;
  onDelete?: (result: VirtualTryOnResult) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function VirtualTryOnGallery({
  onImagePress,
  onShare,
  onDelete,
  refreshing = false,
  onRefresh,
}: VirtualTryOnGalleryProps) {
  const { user } = useAuth();
  const [results, setResults] = useState<VirtualTryOnResult[]>([]);
  const [loading, setLoading] = useState(true);

  const loadResults = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await VirtualTryOnService.getUserResults(user.id);
      setResults(data);
    } catch (error) {
      console.error('Error loading virtual try-on results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [user]);

  useEffect(() => {
    if (!refreshing) {
      loadResults();
    }
  }, [refreshing]);

  const handleDeleteResult = async (result: VirtualTryOnResult) => {
    Alert.alert(
      'Delete Virtual Try-On',
      'Are you sure you want to delete this virtual try-on result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              const success = await VirtualTryOnService.deleteResult(
                user.id,
                result.id
              );
              if (success) {
                setResults(prev => prev.filter(r => r.id !== result.id));
                onDelete?.(result);
              }
            }
          },
        },
      ]
    );
  };

  const handleShareResult = (result: VirtualTryOnResult) => {
    onShare?.(result);
  };

  const handleImagePress = (result: VirtualTryOnResult) => {
    onImagePress?.(result);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderResult = ({ item }: { item: VirtualTryOnResult }) => (
    <View style={styles.resultCard}>
      <TouchableOpacity
        onPress={() => handleImagePress(item)}
        style={styles.imageContainer}
      >
        <Image
          source={{ uri: item.generated_image_url }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.overlay}>
          <View style={styles.confidenceContainer}>
            <AccessibleText style={styles.confidenceText}>
              {Math.round(item.confidence_score * 100)}%
            </AccessibleText>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.contentContainer}>
        <AccessibleText style={styles.outfitName} numberOfLines={1}>
          {item.outfit_name}
        </AccessibleText>
        <AccessibleText style={styles.dateText}>
          {formatDate(item.created_at)}
        </AccessibleText>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleImagePress(item)}
          >
            <Eye size={16} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteResult(item)}
          >
            <Trash2 size={16} color={Colors.error[500]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Eye size={64} color={Colors.text.secondary} />
      <AccessibleText style={styles.emptyTitle}>
        No Virtual Try-On Results
      </AccessibleText>
      <AccessibleText style={styles.emptyDescription}>
        Create virtual try-on results from your outfits to see them here
      </AccessibleText>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <AccessibleText style={styles.loadingText}>
          Loading virtual try-on results...
        </AccessibleText>
      </View>
    );
  }

  return (
    <FlatList
      data={results}
      keyExtractor={item => item.id}
      renderItem={renderResult}
      numColumns={2}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyState}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: Spacing.md,
  },
  resultCard: {
    flex: 1,
    margin: Spacing.xs,
    backgroundColor: Colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: imageSize,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  confidenceContainer: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning[600],
  },
  contentContainer: {
    padding: Spacing.sm,
  },
  outfitName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  itemsContainer: {
    marginBottom: Spacing.xs,
  },
  itemsText: {
    fontSize: 11,
    color: Colors.text.tertiary,
    lineHeight: 14,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
