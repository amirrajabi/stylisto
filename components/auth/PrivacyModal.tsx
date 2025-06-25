import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Modal as RNModal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Layout, Spacing } from '../../constants/Spacing';
import { BodyMedium, BodySmall, Button, H1, H2 } from '../ui';

interface PrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({
  visible,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!isVisible) {
    return null;
  }

  return (
    <RNModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Button
            title=""
            onPress={onClose}
            style={styles.backButton}
            leftIcon={<ArrowLeft size={20} color={Colors.primary[600]} />}
          />
          <H1 style={styles.title}>Privacy Policy</H1>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <BodyMedium color="secondary" style={styles.subtitle}>
            Your privacy is important to us. Learn how we collect, use, and
            protect your data
          </BodyMedium>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>1. Information We Collect</H2>
            <BodyMedium style={styles.paragraph}>
              When you use Stylisto, we collect certain information to provide
              you with personalized fashion recommendations and improve your
              experience.
            </BodyMedium>
            <View style={styles.bulletContainer}>
              <BodySmall style={styles.bulletPoint}>
                • Account information (email, username, profile details)
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Wardrobe photos and clothing item details
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Usage data and app interactions
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Device information and analytics data
              </BodySmall>
            </View>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>2. How We Use Your Information</H2>
            <BodyMedium style={styles.paragraph}>
              We use your information to provide and improve our AI-powered
              fashion recommendation services.
            </BodyMedium>
            <View style={styles.bulletContainer}>
              <BodySmall style={styles.bulletPoint}>
                • Generate personalized outfit recommendations
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Analyze your wardrobe and style preferences
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Improve our AI algorithms and services
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Send you relevant notifications and updates
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Provide customer support and technical assistance
              </BodySmall>
            </View>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>3. Data Storage and Security</H2>
            <BodyMedium style={styles.paragraph}>
              Your data is stored securely using industry-standard encryption
              and security measures. We use Supabase for secure cloud storage
              and database management.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              All photos and personal data are encrypted both in transit and at
              rest. We implement regular security audits and follow best
              practices for data protection.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>4. AI and Machine Learning</H2>
            <BodyMedium style={styles.paragraph}>
              Stylisto uses artificial intelligence to analyze your clothing
              items and provide personalized recommendations.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              Your wardrobe photos are processed locally on your device when
              possible, and when cloud processing is needed, data is encrypted
              and processed securely without human review.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>
              5. Data Sharing and Third Parties
            </H2>
            <BodyMedium style={styles.paragraph}>
              We do not sell your personal data to third parties. We may share
              limited data with trusted service providers who help us operate
              our app.
            </BodyMedium>
            <View style={styles.bulletContainer}>
              <BodySmall style={styles.bulletPoint}>
                • Cloud storage providers (Supabase)
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Analytics services for app improvement
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Payment processors for subscription handling
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • AI services for image analysis (when needed)
              </BodySmall>
            </View>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>6. Your Rights and Choices</H2>
            <BodyMedium style={styles.paragraph}>
              You have control over your personal data and can exercise the
              following rights:
            </BodyMedium>
            <View style={styles.bulletContainer}>
              <BodySmall style={styles.bulletPoint}>
                • Access and download your data
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Correct or update your information
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Delete your account and all associated data
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Opt-out of non-essential data collection
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Control notification preferences
              </BodySmall>
            </View>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>7. Data Retention</H2>
            <BodyMedium style={styles.paragraph}>
              We retain your data only as long as necessary to provide our
              services or as required by law.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              When you delete your account, we will permanently remove your
              personal data within 30 days, except where we are legally required
              to retain certain information.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>8. Children&apos;s Privacy</H2>
            <BodyMedium style={styles.paragraph}>
              Stylisto is not intended for children under 13 years of age. We do
              not knowingly collect personal information from children under 13.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              If we become aware that we have collected personal information
              from a child under 13, we will take steps to remove that
              information from our servers.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>9. International Data Transfers</H2>
            <BodyMedium style={styles.paragraph}>
              Your data may be processed and stored in countries other than your
              own. We ensure appropriate safeguards are in place to protect your
              data according to applicable privacy laws.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>10. Changes to This Policy</H2>
            <BodyMedium style={styles.paragraph}>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the new policy in
              the app and sending you a notification.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              Your continued use of Stylisto after any changes indicates your
              acceptance of the updated Privacy Policy.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>11. Contact Us</H2>
            <BodyMedium style={styles.paragraph}>
              If you have any questions about this Privacy Policy or how we
              handle your data, please contact us:
            </BodyMedium>
            <View style={styles.contactCard}>
              <BodyMedium style={styles.contactInfo}>
                Email: privacy@stylisto.app{'\n'}
                Support: support@stylisto.app{'\n'}
                Website: www.stylisto.app
              </BodyMedium>
            </View>
          </View>

          <View style={styles.lastUpdated}>
            <BodySmall color="secondary">Last updated: June 2025</BodySmall>
          </View>

          {/* Extra padding for better scroll experience */}
          <View style={styles.extraPadding} />
        </ScrollView>

        {/* Footer with button */}
        <View style={styles.footer}>
          <Button
            title="I Understand"
            onPress={onClose}
            style={styles.acceptButton}
          />
        </View>
      </SafeAreaView>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface.primary,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: Spacing.lg,
    top: Spacing.sm,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: Spacing.xs,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitleContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface.secondary,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
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
    marginBottom: Spacing.lg,
    color: Colors.primary[700],
    fontWeight: '700',
  },
  paragraph: {
    marginBottom: Spacing.md,
    lineHeight: 24,
    color: Colors.text.primary,
  },
  bulletContainer: {
    marginLeft: Spacing.lg,
    marginTop: Spacing.md,
    paddingLeft: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary[200],
  },
  bulletPoint: {
    marginBottom: Spacing.sm,
    lineHeight: 22,
    color: Colors.text.secondary,
  },
  contactCard: {
    backgroundColor: Colors.surface.secondary,
    padding: Spacing.lg,
    borderRadius: Layout.borderRadius.lg,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary[500],
  },
  contactInfo: {
    fontFamily: 'monospace',
    lineHeight: 22,
    color: Colors.text.primary,
  },
  lastUpdated: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing['2xl'],
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  extraPadding: {
    height: Spacing['4xl'],
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.surface.primary,
  },
  acceptButton: {
    width: '100%',
    height: 52,
    borderRadius: Layout.borderRadius.lg,
  },
});
