import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Settings, User, Bell, Shield, HelpCircle, LogOut } from 'lucide-react-native';

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
  }> = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <View>
          <Text style={styles.menuTitle}>{title}</Text>
          {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && <Text style={styles.arrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <User size={40} color="#6b7280" />
          </View>
          <Text style={styles.userName}>Fashion Enthusiast</Text>
          <Text style={styles.userEmail}>user@stylisto.app</Text>
        </View>

        {/* Menu Sections */}
        <MenuSection title="Account">
          <MenuItem
            icon={<User size={20} color="#6b7280" />}
            title="Personal Information"
            subtitle="Update your profile details"
            onPress={() => console.log('Personal Information')}
          />
          <MenuItem
            icon={<Bell size={20} color="#6b7280" />}
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => console.log('Notifications')}
          />
          <MenuItem
            icon={<Shield size={20} color="#6b7280" />}
            title="Privacy & Security"
            subtitle="Control your privacy settings"
            onPress={() => console.log('Privacy & Security')}
          />
        </MenuSection>

        <MenuSection title="App">
          <MenuItem
            icon={<Settings size={20} color="#6b7280" />}
            title="Settings"
            subtitle="App preferences and configuration"
            onPress={() => console.log('Settings')}
          />
          <MenuItem
            icon={<HelpCircle size={20} color="#6b7280" />}
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => console.log('Help & Support')}
          />
        </MenuSection>

        <MenuSection title="">
          <MenuItem
            icon={<LogOut size={20} color="#ef4444" />}
            title="Sign Out"
            onPress={() => console.log('Sign Out')}
            showArrow={false}
          />
        </MenuSection>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>Stylisto v1.0.0</Text>
          <Text style={styles.appDescription}>
            Your personal AI-powered wardrobe assistant
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
  },
  userSection: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  userEmail: {
    fontSize: 16,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontFamily: 'Inter-SemiBold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 2,
    fontFamily: 'Inter-SemiBold',
  },
  menuSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'Inter-Regular',
  },
  arrow: {
    fontSize: 20,
    color: '#d1d5db',
    fontWeight: '300',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  appVersion: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  appDescription: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});