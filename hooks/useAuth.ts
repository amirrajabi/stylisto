import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { authService, AuthUser } from '../lib/auth';
import { Session, User } from '@supabase/supabase-js';

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with email and password
  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await authService.signIn({ email, password });
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Sign up with email and password
  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await authService.signUp({ email, password, fullName });
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Sign in with Google
  const signInWithGoogle = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await authService.signInWithGoogle();
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Sign in with Apple
  const signInWithApple = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await authService.signInWithApple();
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
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
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.resetPassword(email);
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authService.updatePassword(password);
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Update user profile
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
        loading: false 
      }));
      throw error;
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const data = await authService.refreshSession();
      return data;
    } catch (error: any) {
      console.error('Failed to refresh session:', error);
      throw error;
    }
  }, []);

  // Handle OAuth callback
  const handleOAuthCallback = useCallback(async (url: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const data = await authService.handleOAuthCallback(url);
      return data;
    } catch (error: any) {
      setAuthState(prev => ({ 
        ...prev, 
        error: error.message, 
        loading: false 
      }));
      throw error;
    }
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    refreshSession,
    handleOAuthCallback,
  };
};

// Helper function to map Supabase user to our AuthUser type
const mapSupabaseUser = (supabaseUser: User): AuthUser => ({
  id: supabaseUser.id,
  email: supabaseUser.email!,
  full_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name,
  avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
  email_confirmed_at: supabaseUser.email_confirmed_at,
  created_at: supabaseUser.created_at,
  updated_at: supabaseUser.updated_at,
});