import { router } from 'expo-router';
import {
  Activity,
  ArrowLeft,
  BarChart,
  BarChart3,
  Download,
  Eye,
  EyeOff,
  Heart,
  PieChart,
  Shirt,
  TrendingUp,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrivacyModal } from '../../../components/auth/PrivacyModal';
import { H1 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useWardrobe } from '../../../hooks/useWardrobe';
import { ConsentStatus } from '../../../lib/analytics';
import { Season } from '../../../types/wardrobe';
import {
  formatCurrency,
  getWardrobeInsights,
} from '../../../utils/wardrobeUtils';

const { width } = Dimensions.get('window');

export default function ProfileAnalyticsScreen() {
  const { getConsentStatus, setConsentStatus, trackScreenView } =
    useAnalytics();
  const [consentEnabled, setConsentEnabled] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const { items, outfits, stats } = useWardrobe();

  const wardrobeValue = items.reduce(
    (total, item) => total + (item.price || 0),
    0
  );
  const insights = getWardrobeInsights(items);

  // Track screen view
  useEffect(() => {
    trackScreenView('AnalyticsSettings');
  }, [trackScreenView]);

  // Load initial consent status
  useEffect(() => {
    const status = getConsentStatus();
    setConsentEnabled(status === ConsentStatus.GRANTED);
  }, [getConsentStatus]);

  // Handle consent toggle
  const handleConsentToggle = async (value: boolean) => {
    setConsentEnabled(value);
    await setConsentStatus(
      value ? ConsentStatus.GRANTED : ConsentStatus.DENIED
    );
  };

  // Handle data export
  const handleDataExport = () => {
    // In a real app, this would trigger a data export process
    alert(
      'Your data export has been requested. You will receive an email with your data shortly.'
    );
  };

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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Analytics & Privacy</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Data Collection</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Control how Stylisto collects and uses your data to improve the app
            experience.
          </Text>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Analytics Collection</Text>
              <Text style={styles.settingDescription}>
                Allow anonymous usage data collection to help us improve the app
              </Text>
            </View>
            <Switch
              value={consentEnabled}
              onValueChange={handleConsentToggle}
              trackColor={{
                false: Colors.neutral[300],
                true: Colors.primary[500],
              }}
              thumbColor={Platform.OS === 'ios' ? undefined : Colors.white}
            />
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>What data do we collect?</Text>
            <Text style={styles.infoText}>
              • App usage patterns and feature engagement
            </Text>
            <Text style={styles.infoText}>
              • Device information (type, OS version)
            </Text>
            <Text style={styles.infoText}>• App performance metrics</Text>
            <Text style={styles.infoText}>• Crash reports</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PieChart size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>How We Use Your Data</Text>
          </View>

          <View style={styles.usageCard}>
            <View style={styles.usageItem}>
              <Activity size={20} color={Colors.primary[700]} />
              <View style={styles.usageContent}>
                <Text style={styles.usageTitle}>Improve App Experience</Text>
                <Text style={styles.usageDescription}>
                  We analyze usage patterns to enhance features and fix issues
                </Text>
              </View>
            </View>

            <View style={styles.usageItem}>
              <Activity size={20} color={Colors.primary[700]} />
              <View style={styles.usageContent}>
                <Text style={styles.usageTitle}>Develop New Features</Text>
                <Text style={styles.usageDescription}>
                  We identify opportunities for new features based on how you
                  use the app
                </Text>
              </View>
            </View>

            <View style={styles.usageItem}>
              <Activity size={20} color={Colors.primary[700]} />
              <View style={styles.usageContent}>
                <Text style={styles.usageTitle}>
                  Fix Bugs & Performance Issues
                </Text>
                <Text style={styles.usageDescription}>
                  We track errors and performance to make the app more reliable
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Eye size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Your Privacy Rights</Text>
          </View>

          <Text style={styles.sectionDescription}>
            You have control over your data and can exercise these rights at any
            time:
          </Text>

          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <View style={styles.rightIcon}>
                <EyeOff size={16} color={Colors.white} />
              </View>
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Right to Opt Out</Text>
                <Text style={styles.rightDescription}>
                  You can disable analytics collection at any time using the
                  toggle above
                </Text>
              </View>
            </View>

            <View style={styles.rightItem}>
              <View style={styles.rightIcon}>
                <Download size={16} color={Colors.white} />
              </View>
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Right to Access</Text>
                <Text style={styles.rightDescription}>
                  You can request a copy of your data at any time
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleDataExport}
          >
            <Download size={20} color={Colors.white} />
            <Text style={styles.exportButtonText}>Request Data Export</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.privacyTitle}>Privacy Policy</Text>
          <Text style={styles.privacyText}>
            For more information about how we handle your data, please read our
            full Privacy Policy.
          </Text>

          <TouchableOpacity
            style={styles.privacyButton}
            onPress={() => {
              setShowPrivacyModal(true);
            }}
          >
            <Text style={styles.privacyButtonText}>View Privacy Policy</Text>
          </TouchableOpacity>
        </View>

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

      <PrivacyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  infoBox: {
    backgroundColor: Colors.info[50],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoTitle: {
    ...Typography.body.medium,
    color: Colors.info[700],
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.info[700],
    marginBottom: Spacing.xs,
  },
  usageCard: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  usageItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  usageContent: {
    flex: 1,
  },
  usageTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  usageDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  rightsList: {
    marginVertical: Spacing.md,
    gap: Spacing.md,
  },
  rightItem: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  rightIcon: {
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContent: {
    flex: 1,
  },
  rightTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  rightDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  exportButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  privacyTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  privacyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  privacyButton: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  privacyButtonText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    fontFamily: 'Inter-Medium',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  chartContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
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
    color: '#374151',
    fontFamily: 'Inter-Medium',
    flex: 1,
    textTransform: 'capitalize',
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
  },
  chartBar: {
    height: 20,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    marginRight: 8,
  },
  chartValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    fontFamily: 'Inter-SemiBold',
    minWidth: 30,
  },
  seasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  seasonCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  seasonIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'Inter-Medium',
    textTransform: 'capitalize',
    marginBottom: 4,
  },
  seasonCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  listContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontFamily: 'Inter-Medium',
    marginBottom: 2,
  },
  listItemDetail: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    fontFamily: 'Inter-SemiBold',
  },
  insightsContainer: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  insightText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
});
