export interface User {
  id: string;
  email: string;

  // Personal Information
  first_name?: string;
  last_name?: string;
  username?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  phone?: string;
  avatar_url?: string;

  // Location and Timezone
  country?: string;
  city?: string;
  timezone?: string;

  // Language and Currency Preferences
  preferred_language?: string;
  preferred_currency?: string;

  // Body Measurements for Clothing Recommendations
  height_cm?: number;
  weight_kg?: number;
  clothing_size_top?: string;
  clothing_size_bottom?: string;
  clothing_size_shoes?: string;
  body_type?:
    | 'pear'
    | 'apple'
    | 'hourglass'
    | 'rectangle'
    | 'inverted-triangle';

  // Style Preferences (JSON objects)
  style_preferences?: StylePreferences;
  color_preferences?: ColorPreferences;
  brand_preferences?: BrandPreferences;
  budget_range?: BudgetRange;

  // Privacy and Notification Settings
  privacy_settings?: PrivacySettings;
  notification_settings?: NotificationSettings;

  // Account Metadata
  profile_completed?: boolean;
  onboarding_completed?: boolean;
  last_login_at?: string;
  is_active?: boolean;
  subscription_tier?: 'free' | 'premium' | 'pro';

  // Bio and Social Links
  bio?: string;
  website_url?: string;
  social_links?: SocialLinks;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StylePreferences {
  casual?: number; // 1-10 preference score
  formal?: number;
  sporty?: number;
  bohemian?: number;
  minimalist?: number;
  vintage?: number;
  trendy?: number;
  classic?: number;
  edgy?: number;
  romantic?: number;
  [key: string]: any;
}

export interface ColorPreferences {
  favorite_colors?: string[];
  disliked_colors?: string[];
  neutral_preference?: boolean;
  bold_colors?: boolean;
  pastel_colors?: boolean;
  [key: string]: any;
}

export interface BrandPreferences {
  favorite_brands?: string[];
  preferred_price_range?: 'budget' | 'mid-range' | 'luxury' | 'mixed';
  sustainable_preference?: boolean;
  local_brands_preference?: boolean;
  [key: string]: any;
}

export interface BudgetRange {
  min: number;
  max: number;
  currency: string;
  category_budgets?: {
    tops?: { min: number; max: number };
    bottoms?: { min: number; max: number };
    shoes?: { min: number; max: number };
    accessories?: { min: number; max: number };
    outerwear?: { min: number; max: number };
  };
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends-only';
  data_sharing: boolean;
  analytics_tracking?: boolean;
  personalized_ads?: boolean;
  location_sharing?: boolean;
  outfit_sharing?: boolean;
}

export interface NotificationSettings {
  push_notifications: boolean;
  email_notifications: boolean;
  outfit_recommendations: boolean;
  weather_alerts: boolean;
  wardrobe_reminders?: boolean;
  style_tips?: boolean;
  new_features?: boolean;
  promotional?: boolean;
}

export interface SocialLinks {
  instagram?: string;
  pinterest?: string;
  tiktok?: string;
  youtube?: string;
  twitter?: string;
  facebook?: string;
  [key: string]: string | undefined;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  first_name: string;
  last_name: string;
}

export interface ProfileUpdateFormData {
  first_name?: string;
  last_name?: string;
  username?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  phone?: string;
  country?: string;
  city?: string;
  timezone?: string;
  preferred_language?: string;
  preferred_currency?: string;
  height_cm?: number;
  weight_kg?: number;
  clothing_size_top?: string;
  clothing_size_bottom?: string;
  clothing_size_shoes?: string;
  body_type?:
    | 'pear'
    | 'apple'
    | 'hourglass'
    | 'rectangle'
    | 'inverted-triangle';
  bio?: string;
  website_url?: string;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

export interface AuthError {
  message: string;
  field?: string;
}
