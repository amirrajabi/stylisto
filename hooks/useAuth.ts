import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types/auth';
import { Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
        return;
      }

      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ? mapSupabaseUser(session.user) : null,
        loading: false,
      }));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ? mapSupabaseUser(session.user) : null,
          loading: false,
          error: null,
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }

    return data;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
        });

      if (profileError) {
        console.error('Error creating user profile:', profileError);
      }
    }

    return data;
  };

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message, loading: false }));
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setAuthState(prev => ({ ...prev, loading: false }));

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  const updatePassword = async (password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }));
    
    const { error } = await supabase.auth.updateUser({
      password,
    });

    setAuthState(prev => ({ ...prev, loading: false }));

    if (error) {
      setAuthState(prev => ({ ...prev, error: error.message }));
      throw error;
    }
  };

  return {
    ...authState,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };
};

const mapSupabaseUser = (supabaseUser: any): User => ({
  id: supabaseUser.id,
  email: supabaseUser.email,
  full_name: supabaseUser.user_metadata?.full_name,
  avatar_url: supabaseUser.user_metadata?.avatar_url,
  created_at: supabaseUser.created_at,
  updated_at: supabaseUser.updated_at,
});