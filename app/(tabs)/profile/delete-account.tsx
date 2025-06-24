import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, TriangleAlert as AlertTriangle, Trash2, Download } from 'lucide-react-native';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { Shadows } from '../../../constants/Shadows';
import { H1 } from '../../../components/ui';

export default function DeleteAccountScreen() {
  const { user, signOut } = useAuth();
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataExported, setDataExported] = useState(false);

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would export the data
      // For this demo, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setDataExported(true);
      
      Alert.alert(
        'Data Exported',
        'Your data has been exported successfully.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion.');
      return;
    }
    
    if (!dataExported) {
      Alert.alert(
        'Export Data First',
        'For your protection, please export your data before deleting your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Export Data', 
            onPress: handleExportData 
          }
        ]
      );
      return;
    }
    
    try {
      setLoading(true);
      
      // In a real app, this would call a server function to delete the account
      // For this demo, we'll simulate it
      
      // First, soft delete user data
      const { error: updateError } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user?.id);
      
      if (updateError) throw updateError;
      
      // Sign out the user
      await signOut();
      
      // Navigate to login screen
      router.replace('/(auth)/login');
      
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted. All your data has been removed from our servers.'
      );
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
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
        <H1>Delete Account</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.warningSection}>
          <AlertTriangle size={32} color={Colors.error[500]} />
          <Text style={styles.warningTitle}>Warning: This action cannot be undone</Text>
          <Text style={styles.warningText}>
            Deleting your account will permanently remove all your data from our servers, including:
          </Text>
          
          <View style={styles.warningList}>
            <Text style={styles.warningListItem}>• Your profile information</Text>
            <Text style={styles.warningListItem}>• All your wardrobe items</Text>
            <Text style={styles.warningListItem}>• Saved outfits and combinations</Text>
            <Text style={styles.warningListItem}>• App preferences and settings</Text>
            <Text style={styles.warningListItem}>• Usage history and analytics</Text>
          </View>
          
          <Text style={styles.warningText}>
            This process cannot be reversed. Once your account is deleted, we cannot recover any of your data.
          </Text>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Download size={20} color={Colors.text.primary} />
            <Text style={styles.sectionTitle}>Export Your Data First</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Before deleting your account, we recommend exporting your data for your records.
          </Text>
          
          <TouchableOpacity
            style={[
              styles.exportButton,
              dataExported && styles.exportButtonCompleted
            ]}
            onPress={handleExportData}
            disabled={loading || dataExported}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Download size={20} color={Colors.white} />
                <Text style={styles.exportButtonText}>
                  {dataExported ? 'Data Exported ✓' : 'Export My Data'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trash2 size={20} color={Colors.error[500]} />
            <Text style={[styles.sectionTitle, { color: Colors.error[600] }]}>
              Confirm Deletion
            </Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            To confirm that you want to delete your account, please type "DELETE" in the field below.
          </Text>
          
          <View style={styles.confirmationContainer}>
            <TextInput
              style={styles.confirmationInput}
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder="Type DELETE to confirm"
              placeholderTextColor={Colors.text.tertiary}
              autoCapitalize="characters"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.deleteButton,
              (confirmation !== 'DELETE' || !dataExported) && styles.deleteButtonDisabled
            ]}
            onPress={handleDeleteAccount}
            disabled={confirmation !== 'DELETE' || loading || !dataExported}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Trash2 size={20} color={Colors.white} />
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
          
          <Text style={styles.deleteNote}>
            By deleting your account, you acknowledge that all your data will be permanently removed and cannot be recovered.
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
  warningSection: {
    backgroundColor: Colors.error[50],
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  warningTitle: {
    ...Typography.heading.h4,
    color: Colors.error[700],
    marginVertical: Spacing.md,
    textAlign: 'center',
  },
  warningText: {
    ...Typography.body.medium,
    color: Colors.error[700],
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  warningList: {
    alignSelf: 'stretch',
    marginVertical: Spacing.md,
  },
  warningListItem: {
    ...Typography.body.medium,
    color: Colors.error[700],
    marginBottom: Spacing.xs,
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
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[700],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    gap: Spacing.sm,
  },
  exportButtonCompleted: {
    backgroundColor: Colors.success[500],
  },
  exportButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  confirmationContainer: {
    marginBottom: Spacing.lg,
  },
  confirmationInput: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.error[300],
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.error[50],
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error[600],
    paddingVertical: Spacing.md,
    borderRadius: Layout.borderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  deleteButtonDisabled: {
    backgroundColor: Colors.error[300],
  },
  deleteButtonText: {
    ...Typography.button.medium,
    color: Colors.white,
  },
  deleteNote: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    textAlign: 'center',
  },
});