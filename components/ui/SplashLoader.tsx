import React from 'react';
import { ActivityIndicator, Image, StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/Colors';

interface SplashLoaderProps {
  visible?: boolean;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({
  visible = true,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[700]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Match exact splash screen background
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 200, // Match splash screen logo width
    height: 200,
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
  },
});
