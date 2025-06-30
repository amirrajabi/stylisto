import { LinearGradient } from 'expo-linear-gradient';
import { Clock, Eye, Heart, Star, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  Text as RNText,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { FontSize, FontWeight } from '../../constants/Typography';
import { VirtualTryOnResult } from '../../services/virtualTryOnService';
import { AccessibleText } from '../ui/AccessibleText';
import { Card } from '../ui/Card';
import OptimizedImage from '../ui/OptimizedImage';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - Spacing.lg * 2;

interface VirtualTryOnCardProps {
  result: VirtualTryOnResult;
  onShare?: (result: VirtualTryOnResult) => void;
  onDelete?: (result: VirtualTryOnResult) => void;
  onFavorite?: (result: VirtualTryOnResult) => void;
  onPress?: (result: VirtualTryOnResult) => void;
  isFavorite?: boolean;
}

export function VirtualTryOnCard({
  result,
  onShare,
  onDelete,
  onFavorite,
  onPress,
  isFavorite = false,
}: VirtualTryOnCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatProcessingTime = (timeMs: number) => {
    if (timeMs < 1000) {
      return `${timeMs}ms`;
    }
    return `${(timeMs / 1000).toFixed(1)}s`;
  };

  const handlePress = () => {
    onPress?.(result);
  };

  const handleShare = () => {
    onShare?.(result);
  };

  const handleFavorite = () => {
    onFavorite?.(result);
  };

  const handleDelete = () => {
    onDelete?.(result);
  };

  return (
    <Card style={[styles.container, ...(isPressed ? [styles.pressed] : [])]}>
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={styles.touchable}
      >
        {/* Generated Image */}
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={{ uri: result.generated_image_url }}
            style={styles.image}
            contentFit="cover"
            priority="high"
          />

          {/* Confidence Score Badge */}
          <View style={styles.confidenceBadge}>
            <Star size={12} color={Colors.warning[600]} />
            <AccessibleText
              style={styles.confidenceText}
              accessibilityLabel={`Confidence score ${Math.round(result.confidence_score * 100)} percent`}
            >
              {Math.round(result.confidence_score * 100)}%
            </AccessibleText>
          </View>

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <AccessibleText style={styles.outfitName} numberOfLines={1}>
                {result.outfit_name}
              </AccessibleText>
              <View style={styles.metaRow}>
                <Clock size={12} color={Colors.neutral[500]} />
                <AccessibleText style={styles.metaText}>
                  {formatDate(result.created_at)}
                </AccessibleText>
                <RNText style={styles.separator}>•</RNText>
                <AccessibleText style={styles.metaText}>
                  {formatProcessingTime(result.processing_time_ms)}
                </AccessibleText>
              </View>
            </View>
          </View>

          {/* Style Instructions */}
          {result.style_instructions && (
            <View style={styles.instructionsContainer}>
              <AccessibleText style={styles.instructionsLabel}>
                Style:
              </AccessibleText>
              <AccessibleText style={styles.instructionsText} numberOfLines={2}>
                {result.style_instructions}
              </AccessibleText>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.favoriteButton]}
              onPress={handleFavorite}
              accessibilityLabel={
                isFavorite ? 'Remove from favorites' : 'Add to favorites'
              }
            >
              <Heart
                size={18}
                color={isFavorite ? Colors.error[500] : Colors.neutral[500]}
                fill={isFavorite ? Colors.error[500] : 'transparent'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePress}
              accessibilityLabel="View full size"
            >
              <Eye size={18} color={Colors.success[500]} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
              accessibilityLabel="Delete virtual try-on result"
            >
              <Trash2 size={18} color={Colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  touchable: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 320,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    gap: 4,
  },
  confidenceText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    color: Colors.warning[700],
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flex: 1,
  },
  outfitName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.neutral[500],
  },
  separator: {
    fontSize: FontSize.xs,
    color: Colors.neutral[400],
  },
  instructionsContainer: {
    marginBottom: Spacing.md,
  },
  instructionsLabel: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.neutral[700],
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: FontSize.sm,
    color: Colors.neutral[600],
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
    borderRadius: 20,
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    backgroundColor: Colors.error[50],
  },
  deleteButton: {
    backgroundColor: Colors.error[50],
  },
});
