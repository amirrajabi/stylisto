import { Platform } from 'react-native';
import {
  AuthError,
  ErrorCategory,
  errorHandling,
  ErrorSeverity,
} from './errorHandling';
import { supabase } from './supabase';

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

export interface SendOTPData {
  email: string;
}

export interface VerifyOTPData {
  email: string;
  token: string;
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
   * Send OTP to email address
   */
  async sendOTP({ email }: SendOTPData) {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          data: {
            // Additional user data can be added here
          },
        },
      });

      if (error) throw error;

      // Log OTP send attempt
      errorHandling.captureMessage('Email OTP sent successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          email:
            email.substring(0, 3) + '***' + email.substring(email.indexOf('@')), // Log masked email for privacy
        },
      });

      return data;
    } catch (error) {
      console.error('Send OTP error:', error);

      // Log OTP send error
      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Send OTP failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'send_email_otp',
            email:
              email.substring(0, 3) +
              '***' +
              email.substring(email.indexOf('@')),
          },
        }
      );

      throw error;
    }
  }

  /**
   * Verify OTP and complete authentication
   */
  async verifyOTP({ email, token }: VerifyOTPData) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      });

      if (error) throw error;

      // Create or update user profile in our users table
      if (data.user && !error) {
        const { error: profileError } = await supabase.from('users').upsert(
          {
            id: data.user.id,
            email: data.user.email!,
            email_confirmed_at: data.user.email_confirmed_at,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'id',
          }
        );

        if (profileError) {
          console.error('Error updating user profile:', profileError);
          errorHandling.captureError(profileError, {
            severity: ErrorSeverity.ERROR,
            category: ErrorCategory.AUTH,
            context: {
              action: 'update_user_profile',
              userId: data.user.id,
            },
          });
        }

        // Create default user preferences if not exists
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('user_id')
          .eq('user_id', data.user.id)
          .single();

        if (!existingPrefs) {
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
            errorHandling.captureError(preferencesError, {
              severity: ErrorSeverity.ERROR,
              category: ErrorCategory.AUTH,
              context: {
                action: 'create_user_preferences',
                userId: data.user.id,
              },
            });
          }
        }

        // Record user session
        await this.recordUserSession(data.user.id);

        // Set user in error handling service
        errorHandling.setUser(data.user.id, data.user.email);
      }

      // Log successful verification
      errorHandling.captureMessage('Email OTP verified successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          email:
            email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
          userId: data.user?.id,
        },
      });

      return data;
    } catch (error) {
      console.error('Verify OTP error:', error);

      // Log verification error
      errorHandling.captureError(
        error instanceof Error
          ? error
          : new AuthError('OTP verification failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'verify_email_otp',
            email:
              email.substring(0, 3) +
              '***' +
              email.substring(email.indexOf('@')),
          },
        }
      );

      throw error;
    }
  }

  /**
   * Sign out
   */
  async signOut() {
    try {
      // End current session in database
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await this.endUserSession(user.id);
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user in error handling service
      errorHandling.clearUser();

      // Log sign out
      errorHandling.captureMessage('User signed out', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          userId: user?.id,
        },
      });
    } catch (error) {
      console.error('Sign out error:', error);

      // Log sign out error
      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Sign out failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'sign_out',
          },
        }
      );

      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Update auth user data
      const authUpdates: any = {};
      if (updates.full_name !== undefined) {
        authUpdates.data = { full_name: updates.full_name };
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } =
          await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // Update user profile in our users table
      const profileUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.full_name !== undefined)
        profileUpdates.full_name = updates.full_name;
      if (updates.avatar_url !== undefined)
        profileUpdates.avatar_url = updates.avatar_url;

      const { error: profileError } = await supabase
        .from('users')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Log profile update
      errorHandling.captureMessage('Profile updated successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          userId: user.id,
        },
      });
    } catch (error) {
      console.error('Update profile error:', error);

      // Log profile update error
      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Profile update failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'update_profile',
          },
        }
      );

      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);

      // Log session error
      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Get session failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'get_session',
          },
        }
      );

      throw error;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);

      // Log user error
      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Get user failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'get_user',
          },
        }
      );

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
      return data.session;
    } catch (error) {
      console.error('Refresh session error:', error);

      // Log refresh error
      errorHandling.captureError(
        error instanceof Error
          ? error
          : new AuthError('Refresh session failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'refresh_session',
          },
        }
      );

      throw error;
    }
  }

  /**
   * Record user session
   */
  private async recordUserSession(userId: string) {
    try {
      const { error } = await supabase.from('user_sessions').insert({
        user_id: userId,
        platform: Platform.OS,
        app_version: '1.0.0', // This should come from app config
      });

      if (error) {
        console.error('Error recording user session:', error);
        errorHandling.captureError(error, {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.AUTH,
          context: {
            action: 'record_user_session',
            userId,
          },
        });
      }
    } catch (error) {
      console.error('Error recording user session:', error);
    }
  }

  /**
   * End user session
   */
  private async endUserSession(userId: string) {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .is('session_end', null);

      if (error) {
        console.error('Error ending user session:', error);
        errorHandling.captureError(error, {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.AUTH,
          context: {
            action: 'end_user_session',
            userId,
          },
        });
      }
    } catch (error) {
      console.error('Error ending user session:', error);
    }
  }
}

// Create singleton instance
export const authService = AuthService.getInstance();
