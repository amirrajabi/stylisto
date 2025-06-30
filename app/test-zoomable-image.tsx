import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ZoomableImage } from '../components/ui/ZoomableImage';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { Typography } from '../constants/Typography';

export default function TestZoomableImageScreen() {
  const sampleImageUrl =
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=1200&fit=crop&crop=center';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Zoomable Image Test</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.instructions}>
          Use two fingers to pinch and zoom the image below:
        </Text>

        <View style={styles.imageContainer}>
          <ZoomableImage
            source={{ uri: sampleImageUrl }}
            style={styles.image}
            resizeMode="contain"
            maxZoom={4}
            minZoom={1}
            doubleTapZoom={2.5}
          />
        </View>

        <Text style={styles.features}>
          Features:
          {'\n'}• Pinch to zoom (1x to 4x)
          {'\n'}• Pan to move when zoomed
          {'\n'}• Auto-reset on zoom out
          {'\n'}• Smooth spring animations
        </Text>
      </View>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  instructions: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  imageContainer: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  image: {
    flex: 1,
  },
  features: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});
