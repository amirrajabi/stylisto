import { Platform } from 'react-native';
import type { ProfileUpdateFormData, User } from '../types/auth';
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
  username?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  full_body_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: AuthUser;
}

export interface SignInWithPasswordData {
  email: string;
  password: string;
}

export interface SignUpWithPasswordData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
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
  async signUpWithPassword({
    email,
    password,
    first_name,
    last_name,
  }: SignUpWithPasswordData) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
          },
        },
      });

      if (error) {
        // Handle specific error cases
        if (
          error.message.includes('already registered') ||
          error.message.includes('User already registered')
        ) {
          throw new AuthError(
            'This email address is already registered. Please sign in instead or reset your password.'
          );
        } else if (
          error.message.includes('weak password') ||
          error.message.includes('Password should be')
        ) {
          throw new AuthError(
            'Password is too weak. Please choose a stronger password.'
          );
        } else if (
          error.message.includes('invalid email') ||
          error.message.includes('Invalid email')
        ) {
          throw new AuthError('Please enter a valid email address.');
        } else if (
          error.message.includes('rate limit') ||
          error.message.includes('too many requests')
        ) {
          throw new AuthError(
            'Too many registration attempts. Please wait a moment and try again.'
          );
        } else {
          throw error;
        }
      }

      // Create user profile in users table
      if (data.user) {
        try {
          await this.createUserProfile({
            id: data.user.id,
            email: data.user.email!,
            first_name,
            last_name,
          });
        } catch (profileError) {
          console.warn('Failed to create user profile:', profileError);
          // Don't throw error as auth was successful
        }
      }

      // Log successful signup
      errorHandling.captureMessage('User signed up successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          email:
            email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
          action: 'sign_up_with_password',
        },
      });

      return data;
    } catch (error) {
      console.error('Sign up error:', error);

      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Sign up failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'sign_up_with_password',
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
   * Create user profile in users table
   */
  private async createUserProfile({
    id,
    email,
    first_name,
    last_name,
  }: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
  }) {
    const { error } = await supabase.from('users').insert({
      id,
      email,
      first_name,
      last_name,
      timezone: 'Australia/Sydney',
      preferred_language: 'en',
      preferred_currency: 'AUD',
    });

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword({ email, password }: SignInWithPasswordData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle specific error cases
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          throw new AuthError(
            'Invalid email or password. Please check your credentials and try again.'
          );
        } else if (
          error.message.includes('Email not confirmed') ||
          error.message.includes('email_not_confirmed')
        ) {
          throw new AuthError(
            'Please check your email and click the confirmation link before signing in.'
          );
        } else if (
          error.message.includes('rate limit') ||
          error.message.includes('too many requests')
        ) {
          throw new AuthError(
            'Too many login attempts. Please wait a moment and try again.'
          );
        } else {
          throw error;
        }
      }

      // Log successful sign in
      errorHandling.captureMessage('User signed in successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          action: 'sign_in_with_password',
          userId: data.user?.id,
          additionalData: {
            email:
              email.substring(0, 3) +
              '***' +
              email.substring(email.indexOf('@')),
          },
        },
      });

      // Set user in error handling service
      if (data.user) {
        errorHandling.setUser(data.user.id, data.user.email);
        await this.recordUserSession(data.user.id);
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);

      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Sign in failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'sign_in_with_password',
            additionalData: {
              email:
                email.substring(0, 3) +
                '***' +
                email.substring(email.indexOf('@')),
            },
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
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/verify?type=recovery&redirect_to=${process.env.EXPO_PUBLIC_REDIRECT_URL}`,
      });

      if (error) throw error;

      // Log password reset request
      errorHandling.captureMessage('Password reset requested', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          action: 'reset_password',
          email:
            email.substring(0, 3) + '***' + email.substring(email.indexOf('@')),
        },
      });

      return data;
    } catch (error) {
      console.error('Reset password error:', error);

      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Password reset failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'reset_password',
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
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new AuthError('No authenticated user');
      }

      // Update auth metadata if needed
      const authUpdates: any = {};
      if (updates.first_name !== undefined) {
        authUpdates.first_name = updates.first_name;
      }
      if (updates.last_name !== undefined) {
        authUpdates.last_name = updates.last_name;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates,
        });

        if (authError) throw authError;
      }

      // Update user table
      const userUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.first_name !== undefined) {
        userUpdates.first_name = updates.first_name;
      }
      if (updates.last_name !== undefined) {
        userUpdates.last_name = updates.last_name;
      }
      if (updates.avatar_url !== undefined) {
        userUpdates.avatar_url = updates.avatar_url;
      }

      const { error: dbError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id);

      if (dbError) throw dbError;

      // Log profile update
      errorHandling.captureMessage('Profile updated successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          userId: user.id,
          additionalData: {
            updatedFields: Object.keys(updates),
          },
        },
      });
    } catch (error) {
      console.error('Profile update error:', error);

      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Profile update failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'update_profile',
            additionalData: {
              updatedFields: Object.keys(updates),
            },
          },
        }
      );

      throw error;
    }
  }

  /**
   * Update user profile with comprehensive fields
   */
  async updateUserProfile(updates: ProfileUpdateFormData) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new AuthError('No authenticated user');
      }

      // Update user table with all supported fields
      const userUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      // Personal Information
      if (updates.first_name !== undefined)
        userUpdates.first_name = updates.first_name;
      if (updates.last_name !== undefined)
        userUpdates.last_name = updates.last_name;
      if (updates.username !== undefined)
        userUpdates.username = updates.username;
      if (updates.date_of_birth !== undefined)
        userUpdates.date_of_birth = updates.date_of_birth;
      if (updates.gender !== undefined) userUpdates.gender = updates.gender;
      if (updates.phone !== undefined) userUpdates.phone = updates.phone;
      if (updates.avatar_url !== undefined)
        userUpdates.avatar_url = updates.avatar_url;

      // Location
      if (updates.country !== undefined) userUpdates.country = updates.country;
      if (updates.city !== undefined) userUpdates.city = updates.city;
      if (updates.timezone !== undefined)
        userUpdates.timezone = updates.timezone;

      // Preferences
      if (updates.preferred_language !== undefined)
        userUpdates.preferred_language = updates.preferred_language;
      if (updates.preferred_currency !== undefined)
        userUpdates.preferred_currency = updates.preferred_currency;

      // Body measurements
      if (updates.height_cm !== undefined)
        userUpdates.height_cm = updates.height_cm;
      if (updates.weight_kg !== undefined)
        userUpdates.weight_kg = updates.weight_kg;
      if (updates.clothing_size_top !== undefined)
        userUpdates.clothing_size_top = updates.clothing_size_top;
      if (updates.clothing_size_bottom !== undefined)
        userUpdates.clothing_size_bottom = updates.clothing_size_bottom;
      if (updates.clothing_size_shoes !== undefined)
        userUpdates.clothing_size_shoes = updates.clothing_size_shoes;
      if (updates.body_type !== undefined)
        userUpdates.body_type = updates.body_type;

      // Bio and social
      if (updates.bio !== undefined) userUpdates.bio = updates.bio;
      if (updates.website_url !== undefined)
        userUpdates.website_url = updates.website_url;

      // Full body image for outfit try-on (only if column exists)
      if (updates.full_body_image_url !== undefined) {
        try {
          userUpdates.full_body_image_url = updates.full_body_image_url;
        } catch (error) {
          console.warn('full_body_image_url column not found, skipping update');
        }
      }

      // First try to update existing profile
      const { data, error: dbError } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (dbError) {
        // If no rows affected, it might mean the profile doesn't exist
        if (dbError.code === 'PGRST116') {
          // User profile doesn't exist, try to create it with minimal required fields
          const basicProfile = {
            id: user.id,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...userUpdates,
          };

          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(basicProfile)
            .select()
            .single();

          if (insertError) {
            console.error('Failed to create user profile:', insertError);
            throw insertError;
          }

          return insertData;
        }
        throw dbError;
      }

      // Update auth metadata for basic fields
      const authUpdates: any = {};
      if (updates.first_name !== undefined) {
        authUpdates.first_name = updates.first_name;
      }
      if (updates.last_name !== undefined) {
        authUpdates.last_name = updates.last_name;
      }
      if (updates.avatar_url !== undefined) {
        authUpdates.avatar_url = updates.avatar_url;
      }

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({
          data: authUpdates,
        });

        if (authError) {
          console.warn('Failed to update auth metadata:', authError);
        }
      }

      // Log profile update
      errorHandling.captureMessage('User profile updated successfully', {
        severity: ErrorSeverity.INFO,
        category: ErrorCategory.AUTH,
        context: {
          userId: user.id,
          additionalData: {
            updatedFields: Object.keys(updates),
          },
        },
      });

      return data;
    } catch (error) {
      console.error('Profile update error:', error);

      errorHandling.captureError(
        error instanceof Error ? error : new AuthError('Profile update failed'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.AUTH,
          context: {
            action: 'update_user_profile',
            additionalData: {
              updatedFields: Object.keys(updates),
            },
          },
        }
      );

      throw error;
    }
  }

  /**
   * Get user profile from users table
   */
  async getUserProfile(): Promise<User | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user profile doesn't exist
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
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
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();

      if (error) throw error;

      return session;
    } catch (error) {
      console.error('Refresh session error:', error);
      throw error;
    }
  }

  /**
   * Public method to record user session (for use in auth state changes)
   */
  async recordSession(userId?: string) {
    try {
      let userIdToRecord = userId;

      if (!userIdToRecord) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          console.warn('No user found to record session for');
          return;
        }
        userIdToRecord = user.id;
      }

      await this.recordUserSession(userIdToRecord);
    } catch (error) {
      console.error('Error in public recordSession:', error);
    }
  }

  /**
   * Record user session start
   */
  private async recordUserSession(userId: string) {
    try {
      // Use the direct approach to record session
      await this.recordUserSessionFallback(userId);
    } catch (error) {
      console.error('Record session error:', error);
    }
  }

  /**
   * Fallback method to record user session manually
   */
  private async recordUserSessionFallback(userId: string) {
    try {
      // First check if user exists in users table
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking user existence:', userCheckError);
        return;
      }

      // If user doesn't exist, try to create user profile from auth.users
      if (!existingUser) {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !authUser) {
          console.error('Error getting auth user:', authError);
          return;
        }

        // Create user profile
        const { error: createUserError } = await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email || '',
          first_name: authUser.user_metadata?.first_name || null,
          last_name: authUser.user_metadata?.last_name || null,
          avatar_url: authUser.user_metadata?.avatar_url || null,
        });

        if (createUserError) {
          console.error('Error creating user profile:', createUserError);
          return;
        }
      }

      // Now record the session
      const { error } = await supabase.from('user_sessions').insert({
        user_id: userId,
        platform: Platform.OS,
        app_version: '1.0.0', // TODO: Get from app config
      });

      if (error) {
        console.error('Error recording user session (fallback):', error);
      }
    } catch (error) {
      console.error('Record session fallback error:', error);
    }
  }

  /**
   * Record user session end
   */
  private async endUserSession(userId: string) {
    try {
      // Check if user exists first
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('Error checking user existence:', userCheckError);
        return;
      }

      // If user doesn't exist, we can't end a session
      if (!existingUser) {
        console.warn(
          'User not found in users table, cannot end session:',
          userId
        );
        return;
      }

      // Find the most recent session without an end time
      const { data: sessions, error: fetchError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('session_end', null)
        .order('session_start', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error('Error fetching user session:', fetchError);
        return;
      }

      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const sessionEnd = new Date();
        const sessionStart = new Date(session.session_start);
        const durationMinutes = Math.round(
          (sessionEnd.getTime() - sessionStart.getTime()) / (1000 * 60)
        );

        const { error: updateError } = await supabase
          .from('user_sessions')
          .update({
            session_end: sessionEnd.toISOString(),
            duration_minutes: durationMinutes,
          })
          .eq('id', session.id);

        if (updateError) {
          console.error('Error updating user session:', updateError);
        }
      }
    } catch (error) {
      console.error('End session error:', error);
    }
  }
}

export const authService = AuthService.getInstance();
