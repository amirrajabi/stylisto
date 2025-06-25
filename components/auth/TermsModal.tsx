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

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ visible, onClose }) => {
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
          <H1 style={styles.title}>Terms & Conditions</H1>
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleContainer}>
          <BodyMedium color="secondary" style={styles.subtitle}>
            Please read our terms and conditions carefully
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
            <H2 style={styles.sectionTitle}>1. Acceptance of Terms</H2>
            <BodyMedium style={styles.paragraph}>
              By accessing and using Stylisto, you accept and agree to be bound
              by the terms and provision of this agreement.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>2. Use License</H2>
            <BodyMedium style={styles.paragraph}>
              Permission is granted to temporarily download one copy of Stylisto
              for personal, non-commercial transitory viewing only.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              This is the grant of a license, not a transfer of title, and under
              this license you may not:
            </BodyMedium>
            <View style={styles.bulletContainer}>
              <BodySmall style={styles.bulletPoint}>
                • Modify or copy the materials
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Use the materials for any commercial purpose
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Attempt to reverse engineer any software
              </BodySmall>
              <BodySmall style={styles.bulletPoint}>
                • Remove any copyright or proprietary notations
              </BodySmall>
            </View>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>3. Privacy and Data Protection</H2>
            <BodyMedium style={styles.paragraph}>
              Your privacy is important to us. We collect and process your
              personal data in accordance with our Privacy Policy.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              By using Stylisto, you consent to the collection and use of
              information in accordance with our Privacy Policy.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>4. User Content</H2>
            <BodyMedium style={styles.paragraph}>
              You retain ownership of any content you upload to Stylisto,
              including photos of clothing items and personal information.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              By uploading content, you grant us a non-exclusive license to use,
              store, and process your content to provide our services.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>
              5. AI Features and Recommendations
            </H2>
            <BodyMedium style={styles.paragraph}>
              Stylisto uses artificial intelligence to analyze your wardrobe and
              provide outfit recommendations.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              While we strive for accuracy, AI recommendations are suggestions
              only and should not be considered professional fashion advice.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>6. Subscription and Payments</H2>
            <BodyMedium style={styles.paragraph}>
              Some features of Stylisto may require a subscription. Subscription
              fees are charged in advance on a recurring basis.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              You may cancel your subscription at any time through your account
              settings or the app store.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>7. Disclaimer</H2>
            <BodyMedium style={styles.paragraph}>
              The materials on Stylisto are provided on an &apos;as is&apos;
              basis. Stylisto makes no warranties, expressed or implied.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              In no event shall Stylisto be liable for any damages arising out
              of the use or inability to use the materials on Stylisto.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>8. Accuracy of Materials</H2>
            <BodyMedium style={styles.paragraph}>
              The materials appearing on Stylisto could include technical,
              typographical, or photographic errors.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              Stylisto does not warrant that any of the materials on its app are
              accurate, complete, or current.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>9. Modifications</H2>
            <BodyMedium style={styles.paragraph}>
              Stylisto may revise these terms of service at any time without
              notice.
            </BodyMedium>
            <BodyMedium style={styles.paragraph}>
              By using this app, you are agreeing to be bound by the then
              current version of these terms of service.
            </BodyMedium>
          </View>

          <View style={styles.section}>
            <H2 style={styles.sectionTitle}>10. Contact Information</H2>
            <BodyMedium style={styles.paragraph}>
              If you have any questions about these Terms and Conditions, please
              contact us at:
            </BodyMedium>
            <View style={styles.contactCard}>
              <BodyMedium style={styles.contactInfo}>
                Email: support@stylisto.app{'\n'}
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
