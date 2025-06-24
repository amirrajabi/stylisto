import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Spacing, Layout } from '../../constants/Spacing';

interface WardrobeLoadingStateProps {
  viewMode: 'grid' | 'list';
  itemCount?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_ITEM_WIDTH = (screenWidth - Spacing.lg * 3) / 2;
const LIST_ITEM_HEIGHT = 120;

const SkeletonBox: React.FC<{
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: any;
}> = ({ width, height, borderRadius = Layout.borderRadius.md, style }) => {
  const opacity = useSharedValue(0.3);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: Colors.neutral[200],
          borderRadius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
};

const GridSkeletonItem: React.FC<{ index: number }> = ({ index }) => {
  const translateY = useSharedValue(20);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 100;
    opacity.value = withTiming(1, { duration: 300 }, () => {
      translateY.value = withTiming(0, { duration: 400 });
    });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.gridSkeletonCard, animatedStyle]}>
      <SkeletonBox
        width="100%"
        height={GRID_ITEM_WIDTH * 1.2}
        borderRadius={Layout.borderRadius.lg}
        style={styles.gridSkeletonImage}
      />
      
      <View style={styles.gridSkeletonContent}>
        <SkeletonBox
          width="80%"
          height={16}
          style={styles.gridSkeletonTitle}
        />
        
        <SkeletonBox
          width="60%"
          height={12}
          style={styles.gridSkeletonBrand}
        />
        
        <View style={styles.gridSkeletonTags}>
          <SkeletonBox width={40} height={20} borderRadius={10} />
          <SkeletonBox width={50} height={20} borderRadius={10} />
        </View>
        
        <View style={styles.gridSkeletonFooter}>
          <SkeletonBox width={12} height={12} borderRadius={6} />
          <SkeletonBox width="40%" height={10} />
        </View>
      </View>
    </Animated.View>
  );
};

const ListSkeletonItem: React.FC<{ index: number }> = ({ index }) => {
  const translateX = useSharedValue(-20);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const delay = index * 80;
    opacity.value = withTiming(1, { duration: 300 }, () => {
      translateX.value = withTiming(0, { duration: 400 });
    });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View style={[styles.listSkeletonCard, animatedStyle]}>
      <SkeletonBox
        width={88}
        height={88}
        borderRadius={Layout.borderRadius.md}
        style={styles.listSkeletonImage}
      />
      
      <View style={styles.listSkeletonContent}>
        <View style={styles.listSkeletonHeader}>
          <SkeletonBox width="70%" height={16} />
          <View style={styles.listSkeletonActions}>
            <SkeletonBox width={24} height={24} borderRadius={12} />
            <SkeletonBox width={24} height={24} borderRadius={12} />
          </View>
        </View>
        
        <SkeletonBox
          width="50%"
          height={12}
          style={styles.listSkeletonMeta}
        />
        
        <View style={styles.listSkeletonStats}>
          <SkeletonBox width={30} height={10} />
          <SkeletonBox width={40} height={10} />
          <SkeletonBox width={35} height={10} />
        </View>
        
        <View style={styles.listSkeletonTags}>
          <SkeletonBox width={40} height={16} borderRadius={8} />
          <SkeletonBox width={50} height={16} borderRadius={8} />
        </View>
      </View>
    </Animated.View>
  );
};

export const WardrobeLoadingState: React.FC<WardrobeLoadingStateProps> = ({
  viewMode,
  itemCount = 8,
}) => {
  const items = Array.from({ length: itemCount }, (_, index) => index);

  if (viewMode === 'list') {
    return (
      <View style={styles.container}>
        {items.map((index) => (
          <ListSkeletonItem key={index} index={index} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {items.map((index) => (
        <GridSkeletonItem key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  
  // Grid skeleton styles
  gridSkeletonCard: {
    width: GRID_ITEM_WIDTH,
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  gridSkeletonImage: {
    marginBottom: 0,
  },
  gridSkeletonContent: {
    padding: Spacing.md,
  },
  gridSkeletonTitle: {
    marginBottom: Spacing.sm,
  },
  gridSkeletonBrand: {
    marginBottom: Spacing.md,
  },
  gridSkeletonTags: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  gridSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  // List skeleton styles
  listSkeletonCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    height: LIST_ITEM_HEIGHT,
  },
  listSkeletonImage: {
    marginRight: Spacing.md,
  },
  listSkeletonContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listSkeletonActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  listSkeletonMeta: {
    marginVertical: Spacing.xs,
  },
  listSkeletonStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  listSkeletonTags: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
});