import { router } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileText,
  CircleHelp as HelpCircle,
  Mail,
  MessageSquare,
} from 'lucide-react-native';
import React from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { H1 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';

export default function HelpScreen() {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@stylisto.app?subject=Help%20Request').catch(
      () => {
        Alert.alert(
          'Error',
          'Could not open email client. Please email support@stylisto.app directly.'
        );
      }
    );
  };

  const handleOpenFAQ = () => {
    // In a real app, this would open a FAQ screen or web page
    Alert.alert('FAQ', 'This would open the FAQ page in a real app.');
  };

  const handleOpenTutorial = () => {
    // In a real app, this would open a tutorial
    Alert.alert('Tutorial', 'This would open the app tutorial in a real app.');
  };

  const handleOpenCommunity = () => {
    // In a real app, this would open a community forum
    Linking.openURL('https://community.stylisto.app').catch(() => {
      Alert.alert('Error', 'Could not open the community page.');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Help & Support</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <HelpCircle size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>How Can We Help?</Text>
          </View>

          <Text style={styles.sectionDescription}>
            Get help with using Stylisto, troubleshooting issues, or providing
            feedback.
          </Text>

          <TouchableOpacity
            style={styles.supportOption}
            onPress={handleEmailSupport}
          >
            <View
              style={[
                styles.supportIconContainer,
                { backgroundColor: Colors.primary[50] },
              ]}
            >
              <Mail size={24} color={Colors.primary[700]} />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Email Support</Text>
              <Text style={styles.supportDescription}>
                Contact our support team directly for personalized assistance
              </Text>
            </View>
            <ExternalLink size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportOption}
            onPress={handleOpenFAQ}
          >
            <View
              style={[
                styles.supportIconContainer,
                { backgroundColor: Colors.info[50] },
              ]}
            >
              <FileText size={24} color={Colors.info[700]} />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>
                Frequently Asked Questions
              </Text>
              <Text style={styles.supportDescription}>
                Find answers to common questions about using Stylisto
              </Text>
            </View>
            <ArrowLeft
              size={20}
              color={Colors.text.tertiary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportOption}
            onPress={handleOpenTutorial}
          >
            <View
              style={[
                styles.supportIconContainer,
                { backgroundColor: Colors.success[50] },
              ]}
            >
              <BookOpen size={24} color={Colors.success[700]} />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>App Tutorial</Text>
              <Text style={styles.supportDescription}>
                Learn how to use all features with our step-by-step guide
              </Text>
            </View>
            <ArrowLeft
              size={20}
              color={Colors.text.tertiary}
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.supportOption}
            onPress={handleOpenCommunity}
          >
            <View
              style={[
                styles.supportIconContainer,
                { backgroundColor: Colors.secondary[50] },
              ]}
            >
              <MessageSquare size={24} color={Colors.secondary[700]} />
            </View>
            <View style={styles.supportContent}>
              <Text style={styles.supportTitle}>Community Forum</Text>
              <Text style={styles.supportDescription}>
                Connect with other users to share tips and get help
              </Text>
            </View>
            <ExternalLink size={20} color={Colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Common Questions</Text>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>
              How do I add items to my wardrobe?
            </Text>
            <Text style={styles.faqAnswer}>
              Go to the Wardrobe tab and tap the + button in the top right
              corner. You can take a photo or choose from your gallery.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>
              How do outfit recommendations work?
            </Text>
            <Text style={styles.faqAnswer}>
              Our AI analyzes your wardrobe items, considering factors like
              color harmony, style matching, and occasion suitability to suggest
              outfits that work well together.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>
              Can I share my outfits with friends?
            </Text>
            <Text style={styles.faqAnswer}>
              Yes! When viewing an outfit, tap the share button to send it to
              friends via your preferred messaging app.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How do I change my password?</Text>
            <Text style={styles.faqAnswer}>
              Go to Profile {'>'} Personal Information {'>'} Change Password to
              update your password.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.viewAllFaqButton}
            onPress={handleOpenFAQ}
          >
            <Text style={styles.viewAllFaqText}>View All FAQs</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Contact Information</Text>
          <Text style={styles.contactText}>Email: support@stylisto.app</Text>
          <Text style={styles.contactText}>
            Hours: Monday-Friday, 9am-5pm EST
          </Text>
          <Text style={styles.contactText}>Response Time: Within 24 hours</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  sectionDescription: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  supportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: Layout.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  supportContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  supportTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  supportDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  faqSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  faqTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  faqItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  faqQuestion: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  faqAnswer: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
  },
  viewAllFaqButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  viewAllFaqText: {
    ...Typography.body.medium,
    color: Colors.primary[700],
    fontWeight: '500',
  },
  contactSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  contactTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  contactText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
});
