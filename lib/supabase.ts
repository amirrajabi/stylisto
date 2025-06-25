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

// Database types for better TypeScript support
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      clothing_items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          subcategory: string | null;
          color: string;
          brand: string | null;
          size: string | null;
          seasons: string[];
          occasions: string[];
          image_url: string;
          tags: string[];
          is_favorite: boolean;
          last_worn: string | null;
          times_worn: number;
          purchase_date: string | null;
          price: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          subcategory?: string | null;
          color: string;
          brand?: string | null;
          size?: string | null;
          seasons?: string[];
          occasions?: string[];
          image_url: string;
          tags?: string[];
          is_favorite?: boolean;
          last_worn?: string | null;
          times_worn?: number;
          purchase_date?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          subcategory?: string | null;
          color?: string;
          brand?: string | null;
          size?: string | null;
          seasons?: string[];
          occasions?: string[];
          image_url?: string;
          tags?: string[];
          is_favorite?: boolean;
          last_worn?: string | null;
          times_worn?: number;
          purchase_date?: string | null;
          price?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
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
      // Add other table types as needed
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
  };
}
