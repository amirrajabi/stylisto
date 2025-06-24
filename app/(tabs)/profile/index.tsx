import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { Settings, User, Bell, Shield, HelpCircle, LogOut, ChevronRight } from 'lucide-react-native';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1, BodyMedium, BodySmall } from '../../../components/ui';

export default function ProfileScreen() {
  const MenuSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    onPress: () => void;
    showArrow?: boolean;
    destructive?: boolean;
  }> = ({ icon, title, subtitle, onPress, showArrow = true, destructive = false }) => (
    <TouchableOpacity 
      style={styles.menuItem} 
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.menuIcon, destructive && styles.destructiveIcon]}>
          {icon}
        </View>
        <View>
          <Text style={[styles.menuTitle, destructive && styles.destructiveText]}>
            {title}
          </Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <ChevronRight size={20} color={Colors.text.tertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <H1>Profile</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <User size={40} color={Colors.text.secondary} />
          </View>
          <Text style={styles.userName}>Fashion Enthusiast</Text>
          <BodyMedium color="secondary">user@stylisto.app</BodyMedium>
        </View>

        {/* Menu Sections */}
        <MenuSection title="Account">
          <MenuItem
            icon={<User size={20} color={Colors.text.secondary} />}
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => router.push('/profile/personal-info')}
          />
          <MenuItem
            icon={<Bell size={20} color={Colors.text.secondary} />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => router.push('/profile/notifications')}
          />
          <MenuItem
            icon={<Shield size={20} color={Colors.text.secondary} />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => router.push('/profile/privacy')}
          />
        </MenuSection>

        <MenuSection title="App">
          <MenuItem
            icon={<Settings size={20} color={Colors.text.secondary} />}
            title="Settings"
            subtitle="App preferences and configuration"
            onPress={() => router.push('/profile/settings')}
          />
          <MenuItem
            icon={<HelpCircle size={20} color={Colors.text.secondary} />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => router.push('/profile/help')}
          />
        </MenuSection>

        <MenuSection title="">
          <MenuItem
            icon={<LogOut size={20} color={Colors.error[500]} />}
            title="Sign Out"
            onPress={() => console.log('Sign Out')}
            showArrow={false}
            destructive
          />
        </MenuSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <BodySmall color="tertiary">Stylisto v1.0.0</BodySmall>
          <BodySmall color="tertiary" style={styles.appDescription}>
            Your personal AI-powered wardrobe assistant
          </BodySmall>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    ...Shadows.sm,
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: Colors.surface.primary,
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  userName: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.caption.large,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    minHeight: Layout.touchTarget.minimum,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.borderRadius.md,
    backgroundColor: Colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  destructiveIcon: {
    backgroundColor: Colors.error[50],
  },
  menuTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginBottom: 2,
    fontWeight: '500',
  },
  destructiveText: {
    color: Colors.error[600],
  },
  menuSubtitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
  },
  appDescription: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});