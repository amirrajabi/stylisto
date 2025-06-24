import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ThumbsUp, ThumbsDown, Send } from 'lucide-react-native';
import { Colors } from '../../constants/Colors';
import { Typography } from '../../constants/Typography';
import { Spacing, Layout } from '../../constants/Spacing';
import { supabase } from '../../lib/supabase';

interface AIFeedbackFormProps {
  userId: string;
  itemId: string;
  feedbackType: 'item_categorization' | 'outfit_suggestion' | 'style_recommendation';
  originalData: any;
  correctedData: any;
  onFeedbackSubmitted: () => void;
}

export const AIFeedbackForm: React.FC<AIFeedbackFormProps> = ({
  userId,
  itemId,
  feedbackType,
  originalData,
  correctedData,
  onFeedbackSubmitted,
}) => {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [rating, setRating] = useState<number>(3);
  const [loading, setLoading] = useState(false);
  
  // Handle feedback submission
  const handleSubmit = async () => {
    if (isHelpful === null) return;
    
    setLoading(true);
    
    try {
      // Create feedback record in database
      const { error } = await supabase.from('ai_feedback').insert({
        user_id: userId,
        feedback_type: feedbackType,
        context_data: {
          item_id: itemId,
          ...originalData,
        },
        ai_response: {
          ...correctedData,
        },
        is_helpful: isHelpful,
        user_feedback: feedbackText,
        user_rating: rating,
      });
      
      if (error) throw error;
      
      onFeedbackSubmitted();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Render rating stars
  const renderRatingStars = () => {
    return (
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
          >
            <Text style={[
              styles.starText,
              star <= rating && styles.selectedStarText,
            ]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help Improve Our AI</Text>
      
      <Text style={styles.description}>
        Were the AI-generated tags and attributes helpful for this item?
      </Text>
      
      <View style={styles.feedbackButtons}>
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            styles.helpfulButton,
            isHelpful === true && styles.selectedFeedbackButton,
          ]}
          onPress={() => setIsHelpful(true)}
        >
          <ThumbsUp 
            size={18} 
            color={isHelpful === true ? Colors.white : Colors.success[600]} 
          />
          <Text style={[
            styles.feedbackButtonText,
            styles.helpfulButtonText,
            isHelpful === true && styles.selectedFeedbackButtonText,
          ]}>
            Helpful
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.feedbackButton,
            styles.notHelpfulButton,
            isHelpful === false && styles.selectedFeedbackButton,
          ]}
          onPress={() => setIsHelpful(false)}
        >
          <ThumbsDown 
            size={18} 
            color={isHelpful === false ? Colors.white : Colors.error[600]} 
          />
          <Text style={[
            styles.feedbackButtonText,
            styles.notHelpfulButtonText,
            isHelpful === false && styles.selectedFeedbackButtonText,
          ]}>
            Not Helpful
          </Text>
        </TouchableOpacity>
      </View>
      
      {isHelpful !== null && (
        <>
          <Text style={styles.ratingLabel}>Rate the AI accuracy (1-5 stars):</Text>
          {renderRatingStars()}
          
          <Text style={styles.feedbackLabel}>Additional feedback (optional):</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedbackText}
            onChangeText={setFeedbackText}
            placeholder="What could be improved?"
            placeholderTextColor={Colors.text.tertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Send size={16} color={Colors.white} />
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </>
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
  title: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
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
  selectedFeedbackButton: {
    borderWidth: 0,
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
  selectedFeedbackButtonText: {
    color: Colors.white,
  },
  ratingLabel: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  starButton: {
    padding: Spacing.sm,
  },
  starText: {
    fontSize: 24,
    color: Colors.neutral[300],
  },
  selectedStarText: {
    color: Colors.warning[500],
  },
  feedbackLabel: {
    ...Typography.body.small,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  feedbackInput: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
    minHeight: 80,
    marginBottom: Spacing.md,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
});