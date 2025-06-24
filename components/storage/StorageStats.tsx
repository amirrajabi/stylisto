import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BarChart2, HardDrive, Trash2, RefreshCw } from 'lucide-react-native';
import { useStorage } from '../../hooks/useStorage';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface StorageStatsProps {
  onCleanup?: (result: { deletedFiles: string[]; errors: string[] }) => void;
}

export const StorageStats: React.FC<StorageStatsProps> = ({
  onCleanup,
}) => {
  const { user } = useAuth();
  const { getStorageStats, cleanupOrphanedFiles } = useStorage();
  
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalSize: number;
    filesByType: Record<string, number>;
    sizeByType: Record<string, number>;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const storageStats = await getStorageStats(user.id);
      setStats(storageStats);
    } catch (error) {
      setError(`Failed to load storage stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user, getStorageStats]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleCleanup = useCallback(async () => {
    if (!user) return;

    setCleanupLoading(true);
    setError(null);

    try {
      // First do a dry run to see what would be deleted
      const dryRunResult = await cleanupOrphanedFiles(user.id, true);
      
      if (dryRunResult.deletedFiles.length === 0) {
        setError('No orphaned files found to clean up');
        setCleanupLoading(false);
        return;
      }

      // Confirm with user
      const confirmed = confirm(`Found ${dryRunResult.deletedFiles.length} orphaned files. Delete them?`);
      
      if (!confirmed) {
        setCleanupLoading(false);
        return;
      }

      // Perform actual cleanup
      const result = await cleanupOrphanedFiles(user.id, false);
      
      // Refresh stats
      await loadStats();
      
      // Notify parent
      onCleanup?.(result);
    } catch (error) {
      setError(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCleanupLoading(false);
    }
  }, [user, cleanupOrphanedFiles, loadStats, onCleanup]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[700]} />
        <Text style={styles.loadingText}>Loading storage stats...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <RefreshCw size={16} color={Colors.white} />
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No storage data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <HardDrive size={24} color={Colors.text.primary} />
          <Text style={styles.title}>Storage Usage</Text>
        </View>
        
        <TouchableOpacity style={styles.refreshButton} onPress={loadStats}>
          <RefreshCw size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalFiles}</Text>
          <Text style={styles.statLabel}>Total Files</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatFileSize(stats.totalSize)}</Text>
          <Text style={styles.statLabel}>Total Size</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Files by Type</Text>
        
        {Object.entries(stats.filesByType).map(([type, count]) => (
          <View key={type} style={styles.barContainer}>
            <Text style={styles.barLabel}>{type}</Text>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(count / stats.totalFiles) * 100}%`,
                    backgroundColor: getTypeColor(type),
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>{count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage by Type</Text>
        
        {Object.entries(stats.sizeByType).map(([type, size]) => (
          <View key={type} style={styles.barContainer}>
            <Text style={styles.barLabel}>{type}</Text>
            <View style={styles.barWrapper}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(size / stats.totalSize) * 100}%`,
                    backgroundColor: getTypeColor(type),
                  }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>{formatFileSize(size)}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity 
        style={styles.cleanupButton}
        onPress={handleCleanup}
        disabled={cleanupLoading}
      >
        {cleanupLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <>
            <Trash2 size={16} color={Colors.white} />
            <Text style={styles.cleanupButtonText}>Clean Up Orphaned Files</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case 'clothing':
      return Colors.primary[500];
    case 'outfit':
      return Colors.secondary[400];
    case 'profile':
      return Colors.success[500];
    default:
      return Colors.neutral[400];
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  statLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  barLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    width: 80,
    textTransform: 'capitalize',
  },
  barWrapper: {
    flex: 1,
    height: 12,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
    marginRight: Spacing.sm,
  },
  bar: {
    height: '100%',
    borderRadius: Layout.borderRadius.full,
  },
  barValue: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    width: 60,
    textAlign: 'right',
  },
  cleanupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[500],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  cleanupButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  errorContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...Typography.body.medium,
    color: Colors.error[600],
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    borderRadius: Layout.borderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  retryText: {
    ...Typography.button.small,
    color: Colors.white,
  },
  emptyContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
});