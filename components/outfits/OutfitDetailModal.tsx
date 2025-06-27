import { Image } from 'expo-image';
import {
  Calendar,
  Heart,
  Palette,
  Share2,
  Star,
  Sun,
  X,
} from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { ClothingItem } from '../../types/wardrobe';

interface OutfitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  outfit: {
    id: string;
    name: string;
    items: ClothingItem[];
    score: {
      total: number;
      color: number;
      style: number;
      season: number;
      occasion: number;
    };
  } | null;
  onSave?: (outfitId: string) => void;
  onShare?: (outfitId: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const OutfitDetailModal: React.FC<OutfitDetailModalProps> = ({
  visible,
  onClose,
  outfit,
  onSave,
  onShare,
}) => {
  console.log(
    '🔍 OutfitDetailModal render - visible:',
    visible,
    'outfit:',
    outfit
  );

  if (!outfit) {
    console.log('❌ OutfitDetailModal: No outfit data provided');
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return Colors.success[500];
    if (score >= 0.6) return Colors.warning[500];
    return Colors.error[500];
  };

  const getScoreIcon = (type: string) => {
    switch (type) {
      case 'style':
        return <Star size={16} color={Colors.primary[500]} />;
      case 'color':
        return <Palette size={16} color={Colors.success[500]} />;
      case 'season':
        return <Sun size={16} color={Colors.info[500]} />;
      case 'occasion':
        return <Calendar size={16} color={Colors.warning[500]} />;
      default:
        return <Star size={16} color={Colors.text.secondary} />;
    }
  };

  console.log('🔍 Outfit score structure:', outfit.score);
  const totalScore = Math.round((outfit.score?.total || 0) * 100);
  console.log('🔍 Calculated total score:', totalScore);

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
          <View style={styles.headerLeft}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {outfit.name}
            </Text>
            <View style={styles.totalScoreContainer}>
              <Star
                size={16}
                color={Colors.warning[500]}
                fill={Colors.warning[500]}
              />
              <Text style={styles.totalScoreText}>{totalScore}% Match</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            {onShare && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onShare(outfit.id)}
              >
                <Share2 size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
            {onSave && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onSave(outfit.id)}
              >
                <Heart size={20} color={Colors.error[500]} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Score Breakdown */}
          <View style={styles.scoresSection}>
            <Text style={styles.sectionTitle}>Match Details</Text>
            <View style={styles.scoreGrid}>
              {[
                {
                  key: 'style',
                  label: 'Style Harmony',
                  value: outfit.score?.style || 0,
                },
                {
                  key: 'color',
                  label: 'Color Match',
                  value: outfit.score?.color || 0,
                },
                {
                  key: 'season',
                  label: 'Season Fit',
                  value: outfit.score?.season || 0,
                },
                {
                  key: 'occasion',
                  label: 'Occasion',
                  value: outfit.score?.occasion || 0,
                },
              ].map(scoreItem => (
                <View key={scoreItem.key} style={styles.scoreCard}>
                  <View style={styles.scoreCardHeader}>
                    {getScoreIcon(scoreItem.key)}
                    <Text style={styles.scoreCardTitle}>{scoreItem.label}</Text>
                  </View>
                  <View style={styles.scoreProgressContainer}>
                    <View style={styles.scoreProgressTrack}>
                      <View
                        style={[
                          styles.scoreProgressFill,
                          {
                            width: `${scoreItem.value * 100}%`,
                            backgroundColor: getScoreColor(scoreItem.value),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.scoreCardValue,
                        { color: getScoreColor(scoreItem.value) },
                      ]}
                    >
                      {Math.round(scoreItem.value * 100)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Outfit Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>
              Outfit Items ({outfit.items?.length || 0})
            </Text>
            <View style={styles.itemsGrid}>
              {(outfit.items || []).map((item: ClothingItem, index: number) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemImageContainer}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                    <View style={styles.itemIndex}>
                      <Text style={styles.itemIndexText}>{index + 1}</Text>
                    </View>
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemCategory}>
                      {item.category.replace(/_/g, ' ')}
                    </Text>
                    {item.brand && (
                      <Text style={styles.itemBrand}>{item.brand}</Text>
                    )}
                    {item.color && (
                      <View style={styles.itemColorContainer}>
                        <View
                          style={[
                            styles.itemColorSwatch,
                            { backgroundColor: item.color.toLowerCase() },
                          ]}
                        />
                        <Text style={styles.itemColorText}>{item.color}</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  totalScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning[50],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.md,
    alignSelf: 'flex-start',
  },
  totalScoreText: {
    ...Typography.body.small,
    color: Colors.warning[700],
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  scoresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  scoreGrid: {
    gap: Spacing.md,
  },
  scoreCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  scoreCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  scoreCardTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginLeft: Spacing.sm,
  },
  scoreProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scoreProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreCardValue: {
    ...Typography.body.small,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  itemsSection: {
    marginBottom: Spacing.xl,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  itemCard: {
    width: (screenWidth - Spacing.md * 3) / 2,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  itemImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: Colors.surface.secondary,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemIndex: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemIndexText: {
    ...Typography.caption.small,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  itemInfo: {
    padding: Spacing.sm,
  },
  itemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  itemCategory: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
    marginBottom: Spacing.xs,
  },
  itemBrand: {
    ...Typography.caption.small,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  itemColorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  itemColorSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  itemColorText: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
});
