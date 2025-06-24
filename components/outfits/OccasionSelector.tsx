import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Briefcase, Calendar, Coffee, Dumbbell, Heart, Plane, Shirt, Sparkles } from 'lucide-react-native';
import { Occasion } from '../../types/wardrobe';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface OccasionSelectorProps {
  selectedOccasion: Occasion | null;
  onSelectOccasion: (occasion: Occasion | null) => void;
}

interface OccasionOption {
  value: Occasion;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const OccasionSelector: React.FC<OccasionSelectorProps> = ({
  selectedOccasion,
  onSelectOccasion,
}) => {
  const [scaleValues] = useState(() => 
    Object.values(Occasion).reduce((acc, occasion) => {
      acc[occasion] = useSharedValue(1);
      return acc;
    }, {} as Record<Occasion, Animated.SharedValue<number>>)
  );

  const occasionOptions: OccasionOption[] = [
    { 
      value: Occasion.CASUAL, 
      label: 'Casual', 
      icon: <Coffee size={20} color={Colors.white} />,
      color: Colors.neutral[500],
    },
    { 
      value: Occasion.WORK, 
      label: 'Work', 
      icon: <Briefcase size={20} color={Colors.white} />,
      color: Colors.primary[700],
    },
    { 
      value: Occasion.FORMAL, 
      label: 'Formal', 
      icon: <Shirt size={20} color={Colors.white} />,
      color: Colors.black,
    },
    { 
      value: Occasion.PARTY, 
      label: 'Party', 
      icon: <Sparkles size={20} color={Colors.white} />,
      color: Colors.secondary[500],
    },
    { 
      value: Occasion.SPORT, 
      label: 'Sport', 
      icon: <Dumbbell size={20} color={Colors.white} />,
      color: Colors.success[500],
    },
    { 
      value: Occasion.TRAVEL, 
      label: 'Travel', 
      icon: <Plane size={20} color={Colors.white} />,
      color: Colors.info[500],
    },
    { 
      value: Occasion.DATE, 
      label: 'Date', 
      icon: <Heart size={20} color={Colors.white} />,
      color: Colors.error[500],
    },
    { 
      value: Occasion.SPECIAL, 
      label: 'Special', 
      icon: <Calendar size={20} color={Colors.white} />,
      color: Colors.warning[500],
    },
  ];

  const handleOccasionPress = (occasion: Occasion) => {
    // Animate button press
    scaleValues[occasion].value = withSpring(0.9, {}, () => {
      scaleValues[occasion].value = withSpring(1);
    });
    
    // Toggle selection
    onSelectOccasion(selectedOccasion === occasion ? null : occasion);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Occasion</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {occasionOptions.map((option) => {
          const isSelected = selectedOccasion === option.value;
          
          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: scaleValues[option.value].value }],
            };
          });
          
          return (
            <AnimatedTouchableOpacity
              key={option.value}
              style={[
                styles.occasionButton,
                { backgroundColor: option.color },
                isSelected && styles.selectedButton,
                animatedStyle,
              ]}
              onPress={() => handleOccasionPress(option.value)}
              activeOpacity={0.8}
            >
              <View style={styles.occasionIcon}>
                {option.icon}
              </View>
              <Text style={styles.occasionLabel}>{option.label}</Text>
            </AnimatedTouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  occasionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    minWidth: 80,
    gap: Spacing.xs,
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: Colors.shadow.medium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  occasionIcon: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  occasionLabel: {
    ...Typography.caption.medium,
    color: Colors.white,
    fontWeight: '600',
  },
});