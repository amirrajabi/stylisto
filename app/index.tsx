import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SplashLoader } from '../components/ui/SplashLoader';
import { Colors } from '../constants/Colors';
import { useAuth } from '../hooks/useAuth';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loading]);

  if (loading) {
    return <SplashLoader visible={true} />;
  }

  return (
    <View style={styles.container}>
      {/* This should not be visible as navigation happens immediately */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});
