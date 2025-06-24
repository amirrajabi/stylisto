import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Plus, Search, Filter } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Button } from '../ui';

interface WardrobeEmptyStateProps {
  type: 'empty' | 'no-results' | 'filtered';
  searchQuery?: string;
  activeFiltersCount?: number;
  onAddItem?: () => void;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const WardrobeEmptyState: React.FC<WardrobeEmptyStateProps> = ({
  type,
  searchQuery,
  activeFiltersCount = 0,
  onAddItem,
  onClearSearch,
  onClearFilters,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  React.useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 150 }));
    opacity.value = withDelay(100, withSpring(1));
    translateY.value = withDelay(150, withSpring(0));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const getContent = () => {
    switch (type) {
      case 'empty':
        return {
          image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'Your wardrobe is empty',
          subtitle: 'Start building your digital wardrobe by adding your first clothing item',
          primaryAction: {
            title: 'Add Your First Item',
            icon: <Plus size={20} color={Colors.white} />,
            onPress: onAddItem,
          },
        };
      
      case 'no-results':
        return {
          image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'No items found',
          subtitle: searchQuery 
            ? `No items match "${searchQuery}". Try a different search term.`
            : 'No items match your search criteria.',
          primaryAction: searchQuery ? {
            title: 'Clear Search',
            icon: <Search size={20} color={Colors.primary[700]} />,
            onPress: onClearSearch,
            variant: 'outline' as const,
          } : undefined,
          secondaryAction: onAddItem ? {
            title: 'Add New Item',
            icon: <Plus size={20} color={Colors.white} />,
            onPress: onAddItem,
          } : undefined,
        };
      
      case 'filtered':
        return {
          image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
          title: 'No items match filters',
          subtitle: `No items found with the current ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''}. Try adjusting your filters.`,
          primaryAction: {
            title: 'Clear Filters',
            icon: <Filter size={20} color={Colors.primary[700]} />,
            onPress: onClearFilters,
            variant: 'outline' as const,
          },
          secondaryAction: onAddItem ? {
            title: 'Add New Item',
            icon: <Plus size={20} color={Colors.white} />,
            onPress: onAddItem,
          } : undefined,
        };
      
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: content.image }}
          style={styles.image}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.imageOverlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.subtitle}>{content.subtitle}</Text>

        <View style={styles.actions}>
          {content.primaryAction && (
            <Button
              title={content.primaryAction.title}
              onPress={content.primaryAction.onPress}
              leftIcon={content.primaryAction.icon}
              variant={content.primaryAction.variant || 'primary'}
              style={styles.primaryButton}
            />
          )}

          {content.secondaryAction && (
            <Button
              title={content.secondaryAction.title}
              onPress={content.secondaryAction.onPress}
              leftIcon={content.secondaryAction.icon}
              variant="ghost"
              style={styles.secondaryButton}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
  },
  imageContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    ...Typography.heading.h2,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  actions: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    width: '100%',
  },
});