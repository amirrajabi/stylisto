import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  BarChart,
  Bell,
  Camera,
  ChevronRight,
  DollarSign,
  Download,
  Heart,
  CircleHelp as HelpCircle,
  LogOut,
  Moon,
  Settings,
  Shield,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AccessibilitySettingsCard } from '../../../components/profile/AccessibilitySettingsCard';
import { useAccessibility } from '../../../components/ui/AccessibilityProvider';
import {
  BodyMedium,
  BodySmall,
  H1,
} from '../../../components/ui/AccessibleText';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Layout, Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const { colors, theme, toggleHighContrast } = useAccessibility();
  const { trackScreenView, trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(theme === 'dark');
  const [userPreferences, setUserPreferences] = useState({
    notifications: {
      outfitReminders: true,
      weatherAlerts: true,
      styleTips: true,
      newFeatures: true,
    },
    privacy: {
      profileVisibility: 'private',
      shareOutfits: false,
      analyticsTracking: true,
    },
    appearance: {
      darkMode: theme === 'dark',
      fontSize: 'medium',
    },
  });

  // Track screen view
  useEffect(() => {
    trackScreenView('Profile');
  }, [trackScreenView]);

  // Load user preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPreferences =
          await AsyncStorage.getItem('@user_preferences');
        if (storedPreferences) {
          setUserPreferences(JSON.parse(storedPreferences));
        }

        // Load theme preference
        const themePreference = await AsyncStorage.getItem('@theme_preference');
        if (themePreference) {
          setDarkMode(themePreference === 'dark');
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Save preferences when they change
  useEffect(() => {
    const savePreferences = async () => {
      try {
        await AsyncStorage.setItem(
          '@user_preferences',
          JSON.stringify(userPreferences)
        );
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    };

    savePreferences();
  }, [userPreferences]);

  // Handle theme toggle
  const handleThemeToggle = async (value: boolean) => {
    setDarkMode(value);

    // Update preferences
    setUserPreferences(prev => ({
      ...prev,
      appearance: {
        ...prev.appearance,
        darkMode: value,
      },
    }));

    // Save theme preference
    await AsyncStorage.setItem('@theme_preference', value ? 'dark' : 'light');

    // Track event
    trackEvent('theme_changed', {
      theme: value ? 'dark' : 'light',
    });
  };

  // Handle notification toggle
  const handleNotificationToggle = (key: string, value: boolean) => {
    setUserPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));

    // Track event
    trackEvent('notification_preference_changed', {
      notification_type: key,
      enabled: value,
    });
  };

  // Handle privacy toggle
  const handlePrivacyToggle = (key: string, value: boolean | string) => {
    setUserPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value,
      },
    }));

    // Track event
    trackEvent('privacy_preference_changed', {
      privacy_setting: key,
      value: value,
    });
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);

            // Track sign out event
            trackEvent('user_signed_out');

            await signOut();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              // First export data for GDPR compliance
              await handleExportData();

              // Track account deletion event
              trackEvent('account_deleted');

              // Delete user data from Supabase
              const { error } = await supabase.rpc('delete_user_account');

              if (error) throw error;

              // Sign out after deletion
              await signOut();
              router.replace('/(auth)/login');

              Alert.alert(
                'Account Deleted',
                'Your account and all associated data have been permanently deleted.'
              );
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again.'
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle data export (GDPR compliance)
  const handleExportData = async () => {
    try {
      setLoading(true);

      // Track data export event
      trackEvent('data_export_requested');

      // Fetch user data from Supabase
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;

      // Fetch wardrobe items
      const { data: wardrobeItems, error: wardrobeError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null);

      if (wardrobeError) throw wardrobeError;

      // Fetch saved outfits
      const { data: savedOutfits, error: outfitsError } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user?.id)
        .is('deleted_at', null);

      if (outfitsError) throw outfitsError;

      // Fetch user preferences
      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116')
        throw preferencesError;

      // Compile all data
      const exportData = {
        user: userData,
        preferences: preferences || userPreferences,
        wardrobe: wardrobeItems || [],
        outfits: savedOutfits || [],
        exportDate: new Date().toISOString(),
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);

      if (Platform.OS === 'web') {
        // For web: Create a download link
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stylisto-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // For native: Save to file system or share
        // In a real app, you would use expo-file-system and expo-sharing
        Alert.alert(
          'Data Export',
          'Your data has been exported successfully. In a production app, you would be able to download or share this file.',
          [{ text: 'OK' }]
        );
      }

      Alert.alert('Data Exported', 'Your data has been exported successfully.');
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture update
  const handleUpdateProfilePicture = () => {
    Alert.alert('Update Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: () => {
          // Track camera usage
          trackEvent('camera_opened', {
            purpose: 'profile_picture',
          });

          router.push({
            pathname: '/camera',
            params: {
              mode: 'camera',
              maxPhotos: '1',
              returnTo: '/profile',
              itemType: 'profile',
            },
          });
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: () => {
          // Track gallery usage
          trackEvent('gallery_opened', {
            purpose: 'profile_picture',
          });

          router.push({
            pathname: '/camera',
            params: {
              mode: 'gallery',
              maxPhotos: '1',
              returnTo: '/profile',
              itemType: 'profile',
            },
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const MenuSection: React.FC<{
    title: string;
    children: React.ReactNode;
  }> = ({ title, children }) => (
    <View style={[styles.section, { backgroundColor: colors.surface.primary }]}>
      <Text style={[styles.sectionTitle, { color: colors.text.secondary }]}>
        {title}
      </Text>
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
    rightElement?: React.ReactNode;
  }> = ({
    icon,
    title,
    subtitle,
    onPress,
    showArrow = true,
    destructive = false,
    rightElement,
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border.primary }]}
      onPress={() => {
        // Track menu item click
        trackEvent('profile_menu_item_clicked', {
          item: title.toLowerCase().replace(/\s+/g, '_'),
        });

        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.menuIcon,
            destructive && styles.destructiveIcon,
            {
              backgroundColor: destructive
                ? colors.error[50]
                : colors.surface.secondary,
            },
          ]}
        >
          {icon}
        </View>
        <View>
          <Text
            style={[
              styles.menuTitle,
              destructive && styles.destructiveText,
              { color: destructive ? colors.error[600] : colors.text.primary },
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text
              style={[styles.menuSubtitle, { color: colors.text.secondary }]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {rightElement
        ? rightElement
        : showArrow && <ChevronRight size={20} color={colors.text.tertiary} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: colors.background.secondary },
      ]}
    >
      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            { backgroundColor: 'rgba(0, 0, 0, 0.3)' },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary[700]} />
        </View>
      )}

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface.primary,
            borderBottomColor: colors.border.primary,
          },
        ]}
      >
        <H1>Profile</H1>
      </View>

      <ScrollView
        style={[styles.content, { backgroundColor: colors.background.primary }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing['2xl'] }}
      >
        {/* User Section */}
        <View
          style={[
            styles.userSection,
            { backgroundColor: colors.surface.primary },
          ]}
        >
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleUpdateProfilePicture}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Update profile picture"
            accessibilityHint="Double tap to update your profile picture"
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.primary[100] },
                ]}
              >
                <User size={48} color={colors.primary[500]} />
              </View>
            )}

            <View
              style={[
                styles.cameraButton,
                { backgroundColor: colors.primary[500] },
              ]}
            >
              <Camera size={16} color={colors.white} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text.primary }]}>
            {user?.first_name && user?.last_name
              ? `${user.first_name} ${user.last_name}`
              : user?.first_name || user?.last_name || 'User'}
          </Text>
          <BodyMedium color="secondary">{user?.email}</BodyMedium>
        </View>

        {/* Accessibility Settings Card */}
        <AccessibilitySettingsCard />

        {/* Theme Toggle */}
        <View
          style={[
            styles.themeToggleContainer,
            { backgroundColor: colors.surface.primary },
          ]}
        >
          <View style={styles.themeToggleLeft}>
            <Moon size={20} color={colors.text.primary} />
            <Text
              style={[styles.themeToggleText, { color: colors.text.primary }]}
            >
              Dark Mode
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleThemeToggle}
            trackColor={{
              false: colors.neutral[300],
              true: colors.primary[500],
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : colors.white}
            ios_backgroundColor={colors.neutral[300]}
            accessibilityLabel="Dark mode"
            accessibilityHint={
              darkMode
                ? 'Double tap to turn off dark mode'
                : 'Double tap to turn on dark mode'
            }
            accessibilityRole="switch"
            accessibilityState={{ checked: darkMode }}
          />
        </View>

        {/* Menu Sections */}
        <MenuSection title="My Data">
          <MenuItem
            icon={<TrendingUp size={20} color={colors.text.secondary} />}
            title="Wardrobe Analytics"
            subtitle="View your wardrobe insights and statistics"
            onPress={() => router.push('/profile/wardrobe-analytics')}
          />
          <MenuItem
            icon={<Heart size={20} color={colors.text.secondary} />}
            title="Saved Outfits"
            subtitle="Browse and manage your saved outfits"
            onPress={() => router.push('/profile/saved')}
          />
          <MenuItem
            icon={<DollarSign size={20} color={colors.text.secondary} />}
            title="Items for Sale"
            subtitle="Manage your items that are for sale"
            onPress={() => router.push('/profile/selling')}
          />
        </MenuSection>

        <MenuSection title="Account">
          <MenuItem
            icon={<User size={20} color={colors.text.secondary} />}
            title="Edit Profile"
            subtitle="Update your complete profile information"
            onPress={() => router.push('/profile/edit-profile')}
          />
          <MenuItem
            icon={<User size={20} color={colors.text.secondary} />}
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => router.push('/profile/personal-info')}
          />
          <MenuItem
            icon={<Bell size={20} color={colors.text.secondary} />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => router.push('/profile/notifications')}
          />
          <MenuItem
            icon={<Shield size={20} color={colors.text.secondary} />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => router.push('/profile/privacy')}
          />
          <MenuItem
            icon={<BarChart size={20} color={colors.text.secondary} />}
            title="Analytics & Privacy"
            subtitle="Manage data collection settings"
            onPress={() => router.push('/profile/analytics')}
          />
          <MenuItem
            icon={<Download size={20} color={colors.text.secondary} />}
            title="Export Data"
            subtitle="Download all your data (GDPR)"
            onPress={handleExportData}
          />
        </MenuSection>

        <MenuSection title="App">
          <MenuItem
            icon={<Settings size={20} color={colors.text.secondary} />}
            title="Settings"
            subtitle="App preferences and configuration"
            onPress={() => router.push('/profile/settings')}
          />
          <MenuItem
            icon={<HelpCircle size={20} color={colors.text.secondary} />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => router.push('/profile/help')}
          />
        </MenuSection>

        <MenuSection title="">
          <MenuItem
            icon={<LogOut size={20} color={colors.error[500]} />}
            title="Sign Out"
            onPress={handleSignOut}
            showArrow={false}
            destructive
          />
          <MenuItem
            icon={<Trash2 size={20} color={colors.error[500]} />}
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
            showArrow={false}
            destructive
          />
        </MenuSection>

        {/* App Info */}
        <View
          style={[styles.appInfo, { backgroundColor: colors.surface.primary }]}
        >
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
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  userSection: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.sm,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadius.full,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: Layout.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    ...Typography.heading.h3,
    marginBottom: Spacing.xs,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.sm,
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleText: {
    ...Typography.body.medium,
  },
  section: {
    marginBottom: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.caption.large,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  destructiveIcon: {
    backgroundColor: Colors.error[50],
  },
  menuTitle: {
    ...Typography.body.medium,
    marginBottom: 2,
    fontWeight: '500',
  },
  destructiveText: {
    color: Colors.error[600],
  },
  menuSubtitle: {
    ...Typography.body.small,
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    paddingHorizontal: Spacing.md,
    borderRadius: Layout.borderRadius.lg,
    ...Shadows.sm,
  },
  appDescription: {
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
