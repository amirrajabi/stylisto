import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { ClothingCategory, Season, Occasion, FilterOptions } from '../../types/wardrobe';

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
      style={[
        styles.chip,
        selected && styles.selectedChip,
        color && { backgroundColor: color, borderColor: color },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.chipText,
          selected && styles.selectedChipText,
          color && { color: '#ffffff' },
        ]}
      >
        {label}
      </Text>
      {selected && <Check size={16} color={color ? '#ffffff' : '#3b82f6'} />}
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Filter Items</Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <FilterSection title="Categories">
            <View style={styles.chipContainer}>
              {Object.values(ClothingCategory).map(category => (
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
              {Object.values(Season).map(season => (
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
              {Object.values(Occasion).map(occasion => (
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

          {availableColors.length > 0 && (
            <FilterSection title="Colors">
              <View style={styles.chipContainer}>
                {availableColors.map(color => (
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
                    color={color}
                  />
                ))}
              </View>
            </FilterSection>
          )}

          {availableBrands.length > 0 && (
            <FilterSection title="Brands">
              <View style={styles.chipContainer}>
                {availableBrands.map(brand => (
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
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
    gap: 4,
  },
  selectedChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#3b82f6',
    fontWeight: '500',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});