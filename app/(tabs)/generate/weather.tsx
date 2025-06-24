import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Cloud, Thermometer, Wind, Droplets } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData } from '../../../lib/outfitGenerator';
import { Colors } from '../../../constants/Colors';
import { Typography } from '../../../constants/Typography';
import { Spacing, Layout } from '../../../constants/Spacing';
import { H1, BodyMedium, Button } from '../../../components/ui';

// Mock weather data for demonstration
const MOCK_WEATHER: WeatherData = {
  temperature: 22,
  conditions: 'clear',
  precipitation: 0,
  humidity: 0.4,
  windSpeed: 5,
};

export default function WeatherScreen() {
  const [useWeather, setUseWeather] = useState(true);
  const [location, setLocation] = useState('New York, NY');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [apiKey, setApiKey] = useState('');
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const useWeatherSetting = await AsyncStorage.getItem('@use_weather');
        setUseWeather(useWeatherSetting !== 'false');
        
        const savedLocation = await AsyncStorage.getItem('@weather_location');
        if (savedLocation) {
          setLocation(savedLocation);
        }
        
        const useCurrentLocationSetting = await AsyncStorage.getItem('@use_current_location');
        setUseCurrentLocation(useCurrentLocationSetting !== 'false');
        
        const savedApiKey = await AsyncStorage.getItem('@weather_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
        }
        
        // For demo purposes, always set mock weather data
        setWeatherData(MOCK_WEATHER);
      } catch (error) {
        console.error('Failed to load weather settings:', error);
      }
    };
    
    loadSettings();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await AsyncStorage.setItem('@use_weather', useWeather ? 'true' : 'false');
      await AsyncStorage.setItem('@weather_location', location);
      await AsyncStorage.setItem('@use_current_location', useCurrentLocation ? 'true' : 'false');
      
      if (apiKey) {
        await AsyncStorage.setItem('@weather_api_key', apiKey);
      }
      
      Alert.alert('Success', 'Weather settings saved successfully');
      router.back();
    } catch (error) {
      console.error('Failed to save weather settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const handleRefreshWeather = () => {
    // In a real app, this would fetch actual weather data
    // For demo purposes, we'll just use mock data with a slight variation
    setWeatherData({
      ...MOCK_WEATHER,
      temperature: MOCK_WEATHER.temperature + (Math.random() * 4 - 2), // +/- 2 degrees
    });
    
    Alert.alert('Weather Updated', 'Weather data has been refreshed');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <H1>Weather Settings</H1>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Toggle */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Use Weather for Outfits</Text>
              <Text style={styles.settingDescription}>
                Generate outfits based on current weather conditions
              </Text>
            </View>
            <Switch
              value={useWeather}
              onValueChange={setUseWeather}
              trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {useWeather && (
          <>
            {/* Location Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Location Settings</Text>
              </View>
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Use Current Location</Text>
                  <Text style={styles.settingDescription}>
                    Automatically detect your location
                  </Text>
                </View>
                <Switch
                  value={useCurrentLocation}
                  onValueChange={setUseCurrentLocation}
                  trackColor={{ false: Colors.neutral[300], true: Colors.primary[500] }}
                  thumbColor={Colors.white}
                />
              </View>
              
              {!useCurrentLocation && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter city name"
                    placeholderTextColor={Colors.text.tertiary}
                  />
                </View>
              )}
            </View>

            {/* Current Weather */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Cloud size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Current Weather</Text>
              </View>
              
              {weatherData ? (
                <View style={styles.weatherCard}>
                  <View style={styles.weatherHeader}>
                    <Text style={styles.weatherLocation}>
                      {useCurrentLocation ? 'Current Location' : location}
                    </Text>
                    <TouchableOpacity
                      style={styles.refreshButton}
                      onPress={handleRefreshWeather}
                    >
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.weatherDetails}>
                    <View style={styles.weatherDetail}>
                      <Thermometer size={20} color={Colors.text.secondary} />
                      <Text style={styles.weatherValue}>
                        {weatherData.temperature.toFixed(1)}°C
                      </Text>
                      <Text style={styles.weatherLabel}>Temperature</Text>
                    </View>
                    
                    <View style={styles.weatherDetail}>
                      <Cloud size={20} color={Colors.text.secondary} />
                      <Text style={styles.weatherValue}>
                        {weatherData.conditions}
                      </Text>
                      <Text style={styles.weatherLabel}>Conditions</Text>
                    </View>
                    
                    <View style={styles.weatherDetail}>
                      <Wind size={20} color={Colors.text.secondary} />
                      <Text style={styles.weatherValue}>
                        {weatherData.windSpeed} km/h
                      </Text>
                      <Text style={styles.weatherLabel}>Wind</Text>
                    </View>
                    
                    <View style={styles.weatherDetail}>
                      <Droplets size={20} color={Colors.text.secondary} />
                      <Text style={styles.weatherValue}>
                        {(weatherData.humidity * 100).toFixed(0)}%
                      </Text>
                      <Text style={styles.weatherLabel}>Humidity</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.noWeatherContainer}>
                  <Text style={styles.noWeatherText}>
                    Weather data not available
                  </Text>
                  <Button
                    title="Refresh Weather"
                    variant="outline"
                    onPress={handleRefreshWeather}
                    style={styles.noWeatherButton}
                  />
                </View>
              )}
            </View>

            {/* API Settings */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Cloud size={20} color={Colors.text.primary} />
                <Text style={styles.sectionTitle}>Weather API Settings</Text>
              </View>
              
              <BodyMedium color="secondary" style={styles.sectionDescription}>
                Enter your weather API key to enable real-time weather data.
              </BodyMedium>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>API Key (Optional)</Text>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="Enter weather API key"
                  placeholderTextColor={Colors.text.tertiary}
                  secureTextEntry
                />
              </View>
              
              <Text style={styles.apiNote}>
                We support OpenWeatherMap and WeatherAPI. Your API key is stored securely on your device.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Save Settings"
          onPress={handleSaveSettings}
          style={styles.saveButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  section: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
  },
  sectionDescription: {
    marginBottom: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  inputContainer: {
    marginTop: Spacing.md,
  },
  inputLabel: {
    ...Typography.body.small,
    color: Colors.text.primary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border.primary,
    borderRadius: Layout.borderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    ...Typography.body.medium,
    color: Colors.text.primary,
  },
  apiNote: {
    ...Typography.caption.medium,
    color: Colors.text.tertiary,
    marginTop: Spacing.sm,
  },
  weatherCard: {
    backgroundColor: Colors.surface.secondary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  weatherLocation: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  refreshButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary[50],
    borderRadius: Layout.borderRadius.md,
  },
  refreshButtonText: {
    ...Typography.caption.medium,
    color: Colors.primary[700],
  },
  weatherDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  weatherDetail: {
    width: '48%',
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  weatherValue: {
    ...Typography.heading.h4,
    color: Colors.text.primary,
    marginVertical: Spacing.xs,
  },
  weatherLabel: {
    ...Typography.caption.medium,
    color: Colors.text.secondary,
  },
  noWeatherContainer: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  noWeatherText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
  },
  noWeatherButton: {
    minWidth: 200,
  },
  footer: {
    padding: Spacing.md,
    backgroundColor: Colors.surface.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
  },
  saveButton: {
    width: '100%',
  },
});