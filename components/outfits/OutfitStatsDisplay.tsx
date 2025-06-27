import { BarChart, Heart, Shirt, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

interface OutfitStatsDisplayProps {
  totalItems: number;
  generatedOutfits: number;
  averageScore: number;
  highScoreOutfits: number;
  utilizationRate: number;
}

export const OutfitStatsDisplay: React.FC<OutfitStatsDisplayProps> = ({
  totalItems,
  generatedOutfits,
  averageScore,
  highScoreOutfits,
  utilizationRate,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BarChart size={24} color={Colors.primary[600]} />
        <Text style={styles.title}>Generation Statistics</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Shirt size={20} color={Colors.secondary[500]} />
          </View>
          <Text style={styles.statValue}>{totalItems}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Heart size={20} color={Colors.primary[500]} />
          </View>
          <Text style={styles.statValue}>{generatedOutfits}</Text>
          <Text style={styles.statLabel}>Styled Outfits</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <TrendingUp size={20} color={Colors.success[500]} />
          </View>
          <Text style={styles.statValue}>{Math.round(averageScore)}%</Text>
          <Text style={styles.statLabel}>Average Score</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <BarChart size={20} color={Colors.warning[500]} />
          </View>
          <Text style={styles.statValue}>{highScoreOutfits}</Text>
          <Text style={styles.statLabel}>High Score (80%+)</Text>
        </View>
      </View>

      <View style={styles.utilizationCard}>
        <Text style={styles.utilizationTitle}>Wardrobe Utilization</Text>
        <View style={styles.utilizationBar}>
          <View
            style={[styles.utilizationFill, { width: `${utilizationRate}%` }]}
          />
        </View>
        <Text style={styles.utilizationText}>
          {Math.round(utilizationRate)}% of your wardrobe was used
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    margin: Spacing.md,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  utilizationCard: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  utilizationTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  utilizationBar: {
    height: 8,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  utilizationFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: Layout.borderRadius.full,
  },
  utilizationText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
