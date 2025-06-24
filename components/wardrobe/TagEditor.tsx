import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Tag, Plus, X, HelpCircle } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';

interface TagEditorProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  suggestedTags?: string[];
  onRequestSuggestions?: () => void;
}

export const TagEditor: React.FC<TagEditorProps> = ({
  tags,
  onTagsChange,
  suggestedTags = [],
  onRequestSuggestions,
}) => {
  const [newTag, setNewTag] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  // Handle adding a new tag
  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      onTagsChange([...tags, newTag.trim()]);
      setNewTag('');
      setFilteredSuggestions([]);
    }
  }, [newTag, tags, onTagsChange]);
  
  // Handle removing a tag
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  }, [tags, onTagsChange]);
  
  // Handle adding a suggested tag
  const handleAddSuggestedTag = useCallback((tag: string) => {
    if (!tags.includes(tag)) {
      onTagsChange([...tags, tag]);
    }
  }, [tags, onTagsChange]);
  
  // Filter suggestions as user types
  const handleTagInputChange = useCallback((text: string) => {
    setNewTag(text);
    
    if (text.trim().length > 0) {
      const filtered = suggestedTags.filter(tag => 
        tag.toLowerCase().includes(text.toLowerCase()) && 
        !tags.includes(tag)
      );
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [suggestedTags, tags]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Tag size={18} color={Colors.text.primary} />
          <Text style={styles.title}>Tags</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.helpButton}
          onPress={() => {
            // Show help info
            Alert.alert(
              'About Tags',
              'Tags help you find and organize your clothing items. Add descriptive words like "cotton", "casual", "work", etc.'
            );
          }}
        >
          <HelpCircle size={16} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
      {/* Current Tags */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagsScrollContainer}
      >
        {tags.length > 0 ? (
          tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                style={styles.removeTagButton}
                onPress={() => handleRemoveTag(tag)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={14} color={Colors.text.secondary} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noTagsText}>No tags added yet</Text>
        )}
      </ScrollView>
      
      {/* Add New Tag */}
      <View style={styles.addTagContainer}>
        <TextInput
          style={styles.tagInput}
          value={newTag}
          onChangeText={handleTagInputChange}
          placeholder="Add a tag..."
          placeholderTextColor={Colors.text.tertiary}
          returnKeyType="done"
          onSubmitEditing={handleAddTag}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[
            styles.addTagButton,
            !newTag.trim() && styles.disabledButton,
          ]}
          onPress={handleAddTag}
          disabled={!newTag.trim()}
        >
          <Plus size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
      
      {/* Tag Suggestions */}
      {(filteredSuggestions.length > 0 || suggestedTags.length > 0) && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>
            {filteredSuggestions.length > 0 ? 'Matching Tags' : 'Suggested Tags'}
          </Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsScrollContainer}
          >
            {(filteredSuggestions.length > 0 ? filteredSuggestions : suggestedTags)
              .filter(tag => !tags.includes(tag))
              .slice(0, 10)
              .map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={styles.suggestionTag}
                  onPress={() => handleAddSuggestedTag(tag)}
                >
                  <Text style={styles.suggestionTagText}>{tag}</Text>
                  <Plus size={12} color={Colors.primary[700]} />
                </TouchableOpacity>
              ))}
              
            {onRequestSuggestions && (
              <TouchableOpacity
                style={styles.moreSuggestionsButton}
                onPress={onRequestSuggestions}
              >
                <Text style={styles.moreSuggestionsText}>More...</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

// Import Alert
import { Alert } from 'react-native';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
  },
  helpButton: {
    padding: Spacing.xs,
  },
  tagsScrollContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
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
  noTagsText: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
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
  disabledButton: {
    backgroundColor: Colors.neutral[400],
  },
  suggestionsContainer: {
    marginTop: Spacing.md,
  },
  suggestionsTitle: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  suggestionsScrollContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  suggestionTag: {
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
  suggestionTagText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
  },
  moreSuggestionsButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Layout.borderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderStyle: 'dashed',
  },
  moreSuggestionsText: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
});