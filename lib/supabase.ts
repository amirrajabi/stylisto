import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Custom storage for React Native
const customStorage = Platform.OS !== 'web' ? {
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Error getting item from storage:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting item in storage:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from storage:', error);
    }
  },
} : undefined;

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
});

// Enhanced error handling
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
  }

  if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed successfully');
  }

  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session?.user?.email);
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
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
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
      // Add other table types as needed
    };
    Views: {
      user_wardrobe_summary: {
        Row: {
          user_id: string;
          full_name: string | null;
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
    };
  };
}