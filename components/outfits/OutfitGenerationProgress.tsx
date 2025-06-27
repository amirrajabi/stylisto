import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { ProgressBar } from '../ui/ProgressBar';

interface OutfitGenerationProgressProps {
  isGenerating: boolean;
  progress: number;
  onComplete?: () => void;
}

export const OutfitGenerationProgress: React.FC<
  OutfitGenerationProgressProps
> = ({ isGenerating, progress, onComplete }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (isGenerating) {
      const interval = setInterval(() => {
        setAnimatedProgress(prev => {
          const newProgress = Math.min(prev + 0.02, progress);
          if (newProgress >= 1 && onComplete) {
            onComplete();
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isGenerating, progress, onComplete]);

  if (!isGenerating) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generating Outfits...</Text>
      <ProgressBar
        progress={animatedProgress}
        showPercentage={false}
        color={Colors.primary[500]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    marginVertical: Spacing.md,
  },
  title: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '500',
  },
});
