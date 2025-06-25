import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Calendar,
  Globe,
  Heart,
  MapPin,
  Phone,
  Ruler,
  Save,
  Shirt,
  User,
  Weight,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { H1 } from '../../../components/ui';
import { Colors } from '../../../constants/Colors';
import { Shadows } from '../../../constants/Shadows';
import { Spacing } from '../../../constants/Spacing';
import { Typography } from '../../../constants/Typography';
import { useAuth } from '../../../hooks/useAuth';
import type { ProfileUpdateFormData } from '../../../types/auth';

export default function EditProfileScreen() {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProfileUpdateFormData>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || undefined,
    phone: user?.phone || '',
    country: user?.country || '',
    city: user?.city || '',
    timezone: user?.timezone || 'Australia/Sydney',
    preferred_language: user?.preferred_language || 'en',
    preferred_currency: user?.preferred_currency || 'AUD',
    height_cm: user?.height_cm || undefined,
    weight_kg: user?.weight_kg || undefined,
    clothing_size_top: user?.clothing_size_top || '',
    clothing_size_bottom: user?.clothing_size_bottom || '',
    clothing_size_shoes: user?.clothing_size_shoes || '',
    body_type: user?.body_type || undefined,
    bio: user?.bio || '',
    website_url: user?.website_url || '',
  });

  // Check for changes
  useEffect(() => {
    const hasFormChanges = Object.keys(formData).some(key => {
      const formValue = formData[key as keyof ProfileUpdateFormData];
      const userValue = user?.[key as keyof typeof user];
      return formValue !== userValue;
    });
    setHasChanges(hasFormChanges);
  }, [formData, user]);

  const updateFormData = (field: keyof ProfileUpdateFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData('date_of_birth', selectedDate.toISOString().split('T')[0]);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    try {
      setLoading(true);

      await updateUserProfile(formData);

      Alert.alert(
        'Profile Updated',
        'Your profile information has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

      setHasChanges(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const FormSection: React.FC<{
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, icon, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const FormField: React.FC<{
    label: string;
    value: string | number | undefined;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
    icon?: React.ReactNode;
  }> = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false,
    icon,
  }) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value?.toString() || ''}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.text.tertiary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      </View>
    </View>
  );

  const PickerField: React.FC<{
    label: string;
    value: string | undefined;
    onValueChange: (value: string) => void;
    items: { label: string; value: string }[];
    icon?: React.ReactNode;
  }> = ({ label, value, onValueChange, items, icon }) => (
    <View style={styles.formGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <Picker
          style={styles.picker}
          selectedValue={value}
          onValueChange={onValueChange}
        >
          <Picker.Item label="Select..." value="" />
          {items.map(item => (
            <Picker.Item
              key={item.value}
              label={item.label}
              value={item.value}
            />
          ))}
        </Picker>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Edit Profile</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <FormSection
          title="Personal Information"
          icon={<User size={20} color={Colors.primary[600]} />}
        >
          <FormField
            label="First Name"
            value={formData.first_name}
            onChangeText={text => updateFormData('first_name', text)}
            placeholder="Enter your first name"
            icon={<User size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Last Name"
            value={formData.last_name}
            onChangeText={text => updateFormData('last_name', text)}
            placeholder="Enter your last name"
            icon={<User size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Username"
            value={formData.username}
            onChangeText={text => updateFormData('username', text)}
            placeholder="Choose a unique username"
            icon={<User size={16} color={Colors.text.secondary} />}
          />

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={16} color={Colors.text.secondary} />
              <Text
                style={[
                  styles.dateText,
                  !formData.date_of_birth && styles.placeholder,
                ]}
              >
                {formData.date_of_birth
                  ? new Date(formData.date_of_birth).toLocaleDateString()
                  : 'Select your date of birth'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={
                formData.date_of_birth
                  ? new Date(formData.date_of_birth)
                  : new Date()
              }
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <PickerField
            label="Gender"
            value={formData.gender}
            onValueChange={value => updateFormData('gender', value)}
            items={[
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Non-binary', value: 'non-binary' },
              { label: 'Prefer not to say', value: 'prefer-not-to-say' },
            ]}
            icon={<Heart size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Phone Number"
            value={formData.phone}
            onChangeText={text => updateFormData('phone', text)}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            icon={<Phone size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Bio"
            value={formData.bio}
            onChangeText={text => updateFormData('bio', text)}
            placeholder="Tell us about yourself..."
            multiline
            icon={<User size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Website"
            value={formData.website_url}
            onChangeText={text => updateFormData('website_url', text)}
            placeholder="https://yourwebsite.com"
            keyboardType="email-address"
            icon={<Globe size={16} color={Colors.text.secondary} />}
          />
        </FormSection>

        <FormSection
          title="Location & Preferences"
          icon={<MapPin size={20} color={Colors.primary[600]} />}
        >
          <FormField
            label="Country"
            value={formData.country}
            onChangeText={text => updateFormData('country', text)}
            placeholder="Enter your country"
            icon={<Globe size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="City"
            value={formData.city}
            onChangeText={text => updateFormData('city', text)}
            placeholder="Enter your city"
            icon={<MapPin size={16} color={Colors.text.secondary} />}
          />

          <PickerField
            label="Timezone"
            value={formData.timezone}
            onValueChange={value => updateFormData('timezone', value)}
            items={[
              { label: 'Sydney (AEDT)', value: 'Australia/Sydney' },
              { label: 'Melbourne (AEDT)', value: 'Australia/Melbourne' },
              { label: 'Brisbane (AEST)', value: 'Australia/Brisbane' },
              { label: 'Perth (AWST)', value: 'Australia/Perth' },
              { label: 'Adelaide (ACDT)', value: 'Australia/Adelaide' },
              { label: 'Darwin (ACST)', value: 'Australia/Darwin' },
            ]}
            icon={<Globe size={16} color={Colors.text.secondary} />}
          />

          <PickerField
            label="Preferred Language"
            value={formData.preferred_language}
            onValueChange={value => updateFormData('preferred_language', value)}
            items={[
              { label: 'English', value: 'en' },
              { label: 'فارسی', value: 'fa' },
              { label: 'العربية', value: 'ar' },
              { label: 'Français', value: 'fr' },
              { label: 'Español', value: 'es' },
              { label: '中文', value: 'zh' },
            ]}
            icon={<Globe size={16} color={Colors.text.secondary} />}
          />

          <PickerField
            label="Preferred Currency"
            value={formData.preferred_currency}
            onValueChange={value => updateFormData('preferred_currency', value)}
            items={[
              { label: 'Australian Dollar (AUD)', value: 'AUD' },
              { label: 'US Dollar (USD)', value: 'USD' },
              { label: 'Euro (EUR)', value: 'EUR' },
              { label: 'British Pound (GBP)', value: 'GBP' },
              { label: 'Canadian Dollar (CAD)', value: 'CAD' },
            ]}
            icon={<Globe size={16} color={Colors.text.secondary} />}
          />
        </FormSection>

        <FormSection
          title="Body Measurements"
          icon={<Ruler size={20} color={Colors.primary[600]} />}
        >
          <FormField
            label="Height (cm)"
            value={formData.height_cm}
            onChangeText={text =>
              updateFormData('height_cm', parseInt(text) || undefined)
            }
            placeholder="Enter your height in centimeters"
            keyboardType="numeric"
            icon={<Ruler size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Weight (kg)"
            value={formData.weight_kg}
            onChangeText={text =>
              updateFormData('weight_kg', parseFloat(text) || undefined)
            }
            placeholder="Enter your weight in kilograms"
            keyboardType="numeric"
            icon={<Weight size={16} color={Colors.text.secondary} />}
          />

          <PickerField
            label="Body Type"
            value={formData.body_type}
            onValueChange={value => updateFormData('body_type', value)}
            items={[
              { label: 'Pear', value: 'pear' },
              { label: 'Apple', value: 'apple' },
              { label: 'Hourglass', value: 'hourglass' },
              { label: 'Rectangle', value: 'rectangle' },
              { label: 'Inverted Triangle', value: 'inverted-triangle' },
            ]}
            icon={<User size={16} color={Colors.text.secondary} />}
          />
        </FormSection>

        <FormSection
          title="Clothing Sizes"
          icon={<Shirt size={20} color={Colors.primary[600]} />}
        >
          <FormField
            label="Top Size"
            value={formData.clothing_size_top}
            onChangeText={text => updateFormData('clothing_size_top', text)}
            placeholder="e.g., S, M, L, XL, 8, 10, 12"
            icon={<Shirt size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Bottom Size"
            value={formData.clothing_size_bottom}
            onChangeText={text => updateFormData('clothing_size_bottom', text)}
            placeholder="e.g., 28, 30, 32, S, M, L"
            icon={<Shirt size={16} color={Colors.text.secondary} />}
          />

          <FormField
            label="Shoe Size"
            value={formData.clothing_size_shoes}
            onChangeText={text => updateFormData('clothing_size_shoes', text)}
            placeholder="e.g., 7, 8, 9, 10, 11"
            icon={<Shirt size={16} color={Colors.text.secondary} />}
          />
        </FormSection>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {hasChanges && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <>
                <Save size={20} color={Colors.white} />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: 12,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.heading.h3,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body.medium,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: Spacing.sm,
  },
  picker: {
    flex: 1,
    color: Colors.text.primary,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  dateText: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  placeholder: {
    color: Colors.text.tertiary,
  },
  bottomPadding: {
    height: 100,
  },
  footer: {
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  saveButton: {
    backgroundColor: Colors.primary[600],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 8,
    ...Shadows.sm,
  },
  saveButtonText: {
    ...Typography.body.medium,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: Spacing.sm,
  },
});
