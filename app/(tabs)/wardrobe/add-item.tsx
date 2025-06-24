import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  Save,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { useImageProcessing } from '../../../utils/imageProcessing';

interface ClothingItemForm {
  name: string;
  category: string;
  subcategory: string;
  color: string;
  brand: string;
  size: string;
  seasons: string[];
  occasions: string[];
  images: string[];
  tags: string[];
  notes: string;
  price: string;
}

const CATEGORIES = [
  'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 
  'accessories', 'underwear', 'activewear', 'sleepwear', 'swimwear'
];

const SEASONS = ['spring', 'summer', 'fall', 'winter'];

const OCCASIONS = [
  'casual', 'work', 'formal', 'party', 'sport', 'travel', 'date', 'special'
];

const COLORS = [
  '#000000', '#FFFFFF', '#808080', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
  '#A52A2A', '#000080', '#008000', '#800000'
];

export default function AddItemScreen() {
  const params = useLocalSearchParams<{ 
    editItemId?: string;
    photoUri?: string;
  }>();

  const [formData, setFormData] = useState<ClothingItemForm>({
    name: '',
    category: 'tops',
    subcategory: '',
    color: '#000000',
    brand: '',
    size: '',
    seasons: [],
    occasions: [],
    images: params.photoUri ? [params.photoUri] : [],
    tags: [],
    notes: '',
    price: '',
  });

  const [newTag, setNewTag] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const { optimizeForClothing, validateImage } = useImageProcessing();

  const handleClose = useCallback(() => {
    router.back();
  }, []);

  const handleAddPhoto = useCallback(() => {
    router.push({
      pathname: '/camera',
      params: {
        mode: 'gallery',
        maxPhotos: '5',
        returnTo: '/wardrobe/add-item',
      },
    });
  }, []);

  const handleTakePhoto = useCallback(() => {
    router.push({
      pathname: '/camera',
      params: {
        mode: 'camera',
        maxPhotos: '5',
        returnTo: '/wardrobe/add-item',
      },
    });
  }, []);

  const handleRemoveImage = useCallback((indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove),
    }));
  }, []);

  const handleToggleArrayItem = useCallback((array: string[], item: string, field: keyof ClothingItemForm) => {
    const newArray = array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  }, []);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag('');
    }
  }, [newTag, formData.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Please enter an item name');
      return;
    }

    if (formData.images.length === 0) {
      Alert.alert('Validation Error', 'Please add at least one photo');
      return;
    }

    setIsProcessing(true);

    try {
      // Validate and optimize images
      const processedImages = [];
      
      for (const imageUri of formData.images) {
        const validation = await validateImage(imageUri);
        if (!validation.isValid) {
          Alert.alert('Image Error', validation.error || 'Invalid image');
          setIsProcessing(false);
          return;
        }

        const optimizedImage = await optimizeForClothing(imageUri, 0.8);
        processedImages.push(optimizedImage.uri);
      }

      // Create clothing item object
      const clothingItem = {
        id: params.editItemId || `item-${Date.now()}`,
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory.trim(),
        color: formData.color,
        brand: formData.brand.trim(),
        size: formData.size.trim(),
        seasons: formData.seasons,
        occasions: formData.occasions,
        images: processedImages,
        tags: formData.tags,
        notes: formData.notes.trim(),
        price: formData.price ? parseFloat(formData.price) : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // TODO: Save to database/store
      console.log('Saving clothing item:', clothingItem);

      // Show success message
      if (Platform.OS === 'web') {
        alert('Item saved successfully!');
      } else {
        Alert.alert('Success', 'Item saved successfully!');
      }

      // Navigate back
      router.back();

    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Error', 'Failed to save item. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [formData, params.editItemId, optimizeForClothing, validateImage]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
          <X size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {params.editItemId ? 'Edit Item' : 'Add New Item'}
        </Text>
        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={handleSave}
          disabled={isProcessing}
        >
          <Save size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            <View style={styles.photosContainer}>
              {formData.images.map((imageUri, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.photo}
                    contentFit="cover"
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
              
              {formData.images.length < 5 && (
                <View style={styles.addPhotoButtons}>
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto}>
                    <Camera size={24} color="#6B7280" />
                    <Text style={styles.addPhotoText}>Camera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto}>
                    <ImageIcon size={24} color="#6B7280" />
                    <Text style={styles.addPhotoText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={name => setFormData(prev => ({ ...prev, name }))}
              placeholder="e.g., Blue Cotton T-Shirt"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipContainer}>
                {CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      formData.category === category && styles.selectedChip,
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, category }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        formData.category === category && styles.selectedChipText,
                      ]}
                    >
                      {category.replace('_', ' ')}
                    </Text>
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
                onChangeText={brand => setFormData(prev => ({ ...prev, brand }))}
                placeholder="e.g., Nike"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Size</Text>
              <TextInput
                style={styles.input}
                value={formData.size}
                onChangeText={size => setFormData(prev => ({ ...prev, size }))}
                placeholder="e.g., M"
                placeholderTextColor="#9CA3AF"
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
                    onPress={() => setFormData(prev => ({ ...prev, color }))}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={price => setFormData(prev => ({ ...prev, price }))}
              placeholder="e.g., 29.99"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Seasons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seasons</Text>
          <View style={styles.chipContainer}>
            {SEASONS.map(season => (
              <TouchableOpacity
                key={season}
                style={[
                  styles.chip,
                  formData.seasons.includes(season) && styles.selectedChip,
                ]}
                onPress={() => handleToggleArrayItem(formData.seasons, season, 'seasons')}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.seasons.includes(season) && styles.selectedChipText,
                  ]}
                >
                  {season}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Occasions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Occasions</Text>
          <View style={styles.chipContainer}>
            {OCCASIONS.map(occasion => (
              <TouchableOpacity
                key={occasion}
                style={[
                  styles.chip,
                  formData.occasions.includes(occasion) && styles.selectedChip,
                ]}
                onPress={() => handleToggleArrayItem(formData.occasions, occasion, 'occasions')}
              >
                <Text
                  style={[
                    styles.chipText,
                    formData.occasions.includes(occasion) && styles.selectedChipText,
                  ]}
                >
                  {occasion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag"
              placeholderTextColor="#9CA3AF"
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Plus size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.chipContainer}>
            {formData.tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={styles.tagChip}
                onPress={() => handleRemoveTag(tag)}
              >
                <Text style={styles.tagChipText}>{tag}</Text>
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.textArea}
            value={formData.notes}
            onChangeText={notes => setFormData(prev => ({ ...prev, notes }))}
            placeholder="Any additional notes about this item..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  photosScroll: {
    marginBottom: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButtons: {
    gap: 12,
  },
  addPhotoButton: {
    width: 120,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addPhotoText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  row: {
    flexDirection: 'row',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  selectedChip: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  selectedChipText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  colorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#3B82F6',
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  addTagButton: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  tagChipText: {
    fontSize: 14,
    color: '#6B7280',
  },
});