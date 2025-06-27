import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../components/ui';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';
import { useVirtualTryOn } from '../hooks/useVirtualTryOn';
import { TryOnWorkflowState, VirtualTryOnResult } from '../lib/virtualTryOn';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../types/wardrobe';

const mockUser = {
  id: 'test-user',
  imageUrl: 'https://via.placeholder.com/400x600/E5E7EB/374151?text=User+Photo',
};

const mockClothingItems: ClothingItem[] = [
  {
    id: '1',
    name: 'Blue Denim Shirt',
    category: ClothingCategory.TOPS,
    subcategory: 'shirt',
    color: 'Blue',
    brand: 'Test Brand',
    size: 'M',
    season: [],
    occasion: [Occasion.CASUAL],
    imageUrl:
      'https://via.placeholder.com/300x400/3B82F6/FFFFFF?text=Blue+Shirt',
    tags: [],
    isFavorite: false,
    timesWorn: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Black Jeans',
    category: ClothingCategory.BOTTOMS,
    subcategory: 'jeans',
    color: 'Black',
    brand: 'Test Brand',
    size: 'M',
    season: [],
    occasion: [Occasion.CASUAL],
    imageUrl:
      'https://via.placeholder.com/300x400/1F2937/FFFFFF?text=Black+Jeans',
    tags: [],
    isFavorite: false,
    timesWorn: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function TestVirtualTryOnScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState<TryOnWorkflowState | null>(null);
  const [apiResult, setApiResult] = useState<VirtualTryOnResult | null>(null);
  const { processOutfitTryOn } = useVirtualTryOn();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress(null);
    setApiResult(null);
  };

  const testNetworkConnectivity = async () => {
    setIsLoading(true);
    addLog('🌐 Starting network connectivity test...');

    try {
      // Test basic connectivity
      addLog('Testing basic internet connectivity...');
      const basicTest = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        headers: { 'User-Agent': 'Stylisto/1.0.0' },
      });

      if (basicTest.ok) {
        addLog('✅ Basic internet connectivity: OK');
      } else {
        addLog('❌ Basic connectivity failed');
        return;
      }

      // Test API key format
      const apiKey = process.env.EXPO_PUBLIC_FLUX_API_KEY;

      // Test FLUX API endpoint
      addLog('Testing FLUX API endpoint reachability...');
      try {
        const fluxTest = await fetch(
          'https://api.bfl.ml/v1/get_result?id=test',
          {
            method: 'GET',
            headers: {
              'x-key': apiKey || 'test-key',
              Accept: 'application/json',
            },
          }
        );

        addLog(
          `🔗 FLUX API endpoint: ${fluxTest.status} ${fluxTest.statusText} (reachable)`
        );
      } catch (error) {
        addLog(
          `❌ FLUX API endpoint test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
      addLog(`🔑 API Key Status: ${apiKey ? 'Present' : 'Missing'}`);

      if (apiKey) {
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            apiKey
          );
        const isBFL = apiKey.startsWith('bfl_sk_');

        if (isUUID || isBFL) {
          addLog(
            `✅ API Key format: Valid (${isUUID ? 'UUID' : 'BFL'} format)`
          );
          addLog(`🔑 Key preview: ${apiKey.substring(0, 8)}...`);
        } else {
          addLog(
            `❌ API Key format: Invalid (expected UUID or bfl_sk_ format)`
          );
        }
      }
    } catch (error) {
      addLog(
        `❌ Network test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testFluxAPIDirectly = async () => {
    setIsLoading(true);
    addLog('🚀 Testing FLUX API with minimal payload...');

    try {
      const apiKey = process.env.EXPO_PUBLIC_FLUX_API_KEY;

      if (!apiKey) {
        addLog('❌ No API key found');
        return;
      }

      const testPayload = {
        prompt: 'A simple test image of a red apple',
        width: 512,
        height: 512,
        steps: 10,
        guidance: 3.5,
        safety_tolerance: 2,
        output_format: 'jpeg',
      };

      addLog(
        `📡 Sending minimal test request (${JSON.stringify(testPayload).length} bytes)...`
      );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        addLog('⏱️ Request timeout after 30 seconds');
      }, 30000);

      try {
        const response = await fetch(
          'https://api.bfl.ml/v1/flux-dev', // Using cheaper dev model for testing
          {
            method: 'POST',
            headers: {
              'x-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify(testPayload),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        addLog(`📥 Response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          addLog(`❌ Error response: ${errorText}`);

          if (response.status === 403) {
            addLog(
              '💡 Suggestion: Check your API key at https://dashboard.bfl.ai/'
            );
          } else if (response.status === 429) {
            addLog('💡 Suggestion: Wait a moment and try again (rate limited)');
          }
        } else {
          const result = await response.json();
          addLog(`✅ API Response: ${JSON.stringify(result)}`);
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          addLog('❌ Request timed out');
        } else {
          addLog(
            `❌ Fetch error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
          );
        }
      }
    } catch (error) {
      addLog(
        `❌ Direct API test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const testFullVirtualTryOn = async () => {
    setIsLoading(true);
    addLog('🎯 Testing full Virtual Try-On workflow...');
    setProgress(null);
    setApiResult(null);

    try {
      const result = await processOutfitTryOn(
        'test-outfit-001',
        'https://via.placeholder.com/512x512/FF6B6B/FFFFFF?text=Test+User',
        [
          {
            id: 'test-item-001',
            name: 'Test T-Shirt',
            imageUrl:
              'https://via.placeholder.com/512x512/4ECDC4/FFFFFF?text=Test+Shirt',
            category: ClothingCategory.TOPS,
            subcategory: 't-shirt',
            color: 'blue',
            brand: 'Test Brand',
            season: [Season.SPRING, Season.SUMMER],
            occasion: [Occasion.CASUAL],
            tags: ['test'],
            isFavorite: false,
            timesWorn: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        (state: TryOnWorkflowState) => {
          setProgress(state);
          addLog(`📊 ${state.phase}: ${state.message} (${state.progress}%)`);
        }
      );

      setApiResult(result);
      addLog('✅ Full workflow completed successfully!');
      addLog(`🖼️ Result image URL: ${result.generatedImageUrl}`);
      addLog(`⏱️ Processing time: ${result.processingTime}ms`);
      addLog(`🎯 Confidence: ${result.confidence}`);
    } catch (error) {
      addLog(
        `❌ Full workflow failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const viewExistingResult = () => {
    if (apiResult) {
      addLog('👀 Viewing existing API result...');
      addLog(`🖼️ Image URL: ${apiResult.generatedImageUrl}`);
      addLog(`📊 Metadata: ${JSON.stringify(apiResult.metadata, null, 2)}`);
    } else {
      addLog(
        '❌ No existing result to view. Run "Test Full Virtual Try-On" first.'
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginBottom: 16,
            textAlign: 'center',
          }}
        >
          Virtual Try-On Network Diagnostics
        </Text>

        <Card style={{ marginBottom: 16, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Diagnostic Tests
          </Text>

          <View style={{ gap: 12 }}>
            <Button
              title="Test Network Connectivity"
              onPress={testNetworkConnectivity}
              disabled={isLoading}
            />

            <Button
              title="Test FLUX API Directly"
              onPress={testFluxAPIDirectly}
              disabled={isLoading}
            />

            <Button
              title="Test Full Virtual Try-On"
              onPress={testFullVirtualTryOn}
              disabled={isLoading}
            />

            <Button
              title="View Existing Result"
              onPress={viewExistingResult}
              disabled={isLoading}
            />

            <Button
              title="Clear Logs"
              onPress={clearLogs}
              disabled={isLoading}
              style={{ backgroundColor: '#6c757d' }}
            />
          </View>
        </Card>

        {progress && (
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
              Current Progress: {progress.phase}
            </Text>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            >
              <View
                style={{
                  flex: 1,
                  height: 8,
                  backgroundColor: '#e9ecef',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: '100%',
                    backgroundColor:
                      progress.phase === 'error' ? '#dc3545' : '#28a745',
                    width: `${progress.progress}%`,
                    borderRadius: 4,
                  }}
                />
              </View>
              <Text style={{ fontSize: 12, fontWeight: '500', minWidth: 40 }}>
                {progress.progress}%
              </Text>
            </View>
            <Text style={{ fontSize: 14, marginTop: 8, color: '#6c757d' }}>
              {progress.message}
            </Text>
          </Card>
        )}

        {apiResult && (
          <Card style={{ marginBottom: 16, padding: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 12,
                textAlign: 'center',
              }}
            >
              🎉 Virtual Try-On Result
            </Text>

            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Image
                source={{ uri: apiResult.generatedImageUrl }}
                style={{
                  width: 250,
                  height: 250,
                  borderRadius: 12,
                  backgroundColor: '#f8f9fa',
                  borderWidth: 1,
                  borderColor: '#dee2e6',
                }}
                resizeMode="contain"
                onError={() => {
                  addLog(
                    `❌ Failed to load image: ${apiResult.generatedImageUrl}`
                  );
                }}
                onLoad={() => {
                  addLog(`✅ Image loaded successfully`);
                }}
              />
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, color: '#6c757d' }}>
                <Text style={{ fontWeight: '600' }}>Prompt:</Text>{' '}
                {apiResult.metadata.prompt}
              </Text>
              <Text style={{ fontSize: 14, color: '#6c757d' }}>
                <Text style={{ fontWeight: '600' }}>Style:</Text>{' '}
                {apiResult.metadata.styleInstructions}
              </Text>
              <Text style={{ fontSize: 14, color: '#6c757d' }}>
                <Text style={{ fontWeight: '600' }}>Confidence:</Text>{' '}
                {(apiResult.confidence * 100).toFixed(1)}%
              </Text>
              <Text style={{ fontSize: 14, color: '#6c757d' }}>
                <Text style={{ fontWeight: '600' }}>Generated:</Text>{' '}
                {new Date(apiResult.metadata.timestamp).toLocaleString()}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#adb5bd',
                  fontFamily: 'monospace',
                }}
              >
                <Text style={{ fontWeight: '600' }}>Image URL:</Text>{' '}
                {apiResult.generatedImageUrl}
              </Text>
            </View>

            <View style={{ marginTop: 16 }}>
              <Button
                title="🔗 Open Image in Browser"
                onPress={() => {
                  addLog(
                    `🌐 Opening image URL: ${apiResult.generatedImageUrl}`
                  );
                  // You can use Linking.openURL(apiResult.generatedImageUrl) if you import Linking
                }}
                style={{ backgroundColor: '#17a2b8' }}
              />
            </View>
          </Card>
        )}

        <Card style={{ padding: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', flex: 1 }}>
              Diagnostic Logs
            </Text>
            {isLoading && <ActivityIndicator size="small" color="#007bff" />}
          </View>

          <ScrollView
            style={{
              maxHeight: 300,
              backgroundColor: '#f8f9fa',
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#dee2e6',
            }}
            showsVerticalScrollIndicator={true}
          >
            {logs.length === 0 ? (
              <Text style={{ color: '#6c757d', fontStyle: 'italic' }}>
                No logs yet. Run a diagnostic test to see results.
              </Text>
            ) : (
              logs.map((log, index) => (
                <Text
                  key={index}
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    marginBottom: 4,
                    color: log.includes('❌')
                      ? '#dc3545'
                      : log.includes('✅')
                        ? '#28a745'
                        : log.includes('⚠️')
                          ? '#ffc107'
                          : '#212529',
                  }}
                >
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </Card>

        <Card style={{ marginTop: 16, padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            Quick Fixes
          </Text>
          <Text style={{ fontSize: 14, lineHeight: 20, color: '#6c757d' }}>
            • Ensure you have a stable internet connection{'\n'}• Check that
            EXPO_PUBLIC_FLUX_API_KEY is set in your .env file{'\n'}• Verify your
            API key at https://dashboard.bfl.ai/{'\n'}• Try switching between
            WiFi and cellular data{'\n'}• Restart the Expo development server
            {'\n'}• Clear the app cache and restart
          </Text>
        </Card>
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
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  title: {
    ...Typography.heading.h1,
    color: Colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    alignItems: 'center',
  },
  userImage: {
    width: 200,
    height: 300,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  imageLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  imageLabelText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  clothingRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  clothingItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  clothingImage: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: Colors.background.secondary,
  },
  clothingName: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  clothingDetails: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    marginVertical: Spacing.lg,
  },
  testButtonDisabled: {
    backgroundColor: Colors.text.disabled,
  },
  testButtonText: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.background.primary,
    marginLeft: Spacing.sm,
  },
  progressContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  progressPhase: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  progressPercent: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.border.primary,
    borderRadius: 3,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[700],
    borderRadius: 3,
  },
  progressMessage: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultImage: {
    width: 250,
    height: 250,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
  },
  resultInfo: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
});
