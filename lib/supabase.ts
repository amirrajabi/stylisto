import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { ErrorCategory, errorHandling, ErrorSeverity } from './errorHandling';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Validate Supabase configuration
if (
  !process.env.EXPO_PUBLIC_SUPABASE_URL ||
  supabaseUrl === 'https://placeholder.supabase.co'
) {
  console.warn(
    'Warning: EXPO_PUBLIC_SUPABASE_URL is not set. Using placeholder values.'
  );
}

if (
  !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  supabaseAnonKey === 'placeholder-anon-key'
) {
  console.warn(
    'Warning: EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Using placeholder values.'
  );
}

// Custom storage for React Native
const customStorage =
  Platform.OS !== 'web'
    ? {
        getItem: async (key: string) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (error) {
            console.error('Error getting item from storage:', error);
            errorHandling.captureError(
              error instanceof Error
                ? error
                : new Error('Error getting item from storage'),
              {
                severity: ErrorSeverity.ERROR,
                category: ErrorCategory.STORAGE,
                context: { additionalData: { key } },
              }
            );
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (error) {
            console.error('Error setting item in storage:', error);
            errorHandling.captureError(
              error instanceof Error
                ? error
                : new Error('Error setting item in storage'),
              {
                severity: ErrorSeverity.ERROR,
                category: ErrorCategory.STORAGE,
                context: { additionalData: { key } },
              }
            );
          }
        },
        removeItem: async (key: string) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (error) {
            console.error('Error removing item from storage:', error);
            errorHandling.captureError(
              error instanceof Error
                ? error
                : new Error('Error removing item from storage'),
              {
                severity: ErrorSeverity.ERROR,
                category: ErrorCategory.STORAGE,
                context: { additionalData: { key } },
              }
            );
          }
        },
      }
    : undefined;

// Create Supabase client with error handling
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use custom storage for React Native, default for web
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Enable refresh token rotation for enhanced security
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': `stylisto-${Platform.OS}`,
    },
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Add error handling
  fetch: async (url, options) => {
    const startTime = performance.now();

    try {
      const response = await fetch(url, options);

      // Track request performance
      const endTime = performance.now();
      const requestTime = endTime - startTime;

      // Log slow requests
      if (requestTime > 1000) {
        errorHandling.captureMessage(
          `Slow Supabase request: ${requestTime.toFixed(2)}ms`,
          {
            severity: ErrorSeverity.WARNING,
            category: ErrorCategory.NETWORK,
            context: {
              url: url.toString(),
              method: options?.method || 'GET',
              requestTime,
            },
          }
        );
      }

      return response;
    } catch (error) {
      // Log network errors
      errorHandling.captureError(
        error instanceof Error ? error : new Error('Supabase network error'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.NETWORK,
          context: {
            url: url.toString(),
            method: options?.method || 'GET',
          },
        }
      );

      throw error;
    }
  },
});

