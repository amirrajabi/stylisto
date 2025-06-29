import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Camera,
  Check,
  Image as ImageIcon,
  Plus,
  X,
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useWardrobe } from '../../hooks/useWardrobe';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../../types/wardrobe';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  onAddItem: (item: ClothingItem) => void;
  editItem?: ClothingItem;
}

const SAMPLE_IMAGES = [
  'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=400',
];

const COLORS = [
  '#000000',
  '#ffffff',
  '#808080',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00',
  '#ff00ff',
  '#00ffff',
  '#ffa500',
  '#800080',
  '#ffc0cb',
  '#a52a2a',
  '#000080',
  '#008000',
  '#800000',
];

export const AddItemModal: React.FC<AddItemModalProps> = ({
  visible,
  onClose,
  onAddItem,
  editItem,
}) => {
  const { actions, isLoading } = useWardrobe();
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState<Partial<ClothingItem>>({});
  const [newTag, setNewTag] = useState('');

  // Initialize form data when editItem changes
  useEffect(() => {
    if (editItem) {
      // Update form data with edit item data
      setFormData({
        name: editItem.name || '',
        category: editItem.category || ('tops' as ClothingCategory),
        subcategory: editItem.subcategory || '',
        color: editItem.color || '#000000',
        brand: editItem.brand || '',
        size: editItem.size || '',
        season: editItem.season || [],
        occasion: editItem.occasion || [],
        imageUrl: editItem.imageUrl || SAMPLE_IMAGES[0],
        tags: editItem.tags || [],
        notes: editItem.notes || '',
        price: editItem.price || undefined,
        purchaseDate: editItem.purchaseDate || undefined,
      });
    } else {
      // Reset for new item
      setFormData({
        name: '',
        category: 'tops' as ClothingCategory,
        subcategory: '',
        color: '#000000',
        brand: '',
        size: '',
        season: [],
        occasion: [],
        imageUrl: SAMPLE_IMAGES[0],
        tags: [],
        notes: '',
        price: undefined,
        purchaseDate: undefined,
      });
    }
  }, [editItem]);

  // Smooth scroll to input section
  const scrollToInput = (sectionIndex: number) => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        const scrollPosition = sectionIndex * 180; // Adjusted section height
        scrollViewRef.current.scrollTo({
          y: Math.max(0, scrollPosition - 50), // Add some padding and prevent negative scroll
          animated: true,
        });
      }
    }, 150);
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!formData.imageUrl) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      const itemData = {
        name: formData.name.trim(),
        category: formData.category!,
        subcategory: formData.subcategory || '',
        color: formData.color!,
        brand: formData.brand || '',
        size: formData.size || '',
        seasons: formData.season || [],
        occasions: formData.occasion || [],
        imageUri: formData.imageUrl,
        tags: formData.tags || [],
        notes: formData.notes || '',
        price: formData.price
          ? parseFloat(formData.price.toString())
          : undefined,
        purchaseDate: formData.purchaseDate || undefined,
      };

      let result;
      if (editItem) {
        result = await actions.updateItem({ ...itemData, id: editItem.id });
      } else {
        result = await actions.addItem(itemData);
      }

      if (result.success && result.data) {
        onAddItem(result.data);
        onClose();
        Alert.alert(
          'Success',
          `Item ${editItem ? 'updated' : 'saved'} successfully!`
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imageUrl: result.assets[0].uri });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove) || [],
    });
  };

  const toggleArrayItem = <T,>(array: T[], item: T) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        {/* Image Section with Overlay Controls */}
        <View style={styles.imageSection}>
          {formData.imageUrl ? (
            <Image
              source={{ uri: formData.imageUrl }}
              style={styles.fullImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <ImageIcon size={60} color="#9ca3af" />
              <Text style={styles.placeholderText}>No Photo Selected</Text>
            </View>
          )}

          {/* Back Button (Left Side) */}
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Photo Action Buttons (Right Side) */}
          <View style={styles.photoActionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
              <ImageIcon size={20} color={Colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
              <Camera size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content Container with rounded top corners */}
        <View style={styles.detailsContainer}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollableContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets={true}
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <Text style={styles.modalTitle}>
                {editItem ? 'Edit Item' : 'Add New Item'}
              </Text>
            </View>

            {/* Basic Information Card */}
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>Basic Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={name => setFormData({ ...formData, name })}
                  placeholder="e.g., Blue Cotton T-Shirt"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="next"
                  onFocus={() => scrollToInput(1)}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipContainer}>
                    {[
                      'tops',
                      'bottoms',
                      'dresses',
                      'outerwear',
                      'shoes',
                      'accessories',
                      'underwear',
                      'activewear',
                      'sleepwear',
                      'swimwear',
                    ].map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.chip,
                          formData.category === category && styles.selectedChip,
                        ]}
                        onPress={() =>
                          setFormData({
                            ...formData,
                            category: category as ClothingCategory,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            formData.category === category &&
                              styles.selectedChipText,
                          ]}
                        >
                          {category.replace('_', ' ')}
                        </Text>
                        {formData.category === category && (
                          <Check size={14} color="#A428FC" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Brand</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.brand}
                    onChangeText={brand => setFormData({ ...formData, brand })}
                    placeholder="e.g., Nike"
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    onFocus={() => scrollToInput(2)}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Size</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.size}
                    onChangeText={size => setFormData({ ...formData, size })}
                    placeholder="e.g., M"
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    onFocus={() => scrollToInput(2)}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Color</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.colorContainer}>
                    {COLORS.map(color => (
                      <TouchableOpacity
                        key={color}
                        style={[
                          styles.colorOption,
                          { backgroundColor: color },
                          formData.color === color && styles.selectedColor,
                        ]}
                        onPress={() => setFormData({ ...formData, color })}
                      >
                        {formData.color === color && (
                          <Check size={16} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price</Text>
                <TextInput
                  style={styles.input}
                  value={formData.price?.toString() || ''}
                  onChangeText={price =>
                    setFormData({
                      ...formData,
                      price: price ? parseFloat(price) : undefined,
                    })
                  }
                  placeholder="e.g., 29.99"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                  returnKeyType="next"
                  onFocus={() => scrollToInput(2)}
                />
              </View>
            </View>

            {/* Seasons Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Seasons</Text>
              <View style={styles.chipContainer}>
                {(['spring', 'summer', 'fall', 'winter'] as Season[]).map(
                  season => (
                    <TouchableOpacity
                      key={season}
                      style={[
                        styles.chip,
                        formData.season?.includes(season) &&
                          styles.selectedChip,
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          season: toggleArrayItem(
                            formData.season || [],
                            season
                          ),
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formData.season?.includes(season) &&
                            styles.selectedChipText,
                        ]}
                      >
                        {season}
                      </Text>
                      {formData.season?.includes(season) && (
                        <Check size={14} color="#A428FC" />
                      )}
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            {/* Occasions Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Occasions</Text>
              <View style={styles.chipContainer}>
                {(
                  [
                    'casual',
                    'work',
                    'formal',
                    'party',
                    'sport',
                    'travel',
                    'date',
                    'special',
                  ] as Occasion[]
                ).map(occasion => (
                  <TouchableOpacity
                    key={occasion}
                    style={[
                      styles.chip,
                      formData.occasion?.includes(occasion) &&
                        styles.selectedChip,
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        occasion: toggleArrayItem(
                          formData.occasion || [],
                          occasion
                        ),
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.occasion?.includes(occasion) &&
                          styles.selectedChipText,
                      ]}
                    >
                      {occasion}
                    </Text>
                    {formData.occasion?.includes(occasion) && (
                      <Check size={14} color="#A428FC" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tags Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  onFocus={() => scrollToInput(5)}
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <Plus size={20} color="#A428FC" />
                </TouchableOpacity>
              </View>
              <View style={styles.chipContainer}>
                {formData.tags?.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagChip}
                    onPress={() => removeTag(tag)}
                  >
                    <Text style={styles.tagChipText}>{tag}</Text>
                    <X size={16} color="#6b7280" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selling Information Card - DISABLED */}
            <View style={styles.sectionCard}>
              <View style={styles.toggleHeader}>
                <Text style={[styles.cardTitle, styles.disabledText]}>
                  Selling Information (Optional)
                </Text>
              </View>
            </View>

            {/* Notes Card */}
            <View style={styles.sectionCard}>
              <Text style={styles.cardTitle}>Notes</Text>
              <TextInput
                style={styles.textArea}
                value={formData.notes}
                onChangeText={notes => setFormData({ ...formData, notes })}
                placeholder="Any additional notes about this item..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                onFocus={() => scrollToInput(6)}
              />
            </View>

            {/* Save Button Container */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveButtonAction,
                  isLoading && styles.saveButtonDisabled,
                ]}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  imageSection: {
    flex: 1,
    position: 'relative',
  },
  fullImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoActionButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  sampleImages: {
    marginTop: 8,
  },
  sampleImage: {
    width: 80,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSampleImage: {
    borderColor: '#A428FC',
  },
  sampleImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  sampleCheckMark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#A428FC',
    padding: 2,
    borderRadius: 10,
  },
  infoCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: Colors.surface.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  selectedChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#A428FC',
  },
  chipText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#A428FC',
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  selectedColor: {
    borderColor: '#D1D5DB',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1f2937',
    marginRight: 8,
  },
  addTagButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A428FC',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    gap: 4,
  },
  tagChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  toggleIcon: {
    fontSize: 16,
    fontWeight: '500',
    color: '#A428FC',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#A428FC',
    borderColor: '#A428FC',
  },
  checkboxText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
  },
  sellingContent: {
    paddingTop: 0,
  },
  sellingInputGroup: {
    marginBottom: 16,
  },
  actionButtonsContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  saveButtonAction: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#A428FC',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  disabledText: {
    color: '#9ca3af',
  },
});
