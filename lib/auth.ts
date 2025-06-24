import { supabase } from './supabase';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

// Configure WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  email_confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthService {
  private static instance: AuthService;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign up with email and password
   */
  async signUp({ email, password, fullName }: SignUpData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/auth/callback`
            : makeRedirectUri({ path: '/auth/callback' }),
        },
      });

      if (error) throw error;

      // Create user profile in our users table
      if (data.user && !error) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw here as the auth user was created successfully
        }

        // Create default user preferences
        const { error: preferencesError } = await supabase
          .from('user_preferences')
          .insert({
            user_id: data.user.id,
            style_preferences: {},
            size_preferences: {},
            color_preferences: [],
            brand_preferences: [],
            notification_settings: {
              outfit_reminders: true,
              weather_alerts: true,
              style_tips: true,
              new_features: true,
            },
            privacy_settings: {
              profile_visibility: 'private',
              share_outfits: false,
              analytics_tracking: true,
            },
          });

        if (preferencesError) {
          console.error('Error creating user preferences:', preferencesError);
        }
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Record user session
      if (data.user) {
        await this.recordUserSession(data.user.id);
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const redirectUrl = makeRedirectUri({
        path: '/auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Apple OAuth (iOS only)
   */
  async signInWithApple() {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign In is only available on iOS');
      }

      const redirectUrl = makeRedirectUri({
        path: '/auth/callback',
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      // End current session in database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await this.endUserSession(user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/auth/reset-password`
        : makeRedirectUri({ path: '/auth/reset-password' });

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Update password
   */
  async updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update auth metadata
      const authUpdates: any = {};
      if (updates.full_name) {
        authUpdates.data = { full_name: updates.full_name };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // Update user profile table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: updates.full_name,
          avatar_url: updates.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Refresh session error:', error);
      throw error;
    }
  }

  /**
   * Record user session start
   */
  private async recordUserSession(userId: string) {
    try {
      const platform = Platform.OS;
      const appVersion = '1.0.0'; // You can get this from app.json or Constants

      await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          platform,
          app_version: appVersion,
          session_start: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error recording user session:', error);
      // Don't throw as this is not critical for auth flow
    }
  }

  /**
   * End user session
   */
  private async endUserSession(userId: string) {
    try {
      // Find the most recent active session
      const { data: sessions } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const sessionEnd = new Date();
        const sessionStart = new Date(session.session_start);
        const durationMinutes = Math.round(
          (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)
        );

        await supabase
          .from('user_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_minutes: durationMinutes,
          })
          .eq('id', session.id);
      }
    } catch (error) {
      console.error('Error ending user session:', error);
      // Don't throw as this is not critical for auth flow
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(url: string) {
    try {
      const { data, error } = await supabase.auth.getSessionFromUrl(url);
      if (error) throw error;

      // Create user profile if it doesn't exist (for OAuth users)
      if (data.user) {
        const { data: existingProfile } = await supabase
          .from('users')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (!existingProfile) {
          await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
              avatar_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture,
            });

          // Create default preferences
          await supabase
            .from('user_preferences')
            .insert({
              user_id: data.user.id,
              style_preferences: {},
              size_preferences: {},
              color_preferences: [],
              brand_preferences: [],
            });
        }

        // Record session
        await this.recordUserSession(data.user.id);
      }

      return data;
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }
}

export const authService = AuthService.getInstance();