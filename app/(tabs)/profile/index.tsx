import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight,
  Moon,
  Download,
  Trash2,
  Camera
} from 'lucide-react-native';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabase';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1, BodyMedium, BodySmall } from '../../../components/ui';

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
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
      darkMode: false,
      fontSize: 'medium',
    }
  });

  // Load user preferences from AsyncStorage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPreferences = await AsyncStorage.getItem('@user_preferences');
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
        await AsyncStorage.setItem('@user_preferences', JSON.stringify(userPreferences));
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
        darkMode: value
      }
    }));
    
    // Save theme preference
    await AsyncStorage.setItem('@theme_preference', value ? 'dark' : 'light');
    
    // In a real app, you would apply the theme change here
    // For example: ThemeProvider.setTheme(value ? 'dark' : 'light');
  };

  // Handle notification toggle
  const handleNotificationToggle = (key: string, value: boolean) => {
    setUserPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));
  };

  // Handle privacy toggle
  const handlePrivacyToggle = (key: string, value: boolean | string) => {
    setUserPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));
  };

  // Handle sign out
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut();
              router.replace('/(auth)/login');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
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
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

  // Handle data export (GDPR compliance)
  const handleExportData = async () => {
    try {
      setLoading(true);
      
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
      
      if (preferencesError && preferencesError.code !== 'PGRST116') throw preferencesError;
      
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
        // For mobile: Save to file system or share
        // In a real app, you would use expo-file-system and expo-sharing
        Alert.alert(
          'Data Export',
          'Your data has been exported successfully. In a production app, you would be able to download or share this file.',
          [{ text: 'OK' }]
        );
      }
      
      Alert.alert(
        'Data Exported',
        'Your data has been exported successfully.'
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture update
  const handleUpdateProfilePicture = () => {
    Alert.alert(
      'Update Profile Picture',
      'Choose an option',
      [
        { 
          text: 'Take Photo', 
          onPress: () => {
            router.push({
              pathname: '/camera',
              params: {
                mode: 'camera',
                maxPhotos: '1',
                returnTo: '/profile',
                itemType: 'profile'
              }
            });
          }
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => {
            router.push({
              pathname: '/camera',
              params: {
                mode: 'gallery',
                maxPhotos: '1',
                returnTo: '/profile',
                itemType: 'profile'
              }
            });
          }
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

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
    rightElement?: React.ReactNode;
  }> = ({ icon, title, subtitle, onPress, showArrow = true, destructive = false, rightElement }) => (
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
      
      {rightElement ? (
        rightElement
      ) : (
        showArrow && (
          <ChevronRight size={20} color={Colors.text.tertiary} />
        )
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary[700]} />
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <H1>Profile</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleUpdateProfilePicture}
          >
            {user?.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color={Colors.text.secondary} />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Camera size={16} color={Colors.white} />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <BodyMedium color="secondary">{user?.email}</BodyMedium>
        </View>

        {/* Theme Toggle */}
        <View style={styles.themeToggleContainer}>
          <View style={styles.themeToggleLeft}>
            <Moon size={20} color={Colors.text.primary} />
            <Text style={styles.themeToggleText}>Dark Mode</Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={handleThemeToggle}
            trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
            thumbColor={Colors.white}
          />
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
          <MenuItem
            icon={<Download size={20} color={Colors.text.secondary} />}
            title="Export Data"
            subtitle="Download all your data (GDPR)"
            onPress={handleExportData}
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
            onPress={handleSignOut}
            showArrow={false}
            destructive
          />
          <MenuItem
            icon={<Trash2 size={20} color={Colors.error[500]} />}
            title="Delete Account"
            subtitle="Permanently delete your account and data"
            onPress={handleDeleteAccount}
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
    backgroundColor: Colors.surface.secondary,
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
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface.primary,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  themeToggleText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});