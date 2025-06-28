import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { TestViewShot } from '../components/ui/TestViewShot';
import { Colors } from '../constants/Colors';
import { Layout, Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';
import { ClothingItem } from '../types/wardrobe';

// Sample clothing items for testing
const SAMPLE_ITEMS: ClothingItem[] = [
  {
    id: '1',
    name: 'Red Floral Dress',
    category: 'Dresses' as any,
    color: 'red',
    size: 'M',
    brand: 'Fashion Brand',
    imageUrl:
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Brown Leather Boots',
    category: 'Shoes' as any,
    color: 'brown',
    size: '8',
    brand: 'Shoe Brand',
    imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Black Handbag',
    category: 'Accessories' as any,
    color: 'black',
    size: 'One Size',
    brand: 'Accessory Brand',
    imageUrl:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
    userId: 'test-user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Sample user image
const SAMPLE_USER_IMAGE =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400';

export default function TestVirtualTryOnScreen() {
  const {
    startVirtualTryOn,
    isProcessing,
    progress,
    error,
    result,
    resetVirtualTryOn,
  } = useVirtualTryOn();
  const [selectedItems, setSelectedItems] = useState<ClothingItem[]>([]);
  const [userImage, setUserImage] = useState(SAMPLE_USER_IMAGE);

  useEffect(() => {
    // Auto-select all items for testing
    setSelectedItems(SAMPLE_ITEMS);
  }, []);

  const handleStartTryOn = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('No Items', 'Please select at least one clothing item');
      return;
    }

    try {
      await startVirtualTryOn(
        'test-outfit-' + Date.now(),
        userImage,
        selectedItems
      );
    } catch (err) {
      console.error('Virtual try-on failed:', err);
    }
  };

  const toggleItemSelection = (item: ClothingItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      }
      return [...prev, item];
    });
  };

  const isItemSelected = (item: ClothingItem) => {
    return selectedItems.some(i => i.id === item.id);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Test Virtual Try-On',
          headerStyle: { backgroundColor: Colors.background.primary },
          headerTintColor: Colors.text.primary,
        }}
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.title}>Virtual Try-On with GPT-4 Vision</Text>
          <Text style={styles.subtitle}>
            Test the AI-powered clothing analysis and virtual try-on
          </Text>

          {/* User Image Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Photo</Text>
            <View style={styles.userImageContainer}>
              <Image source={{ uri: userImage }} style={styles.userImage} />
              <Text style={styles.imageLabel}>Sample Model Image</Text>
            </View>
          </View>

          {/* Clothing Items Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select Clothing Items</Text>
            <View style={styles.itemsGrid}>
              {SAMPLE_ITEMS.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isItemSelected(item) && styles.itemCardSelected,
                  ]}
                  onPress={() => toggleItemSelection(item)}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                  />
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  {isItemSelected(item) && (
                    <View style={styles.selectedBadge}>
                      <CheckCircle size={20} color={Colors.surface.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Status Section */}
          {(isProcessing || error || result) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>

              {isProcessing && (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[600]} />
                  <Text style={styles.processingText}>
                    AI is analyzing clothing and generating try-on...
                  </Text>
                  <View style={styles.progressBar}>
                    <View
                      style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>{progress}% Complete</Text>
                </View>
              )}

              {error && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={24} color={Colors.error[600]} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {result && (
                <View style={styles.resultContainer}>
                  <Text style={styles.resultTitle}>
                    ✅ Virtual Try-On Complete!
                  </Text>
                  <Image
                    source={{ uri: result.generatedImageUrl }}
                    style={styles.resultImage}
                    contentFit="contain"
                  />
                  <View style={styles.resultMeta}>
                    <Text style={styles.metaLabel}>Processing Time:</Text>
                    <Text style={styles.metaValue}>
                      {Math.round(result.processingTime / 1000)}s
                    </Text>
                  </View>
                  {(result.metadata as any)?.aiAnalysis && (
                    <View style={styles.analysisSection}>
                      <Text style={styles.analysisTitle}>AI Analysis:</Text>
                      {(result.metadata as any).aiAnalysis.map(
                        (item: any, index: number) => (
                          <Text key={index} style={styles.analysisItem}>
                            • {item.category}: {item.description}
                          </Text>
                        )
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleStartTryOn}
              disabled={isProcessing || selectedItems.length === 0}
            >
              <Sparkles size={20} color={Colors.surface.primary} />
              <Text style={styles.buttonText}>
                {isProcessing ? 'Processing...' : 'Start Virtual Try-On'}
              </Text>
            </TouchableOpacity>

            {result && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={resetVirtualTryOn}
              >
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Section */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              1. GPT-4 Vision analyzes each clothing item{'\n'}
              2. AI generates detailed descriptions{'\n'}
              3. FLUX creates the virtual try-on image{'\n'}
              4. You see the final result!
            </Text>

            <Text style={styles.warningText}>
              Note: Make sure EXPO_PUBLIC_OPENAI_API_KEY is set in your .env
              file for GPT-4 Vision to work.
            </Text>
          </View>

          {/* Test ViewShot Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test ViewShot Component</Text>
            <TestViewShot />
          </View>
        </View>
      </ScrollView>
    </>
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
    ...Typography.heading.h2,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  userImageContainer: {
    alignItems: 'center',
  },
  userImage: {
    width: 200,
    height: 300,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.sm,
  },
  imageLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  itemCard: {
    width: '30%',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  itemCardSelected: {
    borderColor: Colors.primary[600],
  },
  itemImage: {
    width: '100%',
    height: 100,
    borderRadius: Layout.borderRadius.sm,
    marginBottom: Spacing.xs,
  },
  itemName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  itemCategory: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontSize: 10,
  },
  selectedBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Colors.primary[600],
    borderRadius: Layout.borderRadius.full,
    padding: 2,
  },
  processingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
  },
  processingText: {
    ...Typography.body.regular,
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[600],
  },
  progressText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body.regular,
    color: Colors.error[600],
    flex: 1,
  },
  resultContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  resultTitle: {
    ...Typography.heading.h3,
    color: Colors.success[600],
    marginBottom: Spacing.md,
  },
  resultImage: {
    width: '100%',
    height: 400,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaLabel: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
  metaValue: {
    ...Typography.body.regular,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  analysisSection: {
    width: '100%',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: Layout.borderRadius.sm,
  },
  analysisTitle: {
    ...Typography.body.regular,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  analysisItem: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  actions: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary[600],
  },
  secondaryButton: {
    backgroundColor: Colors.surface.primary,
    borderWidth: 1,
    borderColor: Colors.primary[600],
  },
  buttonText: {
    ...Typography.body.regular,
    color: Colors.surface.primary,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...Typography.body.regular,
    color: Colors.primary[600],
    fontWeight: '600',
  },
  infoSection: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
  },
  infoTitle: {
    ...Typography.body.regular,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  warningText: {
    ...Typography.body.small,
    color: Colors.warning[600],
    backgroundColor: Colors.warning[50],
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.sm,
  },
});
