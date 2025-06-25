import { BarChart3, Heart, Shirt, TrendingUp } from 'lucide-react-native';
import React from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useWardrobe } from '../../hooks/useWardrobe';
import { Season } from '../../types/wardrobe';
import { formatCurrency, getWardrobeInsights } from '../../utils/wardrobeUtils';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const { items, outfits, stats } = useWardrobe();

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
                      backgroundColor: '#3b82f6',
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Stats */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Shirt size={20} color="#3b82f6" />}
            color="#3b82f6"
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

        {/* Category Distribution */}
        <CategoryChart />

        {/* Season Distribution */}
        <SeasonChart />

        {/* Most Worn Items */}
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

        {/* Least Worn Items */}
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

        {/* Insights */}
        <InsightsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: (width - 44) / 2,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  chart: {
    gap: 12,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartLabel: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
    width: 80,
    fontFamily: 'Inter-Regular',
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  chartBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-SemiBold',
  },
  seasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seasonCard: {
    flex: 1,
    minWidth: (width - 76) / 2,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  seasonIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
    marginBottom: 4,
    fontFamily: 'Inter-Regular',
  },
  seasonCount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter-SemiBold',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    fontFamily: 'Inter-SemiBold',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listItemInfo: {
    flex: 1,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  listItemDetail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
    fontFamily: 'Inter-SemiBold',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  insightCard: {
    backgroundColor: '#eff6ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  insightText: {
    fontSize: 14,
    color: '#1e40af',
    fontFamily: 'Inter-Regular',
  },
});
