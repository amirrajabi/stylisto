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

  return {
    ...authState,
    signUpWithPassword,
    signInWithPassword,
    signOut,
    updateProfile,
    resetPassword,
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
