import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { X, Filter, Check, RotateCcw } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { Shadows } from '../../constants/Shadows';
import { Button } from '../ui';

interface FilterOptions {
  categories: string[];
  seasons: string[];
  occasions: string[];
  colors: string[];
  brands: string[];
  priceRange: [number, number] | null;
  favorites: boolean;
}

interface WardrobeFiltersProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  availableOptions: {
    categories: string[];
    seasons: string[];
    occasions: string[];
    colors: string[];
    brands: string[];
  };
}

const { height: screenHeight } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const WardrobeFilters: React.FC<WardrobeFiltersProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  availableOptions,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const slideY = useSharedValue(screenHeight);

  React.useEffect(() => {
    if (visible) {
      slideY.value = withSpring(0, { damping: 20, stiffness: 90 });
    } else {
      slideY.value = withTiming(screenHeight, { duration: 300 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      categories: [],
      seasons: [],
      occasions: [],
      colors: [],
      brands: [],
      priceRange: null,
      favorites: false,
    };
    setLocalFilters(resetFilters);
  };

  const toggleArrayFilter = (
    array: string[],
    item: string,
    setter: (newArray: string[]) => void
  ) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const FilterSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const FilterChip: React.FC<{
    label: string;
    selected: boolean;
    onPress: () => void;
    color?: string;
  }> = ({ label, selected, onPress, color }) => {
    const scale = useSharedValue(1);

    const handlePressIn = () => {
      scale.value = withSpring(0.95);
    };

    const handlePressOut = () => {
      scale.value = withSpring(1);
    };

    const chipAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    return (
      <AnimatedTouchableOpacity
        style={[
          styles.chip,
          selected && styles.selectedChip,
          color && { backgroundColor: color, borderColor: color },
          chipAnimatedStyle,
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.chipText,
            selected && styles.selectedChipText,
            color && { color: Colors.white },
          ]}
        >
          {label}
        </Text>
        {selected && (
          <Check size={14} color={color ? Colors.white : Colors.primary[700]} />
        )}
      </AnimatedTouchableOpacity>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        
        <Animated.View style={[styles.container, animatedStyle]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Filter size={24} color={Colors.text.primary} />
              <Text style={styles.title}>Filter Items</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <RotateCcw size={20} color={Colors.text.secondary} />
                <Text style={styles.resetText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <X size={24} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <FilterSection title="Categories">
              <View style={styles.chipContainer}>
                {availableOptions.categories.map(category => (
                  <FilterChip
                    key={category}
                    label={category.replace('_', ' ')}
                    selected={localFilters.categories.includes(category)}
                    onPress={() =>
                      toggleArrayFilter(
                        localFilters.categories,
                        category,
                        categories => setLocalFilters({ ...localFilters, categories })
                      )
                    }
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Seasons">
              <View style={styles.chipContainer}>
                {availableOptions.seasons.map(season => (
                  <FilterChip
                    key={season}
                    label={season}
                    selected={localFilters.seasons.includes(season)}
                    onPress={() =>
                      toggleArrayFilter(
                        localFilters.seasons,
                        season,
                        seasons => setLocalFilters({ ...localFilters, seasons })
                      )
                    }
                  />
                ))}
              </View>
            </FilterSection>

            <FilterSection title="Occasions">
              <View style={styles.chipContainer}>
                {availableOptions.occasions.map(occasion => (
                  <FilterChip
                    key={occasion}
                    label={occasion}
                    selected={localFilters.occasions.includes(occasion)}
                    onPress={() =>
                      toggleArrayFilter(
                        localFilters.occasions,
                        occasion,
                        occasions => setLocalFilters({ ...localFilters, occasions })
                      )
                    }
                  />
                ))}
              </View>
            </FilterSection>

            {availableOptions.colors.length > 0 && (
              <FilterSection title="Colors">
                <View style={styles.chipContainer}>
                  {availableOptions.colors.map(color => (
                    <FilterChip
                      key={color}
                      label={color}
                      selected={localFilters.colors.includes(color)}
                      onPress={() =>
                        toggleArrayFilter(
                          localFilters.colors,
                          color,
                          colors => setLocalFilters({ ...localFilters, colors })
                        )
                      }
                      color={color.toLowerCase()}
                    />
                  ))}
                </View>
              </FilterSection>
            )}

            {availableOptions.brands.length > 0 && (
              <FilterSection title="Brands">
                <View style={styles.chipContainer}>
                  {availableOptions.brands.map(brand => (
                    <FilterChip
                      key={brand}
                      label={brand}
                      selected={localFilters.brands.includes(brand)}
                      onPress={() =>
                        toggleArrayFilter(
                          localFilters.brands,
                          brand,
                          brands => setLocalFilters({ ...localFilters, brands })
                        )
                      }
                    />
                  ))}
                </View>
              </FilterSection>
            )}

            <FilterSection title="Other">
              <FilterChip
                label="Favorites Only"
                selected={localFilters.favorites}
                onPress={() =>
                  setLocalFilters({ ...localFilters, favorites: !localFilters.favorites })
                }
              />
            </FilterSection>
          </ScrollView>

          <View style={styles.footer}>
            <Button
              title="Apply Filters"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: Layout.borderRadius.xl,
    borderTopRightRadius: Layout.borderRadius.xl,
    maxHeight: screenHeight * 0.8,
    ...Shadows.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
  },
  resetText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
    gap: Spacing.xs,
  },
  selectedChip: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[700],
  },
  chipText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  applyButton: {
    width: '100%',
  },
});