import { router } from 'expo-router';
import {
  ArrowLeft,
  BarChart3,
  Heart,
  Shirt,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { H1 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { Season } from '../../../types/wardrobe';
import {
  formatCurrency,
  getWardrobeInsights,
} from '../../../utils/wardrobeUtils';

const { width } = Dimensions.get('window');

export default function WardrobeAnalyticsScreen() {
  const { items, outfits, stats } = useWardrobe();
  const { trackScreenView } = useAnalytics();

  useEffect(() => {
    trackScreenView('WardrobeAnalytics');
  }, [trackScreenView]);

  const wardrobeValue = items.reduce(
    (total, item) => total + (item.price || 0),
    0
  );
  const insights = getWardrobeInsights(items);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
  }> = ({ title, value, icon, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const CategoryChart: React.FC = () => {
    const maxCount = Math.max(...Object.values(stats.itemsByCategory));

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Items by Category</Text>
        <View style={styles.chart}>
          {Object.entries(stats.itemsByCategory).map(([category, count]) => (
            <View key={category} style={styles.chartRow}>
              <Text style={styles.chartLabel}>
                {category.replace('_', ' ')}
              </Text>
              <View style={styles.chartBarContainer}>
                <View
                  style={[
                    styles.chartBar,
                    {
                      width: maxCount > 0 ? (count / maxCount) * 200 : 0,
                      backgroundColor: '#A428FC',
                    },
                  ]}
                />
                <Text style={styles.chartValue}>{count}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const SeasonChart: React.FC = () => {
    const seasonColors = {
      spring: '#4ade80',
      summer: '#fbbf24',
      fall: '#f97316',
      winter: '#60a5fa',
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Items by Season</Text>
        <View style={styles.seasonGrid}>
          {Object.entries(stats.itemsBySeason).map(([season, count]) => (
            <View key={season} style={styles.seasonCard}>
              <View
                style={[
                  styles.seasonIndicator,
                  { backgroundColor: seasonColors[season as Season] },
                ]}
              />
              <Text style={styles.seasonName}>{season}</Text>
              <Text style={styles.seasonCount}>{count}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const InsightsSection: React.FC = () => (
    <View style={styles.insightsContainer}>
      <Text style={styles.sectionTitle}>Wardrobe Insights</Text>
      {insights.map((insight, index) => (
        <View key={index} style={styles.insightCard}>
          <Text style={styles.insightText}>{insight}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Wardrobe Analytics</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Shirt size={20} color="#A428FC" />}
            color="#A428FC"
          />
          <StatCard
            title="Total Outfits"
            value={stats.totalOutfits}
            icon={<BarChart3 size={20} color="#10b981" />}
            color="#10b981"
          />
          <StatCard
            title="Favorites"
            value={stats.favoriteItems}
            icon={<Heart size={20} color="#ef4444" />}
            color="#ef4444"
          />
          <StatCard
            title="Wardrobe Value"
            value={formatCurrency(wardrobeValue)}
            icon={<TrendingUp size={20} color="#f59e0b" />}
            color="#f59e0b"
          />
        </View>

        <CategoryChart />

        <SeasonChart />

        {stats.mostWornItems.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Most Worn Items</Text>
            {stats.mostWornItems.slice(0, 5).map((item, index) => (
              <View key={item.id} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemDetail}>
                    {item.brand} • {item.category}
                  </Text>
                </View>
                <Text style={styles.listItemValue}>{item.timesWorn} times</Text>
              </View>
            ))}
          </View>
        )}

        {stats.leastWornItems.length > 0 && (
          <View style={styles.listContainer}>
            <Text style={styles.sectionTitle}>Least Worn Items</Text>
            {stats.leastWornItems.slice(0, 5).map((item, index) => (
              <View key={item.id} style={styles.listItem}>
                <View style={styles.listItemInfo}>
                  <Text style={styles.listItemName}>{item.name}</Text>
                  <Text style={styles.listItemDetail}>
                    {item.brand} • {item.category}
                  </Text>
                </View>
                <Text style={styles.listItemValue}>{item.timesWorn} times</Text>
              </View>
            ))}
          </View>
        )}

        <InsightsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  backButton: {
    marginRight: Spacing.md,
    padding: Spacing.xs,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  statCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    width: (width - 48) / 2,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.sm,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  statTitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    flex: 1,
  },
  statValue: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
  },
  chartContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  chartTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  chart: {
    gap: Spacing.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    width: 80,
    textTransform: 'capitalize',
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  chartBar: {
    height: 24,
    borderRadius: Layout.borderRadius.sm,
    marginRight: Spacing.sm,
  },
  chartValue: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    minWidth: 20,
  },
  seasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  seasonCard: {
    alignItems: 'center',
    width: (width - 80) / 2,
    marginBottom: Spacing.md,
  },
  seasonIndicator: {
    width: 16,
    height: 16,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.sm,
  },
  seasonName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    textTransform: 'capitalize',
    marginBottom: Spacing.xs,
  },
  seasonCount: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  listContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  listItemDetail: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  listItemValue: {
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  insightsContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  insightCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[500],
  },
  insightText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    lineHeight: 20,
  },
});
