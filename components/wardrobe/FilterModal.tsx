import { Check, Filter, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import {
  ClothingCategory,
  FilterOptions,
  Occasion,
  Season,
} from '../../types/wardrobe';
import { Button } from '../ui';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onApplyFilters: (filters: FilterOptions) => void;
  availableColors: string[];
  availableBrands: string[];
  availableTags: string[];
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  availableColors,
  availableBrands,
  availableTags,
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);
  const insets = useSafeAreaInsets();

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
      tags: [],
      favorites: false,
    };
    setLocalFilters(resetFilters);
  };

  const hasActiveFilters =
    localFilters.categories.length > 0 ||
    localFilters.seasons.length > 0 ||
    localFilters.occasions.length > 0 ||
    localFilters.colors.length > 0 ||
    localFilters.brands.length > 0 ||
    localFilters.tags.length > 0 ||
    localFilters.favorites;

  const toggleArrayFilter = <T,>(
    array: T[],
    item: T,
    setter: (newArray: T[]) => void
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
    description?: string;
  }> = ({ title, children, description }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {description && (
        <Text style={styles.sectionDescription}>{description}</Text>
      )}
      {children}
    </View>
  );

  const FilterCard: React.FC<{
    label: string;
    selected: boolean;
    onPress: () => void;
  }> = ({ label, selected, onPress }) => (
    <TouchableOpacity
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <Text
        style={[styles.optionLabel, selected && styles.optionLabelSelected]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const ColorCard: React.FC<{
    color: string;
    selected: boolean;
    onPress: () => void;
  }> = ({ color, selected, onPress }) => {
    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    const displayColor = isValidHex ? color : '#CCCCCC';

    return (
      <TouchableOpacity
        style={[
          styles.colorCard,
          { backgroundColor: displayColor },
          selected && styles.colorCardSelected,
        ]}
        onPress={onPress}
      >
        {selected && (
          <Check
            size={16}
            color={
              isValidHex && parseInt(color.slice(1), 16) > 0x888888
                ? '#000000'
                : '#FFFFFF'
            }
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Filter size={24} color="#A428FC" />
            <Text style={styles.headerTitle}>Filter Items</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <FilterSection title="Categories">
            <View style={styles.optionsGrid}>
              {Object.values(ClothingCategory).map(category => (
                <FilterCard
                  key={category}
                  label={category.replace('_', ' ')}
                  selected={localFilters.categories.includes(category)}
                  onPress={() =>
                    toggleArrayFilter(
                      localFilters.categories,
                      category,
                      categories =>
                        setLocalFilters({ ...localFilters, categories })
                    )
                  }
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Seasons">
            <View style={styles.optionsGrid}>
              {Object.values(Season).map(season => (
                <FilterCard
                  key={season}
                  label={season}
                  selected={localFilters.seasons.includes(season)}
                  onPress={() =>
                    toggleArrayFilter(localFilters.seasons, season, seasons =>
                      setLocalFilters({ ...localFilters, seasons })
                    )
                  }
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Occasions">
            <View style={styles.optionsGrid}>
              {Object.values(Occasion).map(occasion => (
                <FilterCard
                  key={occasion}
                  label={occasion}
                  selected={localFilters.occasions.includes(occasion)}
                  onPress={() =>
                    toggleArrayFilter(
                      localFilters.occasions,
                      occasion,
                      occasions =>
                        setLocalFilters({ ...localFilters, occasions })
                    )
                  }
                />
              ))}
            </View>
          </FilterSection>

          <FilterSection title="Colors">
            <View style={styles.colorGrid}>
              {availableColors.map(color => (
                <ColorCard
                  key={color}
                  color={color}
                  selected={localFilters.colors.includes(color)}
                  onPress={() =>
                    toggleArrayFilter(localFilters.colors, color, colors =>
                      setLocalFilters({ ...localFilters, colors })
                    )
                  }
                />
              ))}
            </View>
          </FilterSection>

          {availableBrands.length > 0 && (
            <FilterSection title="Brands">
              <View style={styles.optionsGrid}>
                {availableBrands.map(brand => (
                  <FilterCard
                    key={brand}
                    label={brand}
                    selected={localFilters.brands.includes(brand)}
                    onPress={() =>
                      toggleArrayFilter(localFilters.brands, brand, brands =>
                        setLocalFilters({ ...localFilters, brands })
                      )
                    }
                  />
                ))}
              </View>
            </FilterSection>
          )}

          <FilterSection title="Other">
            <View style={styles.optionsGrid}>
              <FilterCard
                label="Favorites Only"
                selected={localFilters.favorites}
                onPress={() =>
                  setLocalFilters({
                    ...localFilters,
                    favorites: !localFilters.favorites,
                  })
                }
              />
            </View>
          </FilterSection>

          {/* Extra padding for better scroll experience */}
          <View style={styles.extraPadding} />
        </ScrollView>

        {/* Footer */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
          ]}
        >
          <View style={styles.footerButtons}>
            <Button
              title="Reset All"
              variant="outline"
              onPress={handleReset}
              disabled={!hasActiveFilters}
              style={styles.resetButton}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>

          {/* Home indicator */}
          <View style={styles.homeIndicator} />
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionCard: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: '45%',
    flex: 1,
  },
  optionCardSelected: {
    backgroundColor: '#f3f4ff',
    borderColor: '#A428FC',
  },
  optionLabel: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  optionLabelSelected: {
    color: '#A428FC',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorCard: {
    width: 60,
    height: 60,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: Spacing.sm,
  },
  colorCardSelected: {
    borderColor: '#A428FC',
    borderWidth: 2,
  },
  extraPadding: {
    height: Spacing['4xl'],
  },
  footer: {
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    ...Shadows.sm,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  resetButton: {
    flex: 1,
  },
  applyButton: {
    flex: 2,
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
});
