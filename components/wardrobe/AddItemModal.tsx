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
import { GPT4VisionService } from '../../lib/gpt4Vision';
import {
  ClothingCategory,
  ClothingItem,
  Occasion,
  Season,
} from '../../types/wardrobe';

interface AIAnalysisResponse {
  name: string;
  category: string;
  brand: string;
  size: string;
  color: string;
  price: string;
  season: string[];
  occasion: string[];
  tags: string[];
  notes: string;
  description: string; // AI description - saved to DB but not shown in form
}

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
  const { actions, isLoading: wardrobeLoading } = useWardrobe();
  const scrollViewRef = useRef<ScrollView>(null);
  const [formData, setFormData] = useState<Partial<ClothingItem>>({});
  const [newTag, setNewTag] = useState('');
  const gpt4VisionService = GPT4VisionService.getInstance();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [aiAnalysisResult, setAiAnalysisResult] =
    useState<AIAnalysisResponse | null>(null);

  const getDefaultFormData = () => ({
    name: '',
    category: undefined,
    subcategory: '',
    color: '',
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

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setNewTag('');
    setAiAnalysisResult(null);
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: false });
    }
  };

  const handleClose = () => {
    if (!editItem) {
      resetForm();
    }
    setAiAnalysisResult(null);
    onClose();
  };

  // Initialize form data when editItem changes
  useEffect(() => {
    if (editItem) {
      // Update form data with edit item data
      setFormData({
        name: editItem.name || '',
        category: editItem.category || undefined,
        subcategory: editItem.subcategory || '',
        color: editItem.color || '',
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
      setFormData(getDefaultFormData());
    }
    setNewTag('');
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

  // Helper function to map AI analysis to form suggestions
  const mapAIAnalysisToFormSuggestions = (aiAnalysis: AIAnalysisResponse) => {
    console.log('🔍 Starting mapping process with aiAnalysis:', aiAnalysis);
    const suggestions: Partial<typeof formData> = {};

    // Map name suggestion
    if (aiAnalysis.name && aiAnalysis.name.trim() !== '') {
      suggestions.name = aiAnalysis.name.trim();
      console.log('✅ Mapped name:', suggestions.name);
    }

    // Map brand
    if (
      aiAnalysis.brand &&
      aiAnalysis.brand.trim() !== '' &&
      aiAnalysis.brand !== 'null'
    ) {
      suggestions.brand = aiAnalysis.brand.trim();
    }

    // Map size
    if (
      aiAnalysis.size &&
      aiAnalysis.size.trim() !== '' &&
      aiAnalysis.size !== 'null'
    ) {
      suggestions.size = aiAnalysis.size.trim();
    }

    // Map price
    if (
      aiAnalysis.price &&
      aiAnalysis.price.trim() !== '' &&
      aiAnalysis.price !== 'null'
    ) {
      const priceNum = parseFloat(aiAnalysis.price.replace(/[^0-9.]/g, ''));
      if (!isNaN(priceNum)) {
        suggestions.price = priceNum;
      }
    }

    // Map color - convert color name to hex if possible
    if (
      aiAnalysis.color &&
      aiAnalysis.color.trim() !== '' &&
      aiAnalysis.color !== 'null'
    ) {
      const colorMapping: Record<string, string> = {
        black: '#000000',
        white: '#ffffff',
        gray: '#808080',
        grey: '#808080',
        red: '#ff0000',
        blue: '#0000ff',
        green: '#008000',
        yellow: '#ffff00',
        orange: '#ffa500',
        purple: '#800080',
        pink: '#ffc0cb',
        brown: '#a52a2a',
        navy: '#000080',
        maroon: '#800000',
      };

      const colorKey = Object.keys(colorMapping).find(key =>
        aiAnalysis.color.toLowerCase().includes(key)
      );
      console.log('🔍 Color mapping:', { colorKey, aiColor: aiAnalysis.color });
      if (colorKey) {
        suggestions.color = colorMapping[colorKey];
        console.log('✅ Mapped color:', suggestions.color);
      } else {
        // If no predefined color mapping, use the color name as is
        suggestions.color = aiAnalysis.color.toLowerCase();
        console.log('💡 Using color as is:', suggestions.color);
      }
    }

    // Map category
    if (aiAnalysis.category) {
      console.log('🔍 Trying to map category:', aiAnalysis.category);
      const categoryMapping: Record<string, ClothingCategory> = {
        shirt: ClothingCategory.TOPS,
        't-shirt': ClothingCategory.TOPS,
        tshirt: ClothingCategory.TOPS,
        blouse: ClothingCategory.TOPS,
        sweater: ClothingCategory.TOPS,
        top: ClothingCategory.TOPS,
        dress: ClothingCategory.DRESSES,
        pants: ClothingCategory.BOTTOMS,
        jeans: ClothingCategory.BOTTOMS,
        trousers: ClothingCategory.BOTTOMS,
        skirt: ClothingCategory.BOTTOMS,
        shorts: ClothingCategory.BOTTOMS,
        jacket: ClothingCategory.OUTERWEAR,
        coat: ClothingCategory.OUTERWEAR,
        blazer: ClothingCategory.OUTERWEAR,
        cardigan: ClothingCategory.OUTERWEAR,
        shoes: ClothingCategory.SHOES,
        boots: ClothingCategory.SHOES,
        sneakers: ClothingCategory.SHOES,
        sandals: ClothingCategory.SHOES,
        bag: ClothingCategory.BAGS,
        purse: ClothingCategory.BAGS,
        backpack: ClothingCategory.BAGS,
        belt: ClothingCategory.BELTS,
        hat: ClothingCategory.HATS,
        cap: ClothingCategory.HATS,
        scarf: ClothingCategory.SCARVES,
        jewelry: ClothingCategory.JEWELRY,
        necklace: ClothingCategory.JEWELRY,
        bracelet: ClothingCategory.JEWELRY,
        earrings: ClothingCategory.JEWELRY,
        underwear: ClothingCategory.UNDERWEAR,
        bra: ClothingCategory.UNDERWEAR,
        panties: ClothingCategory.UNDERWEAR,
        briefs: ClothingCategory.UNDERWEAR,
        lingerie: ClothingCategory.UNDERWEAR,
        activewear: ClothingCategory.ACTIVEWEAR,
        sportswear: ClothingCategory.ACTIVEWEAR,
        workout: ClothingCategory.ACTIVEWEAR,
        sleepwear: ClothingCategory.SLEEPWEAR,
        pajamas: ClothingCategory.SLEEPWEAR,
        nightgown: ClothingCategory.SLEEPWEAR,
        swimwear: ClothingCategory.SWIMWEAR,
        bikini: ClothingCategory.SWIMWEAR,
        swimsuit: ClothingCategory.SWIMWEAR,
      };

      // First try exact match
      let categoryKey = categoryMapping[aiAnalysis.category.toLowerCase()];
      if (!categoryKey) {
        // Then try includes match
        const foundKey = Object.keys(categoryMapping).find(key =>
          aiAnalysis.category.toLowerCase().includes(key)
        );
        if (foundKey) {
          categoryKey = categoryMapping[foundKey];
        }
      } else {
        categoryKey = categoryMapping[aiAnalysis.category.toLowerCase()];
      }

      console.log('🔍 Category search result:', {
        categoryKey,
        aiCategory: aiAnalysis.category.toLowerCase(),
        exactMatch: !!categoryMapping[aiAnalysis.category.toLowerCase()],
      });

      if (categoryKey) {
        suggestions.category = categoryKey;
        console.log('✅ Mapped category:', suggestions.category);
      } else {
        console.log('❌ No category mapping found for:', aiAnalysis.category);
      }
    }

    // Map seasons
    if (aiAnalysis.season && Array.isArray(aiAnalysis.season)) {
      const seasonMapping: Record<string, Season> = {
        spring: Season.SPRING,
        summer: Season.SUMMER,
        fall: Season.FALL,
        autumn: Season.FALL,
        winter: Season.WINTER,
      };

      const mappedSeasons = aiAnalysis.season
        .map(s => {
          const seasonKey = Object.keys(seasonMapping).find(key =>
            s.toLowerCase().includes(key)
          );
          return seasonKey ? seasonMapping[seasonKey] : null;
        })
        .filter(Boolean) as Season[];

      if (mappedSeasons.length > 0) {
        suggestions.season = mappedSeasons;
        console.log('✅ Mapped seasons:', suggestions.season);
      } else {
        console.log('❌ No season mappings found for:', aiAnalysis.season);
      }
    }

    // Map occasions
    if (aiAnalysis.occasion && Array.isArray(aiAnalysis.occasion)) {
      const occasionMapping: Record<string, Occasion> = {
        casual: Occasion.CASUAL,
        work: Occasion.WORK,
        professional: Occasion.WORK,
        business: Occasion.WORK,
        formal: Occasion.FORMAL,
        party: Occasion.PARTY,
        sport: Occasion.SPORT,
        athletic: Occasion.SPORT,
        gym: Occasion.SPORT,
        travel: Occasion.TRAVEL,
        date: Occasion.DATE,
        romantic: Occasion.DATE,
        special: Occasion.SPECIAL,
        wedding: Occasion.SPECIAL,
        event: Occasion.SPECIAL,
        beach: Occasion.CASUAL,
        pool: Occasion.CASUAL,
        vacation: Occasion.TRAVEL,
        holiday: Occasion.TRAVEL,
      };

      const mappedOccasions = aiAnalysis.occasion
        .map(o => {
          const occasionKey = Object.keys(occasionMapping).find(key =>
            o.toLowerCase().includes(key)
          );
          return occasionKey ? occasionMapping[occasionKey] : null;
        })
        .filter(Boolean) as Occasion[];

      if (mappedOccasions.length > 0) {
        suggestions.occasion = mappedOccasions;
        console.log('✅ Mapped occasions:', suggestions.occasion);
      } else {
        console.log('❌ No occasion mappings found for:', aiAnalysis.occasion);
      }
    }

    // Map notes
    if (
      aiAnalysis.notes &&
      aiAnalysis.notes.trim() !== '' &&
      aiAnalysis.notes !== 'null'
    ) {
      suggestions.notes = aiAnalysis.notes.trim();
    }

    // Map tags
    if (aiAnalysis.tags && Array.isArray(aiAnalysis.tags)) {
      const validTags = aiAnalysis.tags
        .filter(tag => tag && tag.trim() !== '' && tag !== 'null')
        .map(tag => tag.trim())
        .slice(0, 8); // Limit to 8 AI-suggested tags

      if (validTags.length > 0) {
        suggestions.tags = validTags;
      }
    }

    console.log('🎯 Final mapping suggestions:', suggestions);
    return suggestions;
  };

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!formData.category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    if (!formData.imageUrl) {
      Alert.alert('Error', 'Please select an image');
      return;
    }

    try {
      // Since AI analysis is done on image selection, use the stored AI description
      let aiDescription = '';

      // Check if this is an edit with existing AI description
      if (editItem?.description_with_ai) {
        aiDescription = editItem.description_with_ai;
      }

      // For new items, use the AI analysis description if available
      if (!editItem && aiAnalysisResult?.description) {
        aiDescription = aiAnalysisResult.description;
      } else if (!editItem && formData.notes) {
        // Fallback to generic description if no AI description available
        aiDescription =
          'AI-analyzed clothing item with styling recommendations';
      }

      const itemData = {
        name: formData.name?.trim() || '',
        category: formData.category!,
        subcategory: formData.subcategory || '',
        color: formData.color!,
        brand: formData.brand || '',
        size: formData.size || '',
        seasons: formData.season || [],
        occasions: formData.occasion || [],
        imageUri: formData.imageUrl || '',
        tags: formData.tags || [],
        notes: formData.notes || '',
        price: formData.price
          ? parseFloat(formData.price.toString())
          : undefined,
        purchaseDate: formData.purchaseDate || undefined,
        description_with_ai: aiDescription,
      };

      let result;
      if (editItem) {
        result = await actions.updateItem({ ...itemData, id: editItem.id });
      } else {
        result = await actions.addItem(itemData);
      }

      if (result.success && result.data) {
        onAddItem(result.data);
        if (!editItem) {
          resetForm();
        }
        handleClose();

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
      await handleImageSelect(result.assets[0].uri);
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
      await handleImageSelect(result.assets[0].uri);
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

  const handleImageSelect = async (imageUri: string) => {
    console.log('📸 Image selected:', imageUri);
    console.log('📸 Image URI type:', typeof imageUri);
    console.log('📸 Image URI length:', imageUri?.length);

    setFormData(prev => {
      const updated = { ...prev, imageUrl: imageUri };
      console.log('📸 Setting formData with imageUrl:', updated.imageUrl);
      return updated;
    });

    // Start AI analysis immediately after image selection
    console.log('🤖 Starting AI analysis with imageUri:', imageUri);
    await performAIAnalysis(imageUri);
  };

  const performAIAnalysis = async (imageUri: string) => {
    setIsAnalyzing(true);
    setAnalysisProgress('Starting AI Analysis...');

    try {
      console.log('🤖 Starting AI analysis for uploaded image...');
      setAnalysisProgress('Analyzing your image...');

      const rawAiAnalysis: any =
        await gpt4VisionService.analyzeClothingImage(imageUri);
      console.log('🎯 Raw AI Analysis response:', rawAiAnalysis);

      // Parse the AI response - handle both string and object responses
      let parsedAiAnalysis: AIAnalysisResponse | null = null;

      if (rawAiAnalysis) {
        if (typeof rawAiAnalysis === 'string') {
          try {
            // Try to parse as JSON string
            parsedAiAnalysis = JSON.parse(rawAiAnalysis);
            console.log(
              '✅ Successfully parsed JSON string:',
              parsedAiAnalysis
            );
          } catch (parseError) {
            console.error('❌ Failed to parse JSON string:', parseError);
            console.log('Raw string was:', rawAiAnalysis);
            // Try to extract JSON from text response
            const jsonMatch = (rawAiAnalysis as string).match(/\{.*\}/s);
            if (jsonMatch) {
              try {
                parsedAiAnalysis = JSON.parse(jsonMatch[0]);
                console.log('✅ Extracted and parsed JSON:', parsedAiAnalysis);
              } catch (extractError) {
                console.error(
                  '❌ Failed to parse extracted JSON:',
                  extractError
                );
              }
            }
          }
        } else if (typeof rawAiAnalysis === 'object') {
          // Already parsed object, but need to check for nested JSON
          console.log('✅ Using object response:', rawAiAnalysis);

          // Enhanced JSON extraction logic to handle nested JSON in description fields
          const extractNestedJson = (text: string): any | null => {
            if (!text || typeof text !== 'string') return null;

            try {
              // Remove markdown code blocks (```json ... ```)
              let cleanText = text
                .replace(/^```json\s*/, '')
                .replace(/\s*```$/, '');

              // Try to find JSON object in the text
              const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const jsonStr = jsonMatch[0];
                // Unescape any escaped quotes
                const unescapedJsonStr = jsonStr.replace(/\\"/g, '"');
                return JSON.parse(unescapedJsonStr);
              }
            } catch (error) {
              console.error('Error extracting nested JSON:', error);
            }
            return null;
          };

          // Check if we have proper analysis data or need to extract from nested JSON
          const hasValidData =
            rawAiAnalysis.name &&
            rawAiAnalysis.name !== 'Clothing Item' &&
            rawAiAnalysis.category &&
            rawAiAnalysis.category !== 'clothing item';

          if (!hasValidData) {
            console.log(
              '🔍 Response lacks valid data, trying to extract from nested JSON...'
            );

            // Try to extract from description field first
            let nestedData = null;
            if (rawAiAnalysis.description) {
              console.log('🔍 Trying to extract from description field...');
              nestedData = extractNestedJson(rawAiAnalysis.description);
            }

            // If description doesn't work, try detailedDescription
            if (!nestedData && rawAiAnalysis.detailedDescription) {
              console.log(
                '🔍 Trying to extract from detailedDescription field...'
              );
              nestedData = extractNestedJson(rawAiAnalysis.detailedDescription);
            }

            if (nestedData) {
              console.log('✅ Successfully extracted nested JSON:', nestedData);
              // Merge the nested data with the outer response, giving priority to nested data
              parsedAiAnalysis = {
                name: nestedData.name || rawAiAnalysis.name || 'Clothing Item',
                category:
                  nestedData.category || rawAiAnalysis.category || 'tops',
                brand: nestedData.brand || rawAiAnalysis.brand || '',
                size: nestedData.size || rawAiAnalysis.size || '',
                color: nestedData.color || rawAiAnalysis.color || '',
                price: nestedData.price || rawAiAnalysis.price || '',
                season: nestedData.season || rawAiAnalysis.season || [],
                occasion: nestedData.occasion || rawAiAnalysis.occasion || [],
                tags: nestedData.tags || rawAiAnalysis.tags || [],
                notes: nestedData.notes || rawAiAnalysis.notes || '',
                description:
                  nestedData.description ||
                  rawAiAnalysis.description ||
                  'AI-analyzed clothing item',
              };
              console.log(
                '✅ Merged analysis with nested data:',
                parsedAiAnalysis
              );
            } else {
              // Use raw analysis as fallback
              parsedAiAnalysis = rawAiAnalysis as AIAnalysisResponse;
              console.log(
                '⚠️ Using raw analysis as fallback:',
                parsedAiAnalysis
              );
            }
          } else {
            // Raw analysis has valid data, use it directly
            parsedAiAnalysis = rawAiAnalysis as AIAnalysisResponse;
            console.log(
              '✅ Using raw analysis with valid data:',
              parsedAiAnalysis
            );
          }
        }

        // Final fallback if we still don't have parsed analysis
        if (!parsedAiAnalysis && rawAiAnalysis) {
          console.log('🔄 Attempting final fallback parsing...');
          const fallbackData: AIAnalysisResponse = {
            name: rawAiAnalysis.name || 'Clothing Item',
            category: rawAiAnalysis.category || 'tops',
            brand: rawAiAnalysis.brand || '',
            size: rawAiAnalysis.size || '',
            color: rawAiAnalysis.color || '',
            price: rawAiAnalysis.price || '',
            season: rawAiAnalysis.season || [],
            occasion: rawAiAnalysis.occasion || [],
            tags: rawAiAnalysis.tags || [],
            notes: rawAiAnalysis.notes || '',
            description:
              rawAiAnalysis.description || 'AI-analyzed clothing item',
          };
          parsedAiAnalysis = fallbackData;
          console.log('✅ Created final fallback analysis:', parsedAiAnalysis);
        }
      }

      if (parsedAiAnalysis) {
        setAnalysisProgress('Applying AI suggestions...');

        // Store the complete AI analysis result for database saving
        setAiAnalysisResult(parsedAiAnalysis);
        console.log('🤖 Complete AI analysis stored:', parsedAiAnalysis);
        console.log(
          '📝 AI Description for database:',
          parsedAiAnalysis.description
        );

        // Apply AI suggestions to form
        const aiSuggestions = mapAIAnalysisToFormSuggestions(parsedAiAnalysis);
        console.log('🤖 AI suggestions for form:', aiSuggestions);
        console.log(
          '📝 Current form data before applying suggestions:',
          formData
        );
        console.log('🖼️ Preserving image URL:', imageUri);

        // Apply suggestions to form data directly without complex conditions
        const updatedFormData = {
          ...formData,
          imageUrl: imageUri, // Explicitly preserve the selected image
          name: aiSuggestions.name || formData.name,
          category: aiSuggestions.category || formData.category,
          brand: aiSuggestions.brand || formData.brand,
          size: aiSuggestions.size || formData.size,
          color: aiSuggestions.color || formData.color,
          price: aiSuggestions.price || formData.price,
          season:
            aiSuggestions.season && aiSuggestions.season.length > 0
              ? aiSuggestions.season
              : formData.season,
          occasion:
            aiSuggestions.occasion && aiSuggestions.occasion.length > 0
              ? aiSuggestions.occasion
              : formData.occasion,
          notes: aiSuggestions.notes || formData.notes,
          tags: [
            ...(formData.tags || []),
            ...(aiSuggestions.tags || []),
          ].filter((tag, index, array) => array.indexOf(tag) === index),
        };

        console.log(
          '✅ Updated form data after applying AI suggestions:',
          updatedFormData
        );
        console.log(
          '✅ Final imageUrl in updated data:',
          updatedFormData.imageUrl
        );
        setFormData(updatedFormData);

        setAnalysisProgress('Analysis Complete!');

        // Show completion message briefly
        setTimeout(() => {
          setAnalysisProgress('');
        }, 2000);
      } else {
        console.error(
          '❌ No valid AI analysis could be extracted from response'
        );

        // Create a basic fallback analysis so the image can still be saved
        const fallbackAnalysis: AIAnalysisResponse = {
          name: 'Clothing Item',
          category: 'tops',
          brand: '',
          size: '',
          color: '',
          price: '',
          season: [],
          occasion: [],
          tags: [],
          notes: '',
          description:
            'Please add details manually - AI analysis was not available.',
        };

        setAiAnalysisResult(fallbackAnalysis);
        console.log(
          '🔄 Created fallback analysis for saving:',
          fallbackAnalysis
        );

        setAnalysisProgress(
          'AI analysis unavailable - please add details manually'
        );

        // Clear error message after 4 seconds
        setTimeout(() => {
          setAnalysisProgress('');
        }, 4000);
      }
    } catch (error) {
      console.error('❌ AI Analysis failed:', error);

      // Create a fallback analysis even when the entire process fails
      const emergencyFallback: AIAnalysisResponse = {
        name: 'Clothing Item',
        category: 'tops',
        brand: '',
        size: '',
        color: '',
        price: '',
        season: [],
        occasion: [],
        tags: [],
        notes: '',
        description: 'AI analysis failed - please add details manually.',
      };

      setAiAnalysisResult(emergencyFallback);
      console.log('🆘 Created emergency fallback analysis:', emergencyFallback);

      setAnalysisProgress(
        'AI analysis failed - you can still add details manually'
      );

      // Clear error message after 4 seconds
      setTimeout(() => {
        setAnalysisProgress('');
      }, 4000);
    } finally {
      setIsAnalyzing(false);
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
            <>
              {console.log('🖼️ Rendering image with URL:', formData.imageUrl)}
              <Image
                source={{ uri: formData.imageUrl }}
                style={styles.fullImage}
                resizeMode="cover"
                onLoad={() =>
                  console.log(
                    '✅ Image loaded successfully:',
                    formData.imageUrl
                  )
                }
                onError={error =>
                  console.error(
                    '❌ Image failed to load:',
                    error,
                    'URL:',
                    formData.imageUrl
                  )
                }
              />
            </>
          ) : (
            <>
              {console.log('❌ No imageUrl found in formData:', formData)}
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={60} color="#9ca3af" />
                <Text style={styles.placeholderText}>No Photo Selected</Text>
              </View>
            </>
          )}

          {/* Back Button (Left Side) */}
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.white} />
          </TouchableOpacity>

          {/* Photo Action Buttons (Right Side) */}
          <View style={styles.photoActionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isAnalyzing && styles.disabledActionButton,
              ]}
              onPress={pickImage}
              disabled={isAnalyzing}
            >
              <ImageIcon
                size={20}
                color={isAnalyzing ? '#9ca3af' : Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                isAnalyzing && styles.disabledActionButton,
              ]}
              onPress={takePhoto}
              disabled={isAnalyzing}
            >
              <Camera
                size={20}
                color={isAnalyzing ? '#9ca3af' : Colors.white}
              />
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
                  style={[styles.input, isAnalyzing && styles.disabledInput]}
                  value={formData.name}
                  onChangeText={name => setFormData({ ...formData, name })}
                  placeholder="e.g., Blue Cotton T-Shirt"
                  placeholderTextColor="#9ca3af"
                  returnKeyType="next"
                  onFocus={() => scrollToInput(1)}
                  editable={!isAnalyzing}
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
                          isAnalyzing && styles.disabledChip,
                        ]}
                        onPress={() =>
                          !isAnalyzing &&
                          setFormData({
                            ...formData,
                            category: category as ClothingCategory,
                          })
                        }
                        disabled={isAnalyzing}
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
                    style={[styles.input, isAnalyzing && styles.disabledInput]}
                    value={formData.brand}
                    onChangeText={brand => setFormData({ ...formData, brand })}
                    placeholder="e.g., Nike"
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    onFocus={() => scrollToInput(2)}
                    editable={!isAnalyzing}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Size</Text>
                  <TextInput
                    style={[styles.input, isAnalyzing && styles.disabledInput]}
                    value={formData.size}
                    onChangeText={size => setFormData({ ...formData, size })}
                    placeholder="e.g., M"
                    placeholderTextColor="#9ca3af"
                    returnKeyType="next"
                    onFocus={() => scrollToInput(2)}
                    editable={!isAnalyzing}
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
                          isAnalyzing && styles.disabledColor,
                        ]}
                        onPress={() =>
                          !isAnalyzing && setFormData({ ...formData, color })
                        }
                        disabled={isAnalyzing}
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
                  style={[styles.input, isAnalyzing && styles.disabledInput]}
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
                  editable={!isAnalyzing}
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
                        isAnalyzing && styles.disabledChip,
                      ]}
                      onPress={() =>
                        !isAnalyzing &&
                        setFormData({
                          ...formData,
                          season: toggleArrayItem(
                            formData.season || [],
                            season
                          ),
                        })
                      }
                      disabled={isAnalyzing}
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
                      isAnalyzing && styles.disabledChip,
                    ]}
                    onPress={() =>
                      !isAnalyzing &&
                      setFormData({
                        ...formData,
                        occasion: toggleArrayItem(
                          formData.occasion || [],
                          occasion
                        ),
                      })
                    }
                    disabled={isAnalyzing}
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
                  style={[styles.tagInput, isAnalyzing && styles.disabledInput]}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder="Add a tag"
                  placeholderTextColor="#9ca3af"
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  onFocus={() => scrollToInput(5)}
                  editable={!isAnalyzing}
                />
                <TouchableOpacity
                  style={[
                    styles.addTagButton,
                    isAnalyzing && styles.disabledButton,
                  ]}
                  onPress={addTag}
                  disabled={isAnalyzing}
                >
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
                style={[styles.textArea, isAnalyzing && styles.disabledInput]}
                value={formData.notes}
                onChangeText={notes => setFormData({ ...formData, notes })}
                placeholder="Any additional notes about this item..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                onFocus={() => scrollToInput(6)}
                editable={!isAnalyzing}
              />
            </View>

            {/* Save Button Container */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                onPress={handleSave}
                style={[
                  styles.saveButtonAction,
                  (wardrobeLoading || isAnalyzing) && styles.saveButtonDisabled,
                ]}
                disabled={wardrobeLoading || isAnalyzing}
              >
                <Text style={styles.saveButtonText}>
                  {isAnalyzing
                    ? analysisProgress || 'Analyzing...'
                    : wardrobeLoading
                      ? 'Saving...'
                      : editItem
                        ? 'Update Item'
                        : 'Add Item'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* AI Analysis Overlay */}
        {isAnalyzing && (
          <View style={styles.analysisOverlay}>
            <View style={styles.overlayContent}>
              <Text style={styles.overlayTitle}>AI Analysis</Text>
              <Text style={styles.overlayText}>{analysisProgress}</Text>
            </View>
          </View>
        )}
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
  disabledInput: {
    backgroundColor: '#f3f4f6',
  },
  disabledChip: {
    backgroundColor: '#f3f4f6',
  },
  disabledColor: {
    backgroundColor: '#f3f4f6',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  disabledActionButton: {
    backgroundColor: '#f3f4f6',
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  overlayContent: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  overlayText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
