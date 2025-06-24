import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { Cloud, Droplets, Sun, Wind, Snowflake, ThermometerSun } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';

interface WeatherOutfitBannerProps {
  temperature: number;
  condition: string;
  location: string;
  onPress: () => void;
}

export const WeatherOutfitBanner: React.FC<WeatherOutfitBannerProps> = ({
  temperature,
  condition,
  location,
  onPress,
}) => {
  // Animation values
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  
  // Start entrance animation
  React.useEffect(() => {
    opacity.value = withDelay(300, withSpring(1));
    scale.value = withDelay(300, withSpring(1));
  }, []);
  
  // Animated styles
  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });
  
  // Handle press animation
  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    onPress();
  };
  
  // Get weather icon based on condition
  const getWeatherIcon = () => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
      return <Droplets size={24} color={Colors.info[500]} />;
    } else if (lowerCondition.includes('snow')) {
      return <Snowflake size={24} color={Colors.info[300]} />;
    } else if (lowerCondition.includes('cloud')) {
      return <Cloud size={24} color={Colors.neutral[500]} />;
    } else if (lowerCondition.includes('wind')) {
      return <Wind size={24} color={Colors.info[400]} />;
    } else {
      return <Sun size={24} color={Colors.warning[500]} />;
    }
  };
  
  // Get temperature color
  const getTemperatureColor = () => {
    if (temperature <= 5) return Colors.info[700]; // Cold
    if (temperature <= 15) return Colors.info[500]; // Cool
    if (temperature <= 25) return Colors.success[500]; // Mild
    return Colors.error[500]; // Hot
  };

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <TouchableOpacity 
        style={styles.content}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.weatherIcon}>
          {getWeatherIcon()}
        </View>
        
        <View style={styles.weatherInfo}>
          <Text style={styles.location}>{location}</Text>
          <View style={styles.conditionRow}>
            <Text style={[styles.temperature, { color: getTemperatureColor() }]}>
              {temperature}°C
            </Text>
            <Text style={styles.condition}>{condition}</Text>
          </View>
        </View>
        
        <View style={styles.actionContainer}>
          <View style={styles.actionButton}>
            <ThermometerSun size={16} color={Colors.white} />
            <Text style={styles.actionText}>Dress for Weather</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    backgroundColor: Colors.surface.primary,
    ...Shadows.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  weatherIcon: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  location: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  temperature: {
    ...Typography.heading.h4,
    fontWeight: '700',
  },
  condition: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  actionContainer: {
    marginLeft: Spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  actionText: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '600',
  },
});