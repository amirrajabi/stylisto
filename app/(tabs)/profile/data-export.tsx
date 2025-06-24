import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Download, FileJson, FileText, FileImage, Database, Shield } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1 } from '../../../components/ui';

export default function DataExportScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportedData, setExportedData] = useState<any>(null);

  const handleExportData = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to export your data.');
      return;
    }
    
    try {
      setLoading(true);
      setProgress(10);
      
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userError) throw userError;
      setProgress(20);
      
      // Fetch user preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      // Preferences might not exist, so we don't throw on error
      setProgress(30);
      
      // Fetch clothing items
      const { data: clothingItems, error: clothingError } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      
      if (clothingError) throw clothingError;
      setProgress(50);
      
      // Fetch saved outfits
      const { data: savedOutfits, error: outfitsError } = await supabase
        .from('saved_outfits')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null);
      
      if (outfitsError) throw outfitsError;
      setProgress(70);
      
      // Fetch outfit items
      const { data: outfitItems, error: outfitItemsError } = await supabase
        .from('outfit_items')
        .select('*')
        .in('outfit_id', savedOutfits?.map(outfit => outfit.id) || []);
      
      if (outfitItemsError) throw outfitItemsError;
      setProgress(90);
      
      // Compile all data
      const exportData = {
        user: userData,
        preferences: preferencesData || null,
        wardrobe: {
          clothing_items: clothingItems || [],
          saved_outfits: savedOutfits || [],
          outfit_items: outfitItems || [],
        },
        metadata: {
          exported_at: new Date().toISOString(),
          app_version: '1.0.0',
          platform: Platform.OS,
        }
      };
      
      setExportedData(exportData);
      setProgress(100);
      
      // In a real app, you would offer to download the data
      if (Platform.OS === 'web') {
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stylisto-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        // On mobile, we would use expo-file-system and expo-sharing
        // For this demo, we'll just show a success message
        Alert.alert(
          'Data Export Complete',
          'Your data has been exported successfully. In a production app, you would be able to download or share this file.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <H1>Export Your Data</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Data Export</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Download a copy of all your personal data from Stylisto. This includes your profile information, wardrobe items, saved outfits, and preferences.
          </Text>
          
          <View style={styles.gdprInfo}>
            <Shield size={20} color={Colors.info[700]} />
            <Text style={styles.gdprInfoText}>
              This feature is provided in compliance with GDPR (General Data Protection Regulation) to give you control over your personal data.
            </Text>
          </View>
          
          <View style={styles.dataTypes}>
            <View style={styles.dataTypeItem}>
              <FileJson size={24} color={Colors.primary[700]} />
              <View style={styles.dataTypeContent}>
                <Text style={styles.dataTypeTitle}>Profile Data</Text>
                <Text style={styles.dataTypeDescription}>
                  Your account information and personal details
                </Text>
              </View>
            </View>
            
            <View style={styles.dataTypeItem}>
              <FileText size={24} color={Colors.secondary[500]} />
              <View style={styles.dataTypeContent}>
                <Text style={styles.dataTypeTitle}>Wardrobe Items</Text>
                <Text style={styles.dataTypeDescription}>
                  All your clothing items and their details
                </Text>
              </View>
            </View>
            
            <View style={styles.dataTypeItem}>
              <FileImage size={24} color={Colors.success[500]} />
              <View style={styles.dataTypeContent}>
                <Text style={styles.dataTypeTitle}>Saved Outfits</Text>
                <Text style={styles.dataTypeDescription}>
                  Your outfit combinations and preferences
                </Text>
              </View>
            </View>
            
            <View style={styles.dataTypeItem}>
              <Database size={24} color={Colors.info[500]} />
              <View style={styles.dataTypeContent}>
                <Text style={styles.dataTypeTitle}>App Settings</Text>
                <Text style={styles.dataTypeDescription}>
                  Your preferences and application settings
                </Text>
              </View>
            </View>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[700]} />
              <Text style={styles.loadingText}>Exporting your data... {progress}%</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportData}
            >
              <Download size={20} color={Colors.white} />
              <Text style={styles.exportButtonText}>Export My Data</Text>
            </TouchableOpacity>
          )}
          
          <Text style={styles.exportNote}>
            The export process may take a few moments depending on the amount of data you have.
          </Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Data Privacy Information</Text>
          <Text style={styles.infoText}>
            Your data is exported in JSON format, which can be opened with any text editor or imported into other applications.
          </Text>
          <Text style={styles.infoText}>
            The exported file contains all the data associated with your account. This data is provided for your personal use and should be kept secure.
          </Text>
          <Text style={styles.infoText}>
            If you wish to delete your account and all associated data, you can do so from the Privacy & Security settings.
          </Text>
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
  gdprInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.info[50],
    padding: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  gdprInfoText: {
    ...Typography.body.small,
    color: Colors.info[700],
    flex: 1,
  },
  dataTypes: {
    marginBottom: Spacing.lg,
  },
  dataTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
    gap: Spacing.md,
  },
  dataTypeContent: {
    flex: 1,
  },
  dataTypeTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  dataTypeDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginVertical: Spacing.md,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.neutral[200],
    borderRadius: Layout.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary[700],
    borderRadius: Layout.borderRadius.full,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },
  exportButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  exportNote: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.sm,
  },
  infoTitle: {
    ...Typography.heading.h5,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  infoText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
});