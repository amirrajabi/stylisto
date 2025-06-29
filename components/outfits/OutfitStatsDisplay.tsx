import { BarChart, Heart, Shirt, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';

interface OutfitStatsDisplayProps {
  totalItems: number;
  generatedOutfits: number;
  averageScore: number;
  highScoreOutfits: number;
  utilizationRate: number;
}

interface StatItem {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

export const OutfitStatsDisplay: React.FC<OutfitStatsDisplayProps> = ({
  totalItems,
  generatedOutfits,
  averageScore,
  highScoreOutfits,
  utilizationRate,
}) => {
  const stats: StatItem[] = [
    {
      icon: <Shirt size={12} color={Colors.secondary[500]} />,
      value: totalItems,
      label: 'Items',
      color: Colors.secondary[500],
    },
    {
      icon: <Heart size={12} color={Colors.primary[500]} />,
      value: generatedOutfits,
      label: 'Outfits',
      color: Colors.primary[500],
    },
    {
      icon: <TrendingUp size={12} color={Colors.success[500]} />,
      value: `${Math.round(averageScore)}%`,
      label: 'Score',
      color: Colors.success[500],
    },
    {
      icon: <BarChart size={12} color={Colors.warning[500]} />,
      value: highScoreOutfits,
      label: 'High',
      color: Colors.warning[500],
    },
    {
      icon: <BarChart size={12} color={Colors.primary[600]} />,
      value: `${Math.round(utilizationRate)}%`,
      label: 'Usage',
      color: Colors.primary[600],
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
      >
        {stats.map((stat, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.iconContainer}>{stat.icon}</View>
            <View style={styles.textContainer}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    height: 44,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: Spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  statValue: {
    ...Typography.caption.small,
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 11,
    lineHeight: 13,
  },
  statLabel: {
    ...Typography.caption.small,
    color: Colors.text.secondary,
    fontSize: 9,
    lineHeight: 11,
    marginTop: -1,
  },
});
