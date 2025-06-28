import { Check, X } from 'lucide-react-native';
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
import { Layout, Spacing } from '../../constants/Spacing';
import {
  ClothingCategory,
  FilterOptions,
  Occasion,
  Season,
} from '../../types/wardrobe';

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
    // Automatically apply the reset filters
    onApplyFilters(resetFilters);
    onClose();
  };

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
  }> = ({ label, selected, onPress, color }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.selectedChip]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>
        {label}
      </Text>
      {selected && <Check size={16} color="#A428FC" />}
    </TouchableOpacity>
  );

  const ColorChip: React.FC<{
    color: string;
    selected: boolean;
    onPress: () => void;
  }> = ({ color, selected, onPress }) => {
    const isValidHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
    const displayColor = isValidHex ? color : '#CCCCCC';

    return (
      <TouchableOpacity
        style={[
          styles.colorChip,
          { backgroundColor: displayColor },
          selected && styles.selectedColorChip,
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Filter Items</Text>
          </View>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {Object.values(ClothingCategory).map(category => (
                <FilterChip
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
            </ScrollView>
          </FilterSection>

          <FilterSection title="Seasons">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {Object.values(Season).map(season => (
                <FilterChip
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
            </ScrollView>
          </FilterSection>

          <FilterSection title="Occasions">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {Object.values(Occasion).map(occasion => (
                <FilterChip
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
            </ScrollView>
          </FilterSection>

          {availableColors.length > 0 && (
            <FilterSection title="Colors">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {availableColors.map(color => (
                  <ColorChip
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
              </ScrollView>
            </FilterSection>
          )}

          {availableBrands.length > 0 && (
            <FilterSection title="Brands">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {availableBrands.map(brand => (
                  <FilterChip
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
              </ScrollView>
            </FilterSection>
          )}

          <FilterSection title="Other">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              <FilterChip
                label="Favorites Only"
                selected={localFilters.favorites}
                onPress={() =>
                  setLocalFilters({
                    ...localFilters,
                    favorites: !localFilters.favorites,
                  })
                }
              />
            </ScrollView>
          </FilterSection>

          {/* Extra padding for better scroll experience */}
          <View style={styles.extraPadding} />
        </ScrollView>

        {/* Footer with button */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, Spacing.xl) + Spacing.lg },
          ]}
        >
          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
  },
  closeButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginBottom: 0,
  },
  resetButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 16,
    color: '#A428FC',
    fontWeight: '600',
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
    marginBottom: Spacing.lg,
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  horizontalScrollContent: {
    paddingRight: Spacing.lg,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
    gap: 6,
    minHeight: 40,
  },
  selectedChip: {
    backgroundColor: '#f3f4ff',
    borderColor: '#A428FC',
  },
  chipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#A428FC',
    fontWeight: '600',
  },
  colorChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
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
  },
  selectedColorChip: {
    borderColor: '#A428FC',
    borderWidth: 3,
  },
  extraPadding: {
    height: Spacing['4xl'],
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
  },
  applyButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#A428FC',
    borderRadius: Layout.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A428FC',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  applyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
});
