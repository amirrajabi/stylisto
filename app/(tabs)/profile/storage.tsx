import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, HardDrive, Trash2, AlertCircle } from 'lucide-react-native';
import { StorageStats } from '../../../components/storage/StorageStats';
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { H1, BodyMedium } from '../../../components/ui';

export default function StorageScreen() {
  const { user } = useAuth();
  const [cleanupResult, setCleanupResult] = useState<{
    deletedFiles: string[];
    errors: string[];
  } | null>(null);

  const handleCleanupResult = useCallback((result: {
    deletedFiles: string[];
    errors: string[];
  }) => {
    setCleanupResult(result);
    
    if (result.errors.length > 0) {
      Alert.alert(
        'Cleanup Completed with Errors',
        `Deleted ${result.deletedFiles.length} files with ${result.errors.length} errors.`,
        [{ text: 'OK' }]
      );
    } else if (result.deletedFiles.length > 0) {
      Alert.alert(
        'Cleanup Successful',
        `Successfully deleted ${result.deletedFiles.length} orphaned files.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'No Files to Clean Up',
        'No orphaned files were found.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <H1>Storage Management</H1>
        </View>
        
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.error[500]} />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <BodyMedium color="secondary" style={styles.errorText}>
            You need to be logged in to view storage information.
          </BodyMedium>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Storage Management</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <StorageStats onCleanup={handleCleanupResult} />
        </View>

        {cleanupResult && (
          <View style={styles.section}>
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <HardDrive size={20} color={Colors.text.primary} />
                <Text style={styles.resultTitle}>Cleanup Results</Text>
              </View>
              
              <View style={styles.resultContent}>
                <Text style={styles.resultSummary}>
                  {cleanupResult.deletedFiles.length} files processed
                </Text>
                
                {cleanupResult.deletedFiles.length > 0 ? (
                  <View style={styles.filesList}>
                    <Text style={styles.filesListTitle}>Deleted Files:</Text>
                    {cleanupResult.deletedFiles.slice(0, 5).map((file, index) => (
                      <Text key={index} style={styles.filePath} numberOfLines={1}>
                        • {file.split('/').pop()}
                      </Text>
                    ))}
                    {cleanupResult.deletedFiles.length > 5 && (
                      <Text style={styles.moreFiles}>
                        ...and {cleanupResult.deletedFiles.length - 5} more
                      </Text>
                    )}
                  </View>
                ) : (
                  <Text style={styles.noFilesText}>
                    No orphaned files found to clean up.
                  </Text>
                )}
                
                {cleanupResult.errors.length > 0 && (
                  <View style={styles.errorsList}>
                    <Text style={styles.errorsListTitle}>Errors:</Text>
                    {cleanupResult.errors.map((error, index) => (
                      <Text key={index} style={styles.errorItem}>
                        • {error}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>About Storage Management</Text>
            <Text style={styles.infoText}>
              Stylisto uses secure cloud storage to keep your wardrobe images safe and accessible.
              Images are automatically optimized for different use cases to ensure fast loading times.
            </Text>
            
            <Text style={styles.infoSubtitle}>Storage Features:</Text>
            <View style={styles.featuresList}>
              <Text style={styles.featureItem}>
                • Automatic image optimization
              </Text>
              <Text style={styles.featureItem}>
                • Secure access controls
              </Text>
              <Text style={styles.featureItem}>
                • CDN-powered fast loading
              </Text>
              <Text style={styles.featureItem}>
                • Orphaned file cleanup
              </Text>
            </View>
            
            <Text style={styles.infoSubtitle}>Storage Limits:</Text>
            <Text style={styles.infoText}>
              Free accounts include 1GB of storage space. Premium accounts include additional storage based on your subscription level.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },
  backButton: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  resultCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  resultTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  resultContent: {
    gap: Spacing.md,
  },
  resultSummary: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  filesList: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  filesListTitle: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filePath: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  moreFiles: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  noFilesText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  errorsList: {
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  errorsListTitle: {
    ...Typography.body.small,
    color: Colors.error[700],
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  errorItem: {
    ...Typography.caption.medium,
    color: Colors.error[700],
    marginBottom: Spacing.xs,
  },
  infoCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
  },
  infoTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  infoSubtitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  featuresList: {
    marginBottom: Spacing.md,
  },
  featureItem: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    textAlign: 'center',
  },
});