import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { LoadingOverlay } from '../../components/auth/LoadingOverlay';
import { Colors } from '../../constants/Colors';

export default function AuthCallbackScreen() {
  const { handleOAuthCallback } = useAuth();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the full URL with parameters
        const url = `${window.location.origin}${window.location.pathname}${window.location.search}${window.location.hash}`;
        
        await handleOAuthCallback(url);
        
        // Redirect to main app
        router.replace('/(tabs)');
      } catch (error) {
        console.error('OAuth callback error:', error);
        // Redirect to login with error
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [params, handleOAuthCallback]);

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={true} message="Completing sign in..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});