// Enhanced error handling for Supabase auth
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any cached data
    if (Platform.OS !== 'web') {
      AsyncStorage.multiRemove([
        'wardrobe_cache',
        'user_preferences_cache',
        'outfit_cache',
      ]).catch(console.error);
    }

    // Log sign out event
    errorHandling.captureMessage('User signed out', {
      severity: ErrorSeverity.INFO,
      category: ErrorCategory.AUTH,
    });
  }

  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');

    // Log token refresh
    errorHandling.captureMessage('Token refreshed', {
      severity: ErrorSeverity.DEBUG,
      category: ErrorCategory.AUTH,
    });
  }

  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);

    // Set user in error handling service
    if (session?.user) {
      errorHandling.setUser(session.user.id, session.user.email);
    }

    // Log sign in event
    errorHandling.captureMessage('User signed in', {
      severity: ErrorSeverity.INFO,
      category: ErrorCategory.AUTH,
      context: {
        email: session?.user?.email,
      },
    });
  }
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          ai_response: Json | null;
          context_data: Json | null;
          created_at: string;
          feedback_type: Database['public']['Enums']['feedback_type'];
          id: string;
          is_helpful: boolean | null;
          updated_at: string;
          user_feedback: string | null;
          user_id: string;
          user_rating: number | null;
        };
        Insert: {
          ai_response?: Json | null;
          context_data?: Json | null;
          created_at?: string;
          feedback_type: Database['public']['Enums']['feedback_type'];
          id?: string;
          is_helpful?: boolean | null;
          updated_at?: string;
          user_feedback?: string | null;
          user_id: string;
          user_rating?: number | null;
        };
        Update: {
          ai_response?: Json | null;
          context_data?: Json | null;
          created_at?: string;
          feedback_type?: Database['public']['Enums']['feedback_type'];
          id?: string;
          is_helpful?: boolean | null;
          updated_at?: string;
          user_feedback?: string | null;
          user_id?: string;
          user_rating?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'analytics_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'ai_feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_wardrobe_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'ai_feedback_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_events: {
        Row: {
          created_at: string;
          device_info: Json | null;
          event_name: string;
          event_properties: Json | null;
          event_type: Database['public']['Enums']['event_type'];
          id: string;
          ip_address: unknown | null;
          page_url: string | null;
          referrer: string | null;
          session_id: string | null;
          timestamp: string;
          user_agent: string | null;
          user_id: string | null;
          user_properties: Json | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
        };
        Insert: {
          created_at?: string;
          device_info?: Json | null;
          event_name: string;
          event_properties?: Json | null;
          event_type: Database['public']['Enums']['event_type'];
          id?: string;
          ip_address?: unknown | null;
          page_url?: string | null;
          referrer?: string | null;
          session_id?: string | null;
          timestamp?: string;
          user_agent?: string | null;
          user_id?: string | null;
          user_properties?: Json | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Update: {
          created_at?: string;
          device_info?: Json | null;
          event_name?: string;
          event_properties?: Json | null;
          event_type?: Database['public']['Enums']['event_type'];
          id?: string;
          ip_address?: unknown | null;
          page_url?: string | null;
          referrer?: string | null;
          session_id?: string | null;
          timestamp?: string;
          user_agent?: string | null;
          user_id?: string | null;
          user_properties?: Json | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'analytics_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_wardrobe_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_events_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_funnel_steps: {
        Row: {
          created_at: string;
          event_criteria: Json;
          funnel_id: string;
          id: string;
          step_config: Json | null;
          step_name: string;
          step_order: number;
          step_type: Database['public']['Enums']['funnel_step_type'];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          event_criteria: Json;
          funnel_id: string;
          id?: string;
          step_config?: Json | null;
          step_name: string;
          step_order: number;
          step_type: Database['public']['Enums']['funnel_step_type'];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          event_criteria?: Json;
          funnel_id?: string;
          id?: string;
          step_config?: Json | null;
          step_name?: string;
          step_order?: number;
          step_type?: Database['public']['Enums']['funnel_step_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_funnel_steps_funnel_id_fkey';
            columns: ['funnel_id'];
            isOneToOne: false;
            referencedRelation: 'analytics_funnels';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'analytics_funnel_steps_funnel_id_fkey';
            columns: ['funnel_id'];
            isOneToOne: false;
            referencedRelation: 'funnel_analysis';
            referencedColumns: ['funnel_id'];
          },
        ];
      };
      analytics_funnels: {
        Row: {
          created_at: string;
          created_by: string | null;
          description: string | null;
          funnel_config: Json | null;
          id: string;
          is_active: boolean | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          funnel_config?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          funnel_config?: Json | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_funnels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'analytics_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_funnels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'user_wardrobe_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_funnels_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      analytics_user_properties: {
        Row: {
          created_at: string;
          id: string;
          is_system_property: boolean | null;
          property_name: string;
          property_type: string | null;
          property_value: Json;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_system_property?: boolean | null;
          property_name: string;
          property_type?: string | null;
          property_value: Json;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_system_property?: boolean | null;
          property_name?: string;
          property_type?: string | null;
          property_value?: Json;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'analytics_user_properties_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'analytics_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_user_properties_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_wardrobe_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'analytics_user_properties_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      clothing_items: {
        Row: {
          brand: string | null;
          category: Database['public']['Enums']['clothing_category'];
          color: string;
          condition: Database['public']['Enums']['item_condition'] | null;
          created_at: string;
          current_value: number | null;
          deleted_at: string | null;
          id: string;
          image_url: string;
          is_favorite: boolean | null;
          is_for_sale: boolean | null;
          last_worn: string | null;
          name: string;
          notes: string | null;
          occasions: Database['public']['Enums']['occasion_type'][] | null;
          original_price: number | null;
          price: number | null;
          purchase_date: string | null;
          sale_listing: Json | null;
          seasons: Database['public']['Enums']['season_type'][] | null;
          selling_price: number | null;
          size: string | null;
          subcategory: string | null;
          tags: string[] | null;
          times_worn: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          brand?: string | null;
          category: Database['public']['Enums']['clothing_category'];
          color: string;
          condition?: Database['public']['Enums']['item_condition'] | null;
          created_at?: string;
          current_value?: number | null;
          deleted_at?: string | null;
          id?: string;
          image_url: string;
          is_favorite?: boolean | null;
          is_for_sale?: boolean | null;
          last_worn?: string | null;
          name: string;
          notes?: string | null;
          occasions?: Database['public']['Enums']['occasion_type'][] | null;
          original_price?: number | null;
          price?: number | null;
          purchase_date?: string | null;
          sale_listing?: Json | null;
          seasons?: Database['public']['Enums']['season_type'][] | null;
          selling_price?: number | null;
          size?: string | null;
          subcategory?: string | null;
          tags?: string[] | null;
          times_worn?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          brand?: string | null;
          category?: Database['public']['Enums']['clothing_category'];
          color?: string;
          condition?: Database['public']['Enums']['item_condition'] | null;
          created_at?: string;
          current_value?: number | null;
          deleted_at?: string | null;
          id?: string;
          image_url?: string;
          is_favorite?: boolean | null;
          is_for_sale?: boolean | null;
          last_worn?: string | null;
          name?: string;
          notes?: string | null;
          occasions?: Database['public']['Enums']['occasion_type'][] | null;
          original_price?: number | null;
          price?: number | null;
          purchase_date?: string | null;
          sale_listing?: Json | null;
          seasons?: Database['public']['Enums']['season_type'][] | null;
          selling_price?: number | null;
          size?: string | null;
          subcategory?: string | null;
          tags?: string[] | null;
          times_worn?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'clothing_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'analytics_dashboard';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'clothing_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'user_wardrobe_summary';
            referencedColumns: ['user_id'];
          },
          {
            foreignKeyName: 'clothing_items_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      error_logs: {
        Row: {
          id: string;
          user_id: string;
          error_message: string;
          error_stack: string | null;
          error_name: string | null;
          context: Record<string, any>;
          feedback: string | null;
          platform: string;
          app_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          error_message: string;
          error_stack?: string | null;
          error_name?: string | null;
          context?: Record<string, any>;
          feedback?: string | null;
          platform: string;
          app_version: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          error_message?: string;
          error_stack?: string | null;
          error_name?: string | null;
          context?: Record<string, any>;
          feedback?: string | null;
          platform?: string;
          app_version?: string;
          created_at?: string;
        };
      };
      health_checks: {
        Row: {
          id: string;
          status: string;
          message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          status: string;
          message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          status?: string;
          message?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      user_wardrobe_summary: {
        Row: {
          user_id: string;
          first_name: string | null;
          last_name: string | null;
          total_items: number;
          favorite_items: number;
          total_outfits: number;
          total_wardrobe_value: number;
          avg_times_worn: number;
          last_item_added: string | null;
        };
      };
    };
    Functions: {
      get_wardrobe_stats: {
        Args: { user_uuid: string };
        Returns: any;
      };
      record_item_interaction: {
        Args: {
          item_id: string;
          interaction_type: string;
          interaction_data?: any;
        };
        Returns: void;
      };
      insert_health_check: {
        Args: {
          check_status: string;
          check_message?: string;
        };
        Returns: string;
      };
      cleanup_old_error_logs: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
    Enums: {
      clothing_category:
        | 'tops'
        | 'bottoms'
        | 'dresses'
        | 'outerwear'
        | 'shoes'
        | 'accessories'
        | 'underwear'
        | 'activewear'
        | 'sleepwear'
        | 'swimwear';
      event_type:
        | 'page_view'
        | 'button_click'
        | 'form_submit'
        | 'purchase'
        | 'signup'
        | 'login'
        | 'logout'
        | 'item_view'
        | 'item_add'
        | 'item_remove'
        | 'outfit_create'
        | 'outfit_save'
        | 'outfit_share'
        | 'search'
        | 'filter_apply'
        | 'image_upload'
        | 'ai_interaction'
        | 'custom';
      feedback_type:
        | 'outfit_suggestion'
        | 'style_recommendation'
        | 'color_matching'
        | 'weather_outfit'
        | 'occasion_outfit'
        | 'item_categorization'
        | 'tag_editing';
      funnel_step_type: 'entry' | 'intermediate' | 'conversion' | 'exit';
      item_condition:
        | 'excellent'
        | 'very_good'
        | 'good'
        | 'fair'
        | 'poor'
        | 'damaged';
      occasion_type:
        | 'casual'
        | 'work'
        | 'formal'
        | 'party'
        | 'sport'
        | 'travel'
        | 'date'
        | 'special';
      season_type: 'spring' | 'summer' | 'fall' | 'winter';
      user_role: 'user' | 'admin' | 'super_admin';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
