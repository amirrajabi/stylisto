import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { authService, AuthUser } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { ProfileUpdateFormData, User } from '../types/auth';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    isAuthenticated: false,
  });

  // Get user profile from users table
  const getUserProfile = useCallback(async (): Promise<User | null> => {
    try {
      return await authService.getUserProfile();
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await authService.getSession();

        if (mounted) {
          let userProfile: User | null = null;

          if (session?.user) {
            // Try to get full user profile from users table
            userProfile = await getUserProfile();

            // If no profile exists, create one (for existing users)
            if (!userProfile && session.user) {
              userProfile = {
                id: session.user.id,
                email: session.user.email || '',
                first_name: session.user.user_metadata?.first_name,
                last_name: session.user.user_metadata?.last_name,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at || session.user.created_at,
              };
            }
          }

          setAuthState(prev => ({
            ...prev,
            session,
            user: userProfile,
            isAuthenticated: !!session?.user,
            loading: false,
            error: null,
          }));
        }
      } catch (error: any) {
        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log('Auth state changed:', event, session?.user?.email);

      let userProfile: User | null = null;

      if (session?.user) {
        // Try to get full user profile from users table
        userProfile = await getUserProfile();
      }

      setAuthState(prev => ({
        ...prev,
        session,
        user: userProfile,
        isAuthenticated: !!session?.user,
        loading: false,
        error: null,
      }));

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
        if (session?.user?.id) {
          try {
            await authService.recordSession(session.user.id);
          } catch (error) {
            console.error('Error recording session on sign in event:', error);
          }
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [getUserProfile]);

  // Update profile using new comprehensive method
  const updateUserProfile = useCallback(
    async (updates: ProfileUpdateFormData) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const updatedProfile = await authService.updateUserProfile(updates);

        // Update local state
        setAuthState(prev => ({
          ...prev,
          user: updatedProfile,
          loading: false,
        }));

        return updatedProfile;
      } catch (error: any) {
        setAuthState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        throw error;
      }
    },
    []
  );

  // Update profile (legacy method for backward compatibility)
  const updateProfile = useCallback(
    async (updates: Partial<AuthUser>) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        await authService.updateProfile(updates);

        // Refresh user profile from database
        const userProfile = await getUserProfile();

        setAuthState(prev => ({
          ...prev,
          user: userProfile,
          loading: false,
        }));
      } catch (error: any) {
        setAuthState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        throw error;
      }
    },
    [getUserProfile]
  );

  // Sign out
  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await authService.signOut();
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Sign up with password
  const signUpWithPassword = useCallback(
    async (data: {
      email: string;
      password: string;
      first_name: string;
      last_name: string;
    }) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await authService.signUpWithPassword(data);
        return result;
      } catch (error: any) {
        setAuthState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        throw error;
      }
    },
    []
  );

  // Sign in with password
  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const result = await authService.signInWithPassword({
          email,
          password,
        });
        return result;
      } catch (error: any) {
        setAuthState(prev => ({
          ...prev,
          error: error.message,
          loading: false,
        }));
        throw error;
      }
    },
    []
  );

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await authService.resetPassword(email);
      setAuthState(prev => ({ ...prev, loading: false }));
      return result;
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (url: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // For OAuth callbacks, we need to handle the URL parameters
      const urlParams = new URLSearchParams(
        url.split('#')[1] || url.split('?')[1]
      );
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');

      if (accessToken && refreshToken) {
        // Set session using the tokens
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) throw error;

        if (data.session) {
          // Session will be set automatically by onAuthStateChange listener
          // which will also record the session
          return data;
        }
      }

      // If no tokens, try to get current session (might already be set)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        return { session: sessionData.session, user: sessionData.session.user };
      }

      throw new Error('No valid session found in OAuth callback');
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
      throw error;
    }
  }, []);

  return {
    ...authState,
    signUpWithPassword,
    signInWithPassword,
    signOut,
    updateUserProfile,
    updateProfile,
    resetPassword,
    handleOAuthCallback,
  };
};

// Helper function to map Supabase user to our AuthUser interface
const mapSupabaseUser = (supabaseUser: SupabaseUser): AuthUser => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  username: supabaseUser.user_metadata?.username,
  first_name: supabaseUser.user_metadata?.first_name,
  last_name: supabaseUser.user_metadata?.last_name,
  avatar_url: supabaseUser.user_metadata?.avatar_url,
  created_at: supabaseUser.created_at,
  updated_at: supabaseUser.updated_at || supabaseUser.created_at,
});
