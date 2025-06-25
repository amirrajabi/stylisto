import { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';
import { authService, AuthUser } from '../lib/auth';
import { supabase } from '../lib/supabase';

export interface AuthState {
  user: AuthUser | null;
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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const session = await authService.getSession();

        if (mounted) {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session?.user ? mapSupabaseUser(session.user) : null,
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

      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ? mapSupabaseUser(session.user) : null,
        isAuthenticated: !!session?.user,
        loading: false,
        error: null,
      }));

      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        // Clear any app-specific state here
        console.log('User signed out');
      }

      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
        // Record session for all sign-in events (email confirmation, password reset, etc.)
        if (session?.user?.id) {
          try {
            // Record session using AuthService method that handles user creation if needed
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
  }, []);

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

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<AuthUser>) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));

    try {
      await authService.updateProfile(updates);

      // Update local state
      setAuthState(prev => ({
        ...prev,
        user: prev.user ? { ...prev.user, ...updates } : null,
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
  }, []);

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
    updateProfile,
    resetPassword,
    handleOAuthCallback,
  };
};

// Helper function to map Supabase user to our AuthUser interface
const mapSupabaseUser = (supabaseUser: User): AuthUser => ({
  id: supabaseUser.id,
  email: supabaseUser.email || '',
  username: supabaseUser.user_metadata?.username,
  first_name: supabaseUser.user_metadata?.first_name,
  last_name: supabaseUser.user_metadata?.last_name,
  avatar_url: supabaseUser.user_metadata?.avatar_url,
  created_at: supabaseUser.created_at,
  updated_at: supabaseUser.updated_at || supabaseUser.created_at,
});
