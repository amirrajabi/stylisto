import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ArrowLeft, Save, Tag, Plus, X, Palette, Calendar, Briefcase, ThumbsUp, ThumbsDown, Sparkles, CircleHelp as HelpCircle } from 'lucide-react-native';
import { useWardrobe } from '../hooks/useWardrobe';
import { useClothingAnalysis } from '../hooks/useClothingAnalysis';
import { ClothingCategory, Season, Occasion } from '../types/wardrobe';
import { Colors } from '../constants/Colors';
import { Typography } from '../constants/Typography';
import { Spacing, Layout } from '../constants/Spacing';
import { supabase } from '../lib/supabase';

export default function ItemTagEditorScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const { items, actions } = useWardrobe();
  const { analyzeImage, loading: analysisLoading } = useClothingAnalysis();
  
  const [item, setItem] = useState(items.find(i => i.id === itemId));
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [color, setColor] = useState('');
  const [category, setCategory] = useState<ClothingCategory>(ClothingCategory.TOPS);
  const [subcategory, setSubcategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [feedbackSent, setFeedbackSent] = useState(false);
  
  // Initialize state from item
  useEffect(() => {
    if (item) {
      setTags(item.tags || []);
      setSeasons(item.season || []);
      setOccasions(item.occasion || []);
      setColor(item.color || '');
      setCategory(item.category || ClothingCategory.TOPS);
      setSubcategory(item.subcategory || '');
      
      // Generate suggested tags based on existing tags
      generateSuggestedTags(item.tags || []);
    }
  }, [item]);
  
  // Generate suggested tags based on existing tags and item properties
  const generateSuggestedTags = (currentTags: string[]) => {
    // Common tags for different categories
    const categoryTags: Record<ClothingCategory, string[]> = {
      [ClothingCategory.TOPS]: ['cotton', 'casual', 'short-sleeve', 'long-sleeve', 'button-up', 'v-neck', 'crew-neck'],
      [ClothingCategory.BOTTOMS]: ['denim', 'slim-fit', 'relaxed', 'stretch', 'high-waisted', 'chino'],
      [ClothingCategory.DRESSES]: ['maxi', 'midi', 'mini', 'floral', 'wrap', 'sleeveless', 'a-line'],
      [ClothingCategory.OUTERWEAR]: ['waterproof', 'insulated', 'lightweight', 'hooded', 'zip-up', 'wool'],
      [ClothingCategory.SHOES]: ['leather', 'canvas', 'rubber-sole', 'slip-on', 'lace-up', 'athletic'],
      [ClothingCategory.ACCESSORIES]: ['metal', 'leather', 'adjustable', 'statement', 'minimal', 'classic'],
      [ClothingCategory.UNDERWEAR]: ['cotton', 'seamless', 'breathable', 'comfortable', 'elastic'],
      [ClothingCategory.ACTIVEWEAR]: ['moisture-wicking', 'stretchy', 'breathable', 'compression', 'lightweight'],
      [ClothingCategory.SLEEPWEAR]: ['soft', 'comfortable', 'loose', 'warm', 'lightweight', 'flannel'],
      [ClothingCategory.SWIMWEAR]: ['quick-dry', 'lined', 'adjustable', 'uv-protection', 'chlorine-resistant'],
    };
    
    // Season-related tags
    const seasonTags: Record<Season, string[]> = {
      [Season.SPRING]: ['lightweight', 'breathable', 'pastel', 'floral', 'rain-resistant'],
      [Season.SUMMER]: ['lightweight', 'breathable', 'sleeveless', 'bright', 'sun-protection'],
      [Season.FALL]: ['layering', 'mid-weight', 'warm', 'earth-tones', 'transitional'],
      [Season.WINTER]: ['warm', 'insulated', 'heavyweight', 'thermal', 'waterproof'],
    };
    
    // Occasion-related tags
    const occasionTags: Record<Occasion, string[]> = {
      [Occasion.CASUAL]: ['comfortable', 'everyday', 'relaxed', 'versatile', 'easy-care'],
      [Occasion.WORK]: ['professional', 'business', 'office', 'polished', 'structured'],
      [Occasion.FORMAL]: ['elegant', 'dressy', 'sophisticated', 'tailored', 'luxurious'],
      [Occasion.PARTY]: ['statement', 'festive', 'glamorous', 'eye-catching', 'special'],
      [Occasion.SPORT]: ['performance', 'athletic', 'moisture-wicking', 'flexible', 'durable'],
      [Occasion.TRAVEL]: ['wrinkle-resistant', 'packable', 'versatile', 'comfortable', 'lightweight'],
      [Occasion.DATE]: ['flattering', 'stylish', 'attractive', 'confidence-boosting', 'special'],
      [Occasion.SPECIAL]: ['memorable', 'unique', 'statement', 'occasion-specific', 'standout'],
    };
    
    // Color-related tags
    const colorTags: Record<string, string[]> = {
      'black': ['classic', 'versatile', 'slimming', 'elegant', 'timeless'],
      'white': ['clean', 'fresh', 'crisp', 'bright', 'classic'],
      'blue': ['cool', 'calming', 'versatile', 'denim', 'navy'],
      'red': ['bold', 'statement', 'eye-catching', 'warm', 'energetic'],
      'green': ['fresh', 'natural', 'earthy', 'calming', 'vibrant'],
      'yellow': ['bright', 'cheerful', 'statement', 'sunny', 'attention-grabbing'],
      'purple': ['regal', 'creative', 'unique', 'rich', 'sophisticated'],
      'pink': ['feminine', 'soft', 'playful', 'romantic', 'youthful'],
      'brown': ['earthy', 'neutral', 'warm', 'natural', 'versatile'],
      'gray': ['neutral', 'versatile', 'sophisticated', 'modern', 'timeless'],
    };
    
    // Collect potential tags
    let potentialTags: string[] = [];
    
    // Add category-specific tags
    if (item?.category) {
      potentialTags = [...potentialTags, ...categoryTags[item.category]];
    }
    
    // Add season-specific tags
    if (item?.season) {
      item.season.forEach(season => {
        potentialTags = [...potentialTags, ...seasonTags[season]];
      });
    }
    
    // Add occasion-specific tags
    if (item?.occasion) {
      item.occasion.forEach(occasion => {
        potentialTags = [...potentialTags, ...occasionTags[occasion]];
      });
    }
    
    // Add color-specific tags
    if (item?.color) {
      const colorKey = Object.keys(colorTags).find(key => 
        item.color.toLowerCase().includes(key)
      );
      if (colorKey) {
        potentialTags = [...potentialTags, ...colorTags[colorKey]];
      }
    }
    
    // Filter out tags that are already applied
    const filteredTags = potentialTags.filter(tag => !currentTags.includes(tag));
    
    // Remove duplicates and limit to 10 suggestions
    const uniqueTags = Array.from(new Set(filteredTags)).slice(0, 10);
    
    setSuggestedTags(uniqueTags);
  };
  
  // Handle adding a new tag
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()];
      setTags(updatedTags);
      setNewTag('');
      
      // Update suggested tags
      generateSuggestedTags(updatedTags);
    }
  }, [newTag, tags]);
  
  // Handle removing a tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove);
    setTags(updatedTags);
    
    // Update suggested tags
    generateSuggestedTags(updatedTags);
  }, [tags]);
  
  // Handle adding a suggested tag
  const handleAddSuggestedTag = useCallback((tag: string) => {
    if (!tags.includes(tag)) {
      const updatedTags = [...tags, tag];
      setTags(updatedTags);
      
      // Update suggested tags
      generateSuggestedTags(updatedTags);
    }
  }, [tags]);
  
  // Toggle season selection
  const toggleSeason = useCallback((season: Season) => {
    setSeasons(prev => 
      prev.includes(season) 
        ? prev.filter(s => s !== season) 
        : [...prev, season]
    );
  }, []);
  
  // Toggle occasion selection
  const toggleOccasion = useCallback((occasion: Occasion) => {
    setOccasions(prev => 
      prev.includes(occasion) 
        ? prev.filter(o => o !== occasion) 
        : [...prev, occasion]
    );
  }, []);
  
  // Save changes
  const handleSave = useCallback(async () => {
    if (!item) return;
    
    setLoading(true);
    
    try {
      const updatedItem = {
        ...item,
        tags,
        season: seasons,
        occasion: occasions,
        color,
        category,
        subcategory,
      };
      
      actions.updateItem(updatedItem);
      
      Alert.alert(
        'Changes Saved',
        'Your changes have been saved successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [item, tags, seasons, occasions, color, category, subcategory, actions]);
  
  // Re-analyze with AI
  const handleReanalyze = useCallback(async () => {
    if (!item) return;
    
    try {
      const result = await analyzeImage(item.imageUrl);
      
      // Update state with AI results
      setTags(result.tags);
      setSeasons(result.seasons);
      setOccasions(result.occasions);
      setColor(result.color);
      setCategory(result.category);
      setSubcategory(result.subcategory);
      
      // Update suggested tags
      generateSuggestedTags(result.tags);
      
      Alert.alert(
        'AI Analysis Complete',
        'The item has been re-analyzed. You can now review and edit the results.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error analyzing image:', error);
      Alert.alert('Analysis Error', 'Failed to analyze the image. Please try again.');
    }
  }, [item, analyzeImage]);
  
  // Submit feedback to improve AI
  const handleSubmitFeedback = useCallback(async (isHelpful: boolean) => {
    if (!item) return;
    
    try {
      // Create feedback record in database
      const { error } = await supabase.from('ai_feedback').insert({
        user_id: item.user_id,
        feedback_type: 'item_categorization',
        context_data: {
          item_id: item.id,
          original_tags: item.tags,
          original_category: item.category,
          original_color: item.color,
          original_seasons: item.season,
          original_occasions: item.occasion,
        },
        ai_response: {
          corrected_tags: tags,
          corrected_category: category,
          corrected_color: color,
          corrected_seasons: seasons,
          corrected_occasions: occasions,
        },
        is_helpful: isHelpful,
        user_feedback: isHelpful 
          ? 'AI suggestions were helpful with minor corrections'
          : 'AI suggestions required significant corrections',
      });
      
      if (error) throw error;
      
      setFeedbackSent(true);
      
      Alert.alert(
        'Feedback Submitted',
        'Thank you for your feedback! This helps improve our AI recommendations.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    }
  }, [item, tags, category, color, seasons, occasions]);
  
  if (!item) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Item not found</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color={Colors.white} />
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Tags & Attributes</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Save size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Item Preview */}
          <View style={styles.itemPreview}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.itemImage}
              contentFit="cover"
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
            </View>
          </View>
          
          {/* AI Analysis Button */}
          <TouchableOpacity 
            style={styles.analyzeButton}
            onPress={handleReanalyze}
            disabled={analysisLoading}
          >
            {analysisLoading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Sparkles size={18} color={Colors.white} />
                <Text style={styles.analyzeButtonText}>Re-analyze with AI</Text>
              </>
            )}
          </TouchableOpacity>
          
          {/* Tags Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Tag size={20} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Tags</Text>
              <TouchableOpacity 
                style={styles.helpButton}
                onPress={() => Alert.alert(
                  'About Tags',
                  'Tags help categorize and find your items. Add descriptive words like "cotton", "casual", "work", etc.'
                )}
              >
                <HelpCircle size={16} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
            
            {/* Current Tags */}
            <View style={styles.tagsContainer}>
              {tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    style={styles.removeTagButton}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <X size={14} color={Colors.text.secondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            
            {/* Add New Tag */}
            <View style={styles.addTagContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Add a new tag..."
                placeholderTextColor={Colors.text.tertiary}
                returnKeyType="done"
                onSubmitEditing={handleAddTag}
              />
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={handleAddTag}
                disabled={!newTag.trim()}
              >
                <Plus size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
            
            {/* Suggested Tags */}
            {suggestedTags.length > 0 && (
              <View style={styles.suggestedTagsContainer}>
                <Text style={styles.suggestedTagsTitle}>Suggested Tags</Text>
                <View style={styles.suggestedTagsGrid}>
                  {suggestedTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={styles.suggestedTag}
                      onPress={() => handleAddSuggestedTag(tag)}
                    >
                      <Text style={styles.suggestedTagText}>{tag}</Text>
                      <Plus size={12} color={Colors.primary[700]} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
          
          {/* Category Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shirt size={20} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Category</Text>
            </View>
            
            <View style={styles.categoriesGrid}>
              {Object.values(ClothingCategory).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryOption,
                    category === cat && styles.selectedCategoryOption,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    category === cat && styles.selectedCategoryOptionText,
                  ]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subcategory (optional)</Text>
              <TextInput
                style={styles.input}
                value={subcategory}
                onChangeText={setSubcategory}
                placeholder="e.g., T-shirt, Jeans, Sneakers"
                placeholderTextColor={Colors.text.tertiary}
              />
            </View>
          </View>
          
          {/* Color Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Palette size={20} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Color</Text>
            </View>
            
            <View style={styles.colorPickerContainer}>
              <View style={styles.colorInputContainer}>
                <TextInput
                  style={styles.colorInput}
                  value={color}
                  onChangeText={setColor}
                  placeholder="e.g., Blue, #0000FF"
                  placeholderTextColor={Colors.text.tertiary}
                />
                <View style={[styles.colorPreview, { backgroundColor: color }]} />
              </View>
              
              <View style={styles.colorOptions}>
                {['#000000', '#FFFFFF', '#0000FF', '#FF0000', '#00FF00', '#FFFF00', 
                  '#FFA500', '#800080', '#FFC0CB', '#A52A2A', '#808080', '#008080'].map((colorOption) => (
                  <TouchableOpacity
                    key={colorOption}
                    style={[
                      styles.colorOption,
                      { backgroundColor: colorOption },
                      color === colorOption && styles.selectedColorOption,
                    ]}
                    onPress={() => setColor(colorOption)}
                  />
                ))}
              </View>
            </View>
          </View>
          
          {/* Seasons Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Seasons</Text>
            </View>
            
            <View style={styles.optionsGrid}>
              {Object.values(Season).map((season) => (
                <TouchableOpacity
                  key={season}
                  style={[
                    styles.optionButton,
                    { backgroundColor: getSeasonColor(season, 0.2) },
                    seasons.includes(season) && styles.selectedOptionButton,
                    seasons.includes(season) && { backgroundColor: getSeasonColor(season, 0.4) },
                  ]}
                  onPress={() => toggleSeason(season)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: getSeasonColor(season) },
                    seasons.includes(season) && styles.selectedOptionButtonText,
                  ]}>
                    {season}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* Occasions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Briefcase size={20} color={Colors.text.primary} />
              <Text style={styles.sectionTitle}>Occasions</Text>
            </View>
            
            <View style={styles.optionsGrid}>
              {Object.values(Occasion).map((occasion) => (
                <TouchableOpacity
                  key={occasion}
                  style={[
                    styles.optionButton,
                    { backgroundColor: getOccasionColor(occasion, 0.2) },
                    occasions.includes(occasion) && styles.selectedOptionButton,
                    occasions.includes(occasion) && { backgroundColor: getOccasionColor(occasion, 0.4) },
                  ]}
                  onPress={() => toggleOccasion(occasion)}
                >
                  <Text style={[
                    styles.optionButtonText,
                    { color: getOccasionColor(occasion) },
                    occasions.includes(occasion) && styles.selectedOptionButtonText,
                  ]}>
                    {occasion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* AI Feedback Section */}
          {!feedbackSent && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackTitle}>Help Improve Our AI</Text>
              <Text style={styles.feedbackDescription}>
                Were the AI-generated tags and attributes helpful for this item?
              </Text>
              
              <View style={styles.feedbackButtons}>
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.helpfulButton]}
                  onPress={() => handleSubmitFeedback(true)}
                >
                  <ThumbsUp size={18} color={Colors.success[600]} />
                  <Text style={[styles.feedbackButtonText, styles.helpfulButtonText]}>
                    Helpful
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.feedbackButton, styles.notHelpfulButton]}
                  onPress={() => handleSubmitFeedback(false)}
                >
                  <ThumbsDown size={18} color={Colors.error[600]} />
                  <Text style={[styles.feedbackButtonText, styles.notHelpfulButtonText]}>
                    Not Helpful
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Spacer for keyboard */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Helper functions
const getSeasonColor = (season: Season, opacity: number = 1) => {
  const colors: Record<Season, string> = {
    [Season.SPRING]: `rgba(74, 222, 128, ${opacity})`,
    [Season.SUMMER]: `rgba(251, 191, 36, ${opacity})`,
    [Season.FALL]: `rgba(249, 115, 22, ${opacity})`,
    [Season.WINTER]: `rgba(96, 165, 250, ${opacity})`,
  };
  return colors[season] || `rgba(156, 163, 175, ${opacity})`;
};

const getOccasionColor = (occasion: Occasion, opacity: number = 1) => {
  const colors: Record<Occasion, string> = {
    [Occasion.CASUAL]: `rgba(107, 114, 128, ${opacity})`,
    [Occasion.WORK]: `rgba(31, 41, 55, ${opacity})`,
    [Occasion.FORMAL]: `rgba(0, 0, 0, ${opacity})`,
    [Occasion.PARTY]: `rgba(236, 72, 153, ${opacity})`,
    [Occasion.SPORT]: `rgba(16, 185, 129, ${opacity})`,
    [Occasion.TRAVEL]: `rgba(59, 130, 246, ${opacity})`,
    [Occasion.DATE]: `rgba(239, 68, 68, ${opacity})`,
    [Occasion.SPECIAL]: `rgba(139, 92, 246, ${opacity})`,
  };
  return colors[occasion] || `rgba(156, 163, 175, ${opacity})`;
};

// Import Shirt component
import { Shirt } from 'lucide-react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[700],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.xs,
  },
  saveButtonText: {
    ...Typography.button.small,
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  itemPreview: {
    flexDirection: 'row',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  itemImage: {
    width: 100,
    height: 120,
  },
  itemInfo: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  itemCategory: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary[500],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  analyzeButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  helpButton: {
    marginLeft: 'auto',
    padding: Spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
  },
  tagText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
  },
  removeTagButton: {
    padding: 2,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagInput: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  addTagButton: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestedTagsContainer: {
    marginTop: Spacing.md,
  },
  suggestedTagsTitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  suggestedTagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  suggestedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary[100],
  },
  suggestedTagText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  categoryOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    minWidth: '30%',
  },
  selectedCategoryOption: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[700],
  },
  categoryOptionText: {
    ...Typography.caption.medium,
    color: Colors.text.primary,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  selectedCategoryOptionText: {
    color: Colors.primary[700],
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  colorPickerContainer: {
    marginBottom: Spacing.md,
  },
  colorInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  colorInput: {
    flex: 1,
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  selectedColorOption: {
    borderWidth: 2,
    borderColor: Colors.primary[700],
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  optionButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Layout.borderRadius.md,
    minWidth: '30%',
  },
  selectedOptionButton: {
    borderWidth: 1,
  },
  optionButtonText: {
    ...Typography.caption.medium,
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  selectedOptionButtonText: {
    fontWeight: '600',
  },
  feedbackContainer: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  feedbackTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  feedbackDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
  },
  helpfulButton: {
    backgroundColor: Colors.success[50],
    borderColor: Colors.success[200],
  },
  notHelpfulButton: {
    backgroundColor: Colors.error[50],
    borderColor: Colors.error[200],
  },
  feedbackButtonText: {
    ...Typography.button.medium,
  },
  helpfulButtonText: {
    color: Colors.success[700],
  },
  notHelpfulButtonText: {
    color: Colors.error[700],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  backButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
    marginLeft: Spacing.xs,
  },
});