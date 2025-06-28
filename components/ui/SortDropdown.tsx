import { Check, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';

export interface SortOption {
  label: string;
  field:
    | 'name'
    | 'category'
    | 'color'
    | 'brand'
    | 'lastWorn'
    | 'timesWorn'
    | 'createdAt'
    | 'price';
  direction: 'asc' | 'desc';
}

interface SortDropdownProps {
  options: SortOption[];
  selectedOption?: SortOption;
  onSelect: (option: SortOption) => void;
  buttonStyle?: ViewStyle;
}

const { width } = Dimensions.get('window');

export const SortDropdown: React.FC<SortDropdownProps> = ({
  options,
  selectedOption,
  onSelect,
  buttonStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownOpacity = useSharedValue(0);
  const dropdownScale = useSharedValue(0.8);
  const chevronRotation = useSharedValue(0);

  const toggleDropdown = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);

    if (newIsOpen) {
      dropdownOpacity.value = withTiming(1, { duration: 200 });
      dropdownScale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
      chevronRotation.value = withTiming(180, { duration: 200 });
    } else {
      dropdownOpacity.value = withTiming(0, { duration: 150 });
      dropdownScale.value = withTiming(0.8, { duration: 150 });
      chevronRotation.value = withTiming(0, { duration: 200 });
    }
  };

  const handleSelect = (option: SortOption) => {
    onSelect(option);
    toggleDropdown();
  };

  const dropdownAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value,
    transform: [{ scale: dropdownScale.value }],
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const selectedLabel = selectedOption?.label || 'Sort by';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.triggerButton, buttonStyle]}
        onPress={toggleDropdown}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Animated.View style={chevronAnimatedStyle}>
          <ChevronDown size={16} color={Colors.text.secondary} />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <>
          <TouchableOpacity
            style={styles.overlay}
            onPress={toggleDropdown}
            activeOpacity={1}
          />
          <Animated.View style={[styles.dropdown, dropdownAnimatedStyle]}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {options.map((option, index) => {
                const isSelected =
                  selectedOption?.field === option.field &&
                  selectedOption?.direction === option.direction;

                return (
                  <TouchableOpacity
                    key={`${option.field}-${option.direction}`}
                    style={[
                      styles.option,
                      isSelected && styles.selectedOption,
                      index === 0 && styles.firstOption,
                      index === options.length - 1 && styles.lastOption,
                    ]}
                    onPress={() => handleSelect(option)}
                    activeOpacity={0.6}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Check size={16} color={Colors.primary[500]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 9999,
  } as ViewStyle,
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    minWidth: 140,
    maxWidth: 200,
    height: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  } as ViewStyle,
  triggerText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.xs,
  } as TextStyle,
  overlay: {
    position: 'absolute',
    top: 0,
    left: -width,
    right: -width,
    bottom: -200,
    zIndex: 9998,
  } as ViewStyle,
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    maxHeight: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 15,
    zIndex: 10000,
  } as ViewStyle,
  scrollView: {
    maxHeight: 280,
  } as ViewStyle,
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border.secondary,
  } as ViewStyle,
  selectedOption: {
    backgroundColor: Colors.primary[500] + '0A',
  } as ViewStyle,
  firstOption: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  } as ViewStyle,
  lastOption: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  } as ViewStyle,
  optionText: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.text.primary,
    flex: 1,
  } as TextStyle,
  selectedOptionText: {
    color: Colors.primary[500],
    fontWeight: '600',
  } as TextStyle,
});
