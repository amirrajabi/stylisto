import { Image } from 'expo-image';
import { Clock, Share2, Star, Trash2, X } from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { VirtualTryOnResult } from '../../services/virtualTryOnService';
import { AccessibleText } from '../ui/AccessibleText';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VirtualTryOnModalProps {
  visible: boolean;
  result: VirtualTryOnResult | null;
  onClose: () => void;
  onDelete?: (result: VirtualTryOnResult) => void;
}

export function VirtualTryOnModal({
  visible,
  result,
  onClose,
  onDelete,
}: VirtualTryOnModalProps) {
  if (!result) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
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

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my virtual try-on result for "${result.outfit_name}"!`,
        url: result.generated_image_url,
      });
    } catch (error) {
      console.error('Error sharing virtual try-on result:', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Virtual Try-On',
      'Are you sure you want to delete this virtual try-on result?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete?.(result);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <AccessibleText style={styles.headerTitle} numberOfLines={1}>
              {result.outfit_name}
            </AccessibleText>
            <View style={styles.headerMeta}>
              <View style={styles.confidenceContainer}>
                <Star size={14} color={Colors.warning[600]} />
                <AccessibleText style={styles.confidenceText}>
                  {Math.round(result.confidence_score * 100)}% confidence
                </AccessibleText>
              </View>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
              <Share2 size={20} color={Colors.text.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
            >
              <Trash2 size={20} color={Colors.error[500]} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Full Size Image */}
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: result.generated_image_url }}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            {/* Date and Processing Time */}
            <View style={styles.metaSection}>
              <View style={styles.metaRow}>
                <Clock size={16} color={Colors.text.secondary} />
                <AccessibleText style={styles.metaText}>
                  Created {formatDate(result.created_at)}
                </AccessibleText>
              </View>
              <AccessibleText style={styles.processingText}>
                Processing time:{' '}
                {formatProcessingTime(result.processing_time_ms)}
              </AccessibleText>
            </View>

            {/* Items Used */}
            {result.items_used && result.items_used.length > 0 && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  Items Used
                </AccessibleText>
                <View style={styles.itemsList}>
                  {result.items_used.map((item, index) => (
                    <View key={index} style={styles.itemTag}>
                      <AccessibleText style={styles.itemText}>
                        {item}
                      </AccessibleText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Style Instructions */}
            {result.style_instructions && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  Style Instructions
                </AccessibleText>
                <AccessibleText style={styles.instructionsText}>
                  {result.style_instructions}
                </AccessibleText>
              </View>
            )}

            {/* Prompt Used */}
            {result.prompt_used && (
              <View style={styles.section}>
                <AccessibleText style={styles.sectionTitle}>
                  AI Prompt
                </AccessibleText>
                <AccessibleText style={styles.promptText}>
                  {result.prompt_used}
                </AccessibleText>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  closeButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: screenHeight * 0.6,
    backgroundColor: Colors.neutral[50],
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: Spacing.lg,
  },
  metaSection: {
    marginBottom: Spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  processingText: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  itemsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemTag: {
    backgroundColor: Colors.secondary[50],
    borderRadius: 16,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  itemText: {
    fontSize: 14,
    color: Colors.secondary[700],
    fontWeight: '500',
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  promptText: {
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
