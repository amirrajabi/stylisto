import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors, Layout, Spacing, Typography } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useVirtualTryOnStorage } from '../hooks/useVirtualTryOnStorage';

export default function TestStorageUpload() {
  const { user } = useAuth();
  const { save, test, isSaving, lastResult } = useVirtualTryOnStorage();

  const handleTestUpload = async () => {
    console.log('🧪 Starting test upload...');
    const result = await test();

    if (result.success) {
      Alert.alert('Success', 'Storage upload test passed!');
    } else {
      Alert.alert('Error', result.error || 'Test failed');
    }
  };

  const handleTestSave = async () => {
    console.log('💾 Testing save with dummy data...');

    // Use a placeholder image
    const testImageUrl =
      'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Virtual+Try-On+Test';

    const result = await save(testImageUrl, 'Test Outfit', {
      outfitId: 'test-outfit-123',
      userImageUrl:
        user?.full_body_image_url || 'https://via.placeholder.com/400x600',
      processingTime: 5000,
      confidence: 0.95,
      prompt: 'Test virtual try-on',
      styleInstructions: 'Test style',
      itemsUsed: ['Test Item 1', 'Test Item 2'],
    });

    if (result.success) {
      Alert.alert(
        'Success',
        `Image saved!\nStorage URL: ${result.storageUrl}\nDatabase ID: ${result.databaseId || 'N/A'}`
      );
    } else {
      Alert.alert('Error', result.error || 'Save failed');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Virtual Try-On Storage Test</Text>

        <View style={styles.infoSection}>
          <Text style={styles.infoLabel}>User:</Text>
          <Text style={styles.infoValue}>{user?.email || 'Not logged in'}</Text>

          <Text style={styles.infoLabel}>User ID:</Text>
          <Text style={styles.infoValue}>{user?.id || 'N/A'}</Text>

          <Text style={styles.infoLabel}>Status:</Text>
          <Text style={styles.infoValue}>
            {isSaving ? 'Saving...' : 'Ready'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, isSaving && styles.buttonDisabled]}
          onPress={handleTestUpload}
          disabled={isSaving || !user}
        >
          <Text style={styles.buttonText}>Test Storage Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.buttonSecondary,
            isSaving && styles.buttonDisabled,
          ]}
          onPress={handleTestSave}
          disabled={isSaving || !user}
        >
          <Text style={styles.buttonTextSecondary}>Test Full Save</Text>
        </TouchableOpacity>

        {lastResult && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Last Result:</Text>
            <Text
              style={[
                styles.resultStatus,
                lastResult.success ? styles.resultSuccess : styles.resultError,
              ]}
            >
              {lastResult.success ? '✅ Success' : '❌ Failed'}
            </Text>
            {lastResult.error && (
              <Text style={styles.resultError}>{lastResult.error}</Text>
            )}
            {lastResult.storageUrl && (
              <Text style={styles.resultUrl}>URL: {lastResult.storageUrl}</Text>
            )}
          </View>
        )}

        {!user && (
          <View style={styles.warningSection}>
            <Text style={styles.warningText}>
              ⚠️ Please login to test storage operations
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.lg,
  },
  title: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: Colors.surface.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  infoValue: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  button: {
    backgroundColor: Colors.primary[700],
    padding: Spacing.lg,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...Typography.button.medium,
    color: Colors.surface.primary,
    textAlign: 'center',
  },
  buttonSecondary: {
    backgroundColor: Colors.surface.primary,
    borderWidth: 2,
    borderColor: Colors.primary[700],
  },
  buttonTextSecondary: {
    ...Typography.button.medium,
    color: Colors.primary[700],
    textAlign: 'center',
  },
  resultSection: {
    backgroundColor: Colors.surface.primary,
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.xl,
  },
  resultTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  resultStatus: {
    ...Typography.body.medium,
    marginBottom: Spacing.xs,
  },
  resultSuccess: {
    color: Colors.success[600],
  },
  resultError: {
    color: Colors.error[600],
  },
  resultUrl: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  warningSection: {
    backgroundColor: Colors.warning[100],
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginTop: Spacing.xl,
  },
  warningText: {
    ...Typography.body.medium,
    color: Colors.warning[800],
    textAlign: 'center',
  },
});
