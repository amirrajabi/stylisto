import { AlertCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ProfileHeader } from '../../../components/profile/ProfileHeader';
import { StorageStats } from '../../../components/storage/StorageStats';
import { BodyMedium } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAuth } from '../../../hooks/useAuth';

export default function StorageScreen() {
  const { user } = useAuth();
  const [cleanupResult, setCleanupResult] = useState<{
    deletedFiles: string[];
    errors: string[];
  } | null>(null);

  const handleCleanupResult = (result: {
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
      Alert.alert('No Files to Clean Up', 'No orphaned files were found.', [
        { text: 'OK' },
      ]);
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ProfileHeader title="Storage Management" />

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
      <ProfileHeader title="Storage Management" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Overview</Text>
          <StorageStats onCleanup={handleCleanupResult} />
        </View>

        {cleanupResult && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cleanup Results</Text>

            {cleanupResult.deletedFiles.length > 0 && (
              <View style={styles.resultCard}>
                <Text style={styles.resultTitle}>Deleted Files</Text>
                {cleanupResult.deletedFiles.map((file, index) => (
                  <Text key={index} style={styles.resultItem}>
                    • {file}
                  </Text>
                ))}
              </View>
            )}

            {cleanupResult.errors.length > 0 && (
              <View style={[styles.resultCard, styles.errorCard]}>
                <Text style={[styles.resultTitle, styles.errorTitle]}>
                  Errors
                </Text>
                {cleanupResult.errors.map((error, index) => (
                  <Text
                    key={index}
                    style={[styles.resultItem, styles.errorText]}
                  >
                    • {error}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
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
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorCard: {
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[200],
    borderWidth: 1,
  },
  resultTitle: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  resultItem: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
});
