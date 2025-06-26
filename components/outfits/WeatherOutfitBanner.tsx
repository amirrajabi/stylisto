import { MapPin, RefreshCw, Thermometer } from 'lucide-react-native';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { Shadows } from '../../constants/Shadows';
import { Layout, Spacing } from '../../constants/Spacing';
import { Typography } from '../../constants/Typography';
import { useWeather } from '../../hooks/useWeather';
import { LocationPermissionModal } from '../location/LocationPermissionModal';
import { Button } from '../ui';

interface WeatherOutfitBannerProps {
  onWeatherUpdate?: (weatherData: any) => void;
}

export function WeatherOutfitBanner({
  onWeatherUpdate,
}: WeatherOutfitBannerProps) {
  const {
    weatherData,
    isLoading,
    error,
    permissionStatus,
    isLocationEnabled,
    requestLocationPermission,
    getCurrentWeather,
    clearError,
    refreshWeather,
  } = useWeather();

  const [showPermissionModal, setShowPermissionModal] = useState(false);

  React.useEffect(() => {
    if (weatherData && onWeatherUpdate) {
      onWeatherUpdate({
        temperature: weatherData.temperature,
        conditions: weatherData.conditions,
        precipitation: weatherData.precipitation,
        humidity: weatherData.humidity / 100,
        windSpeed: weatherData.windSpeed,
        location: weatherData.location,
      });
    }
  }, [weatherData, onWeatherUpdate]);

  const handleLocationRequest = () => {
    setShowPermissionModal(true);
  };

  const handlePermissionRequest = async () => {
    const status = await requestLocationPermission();
    if (status.granted) {
      setShowPermissionModal(false);
      await getCurrentWeather();
    }
    return status;
  };

  const handleRefresh = async () => {
    clearError();
    await refreshWeather();
  };

  const getTemperatureColor = (temp: number) => {
    if (temp <= 5) return Colors.info[500];
    if (temp <= 15) return Colors.secondary[400];
    if (temp <= 25) return Colors.success[500];
    if (temp <= 30) return Colors.warning[500];
    return Colors.error[500];
  };

  const formatConditions = (conditions: string) => {
    return conditions.charAt(0).toUpperCase() + conditions.slice(1);
  };

  if (!isLocationEnabled) {
    return (
      <>
        <View style={styles.container}>
          <View style={styles.permissionContainer}>
            <MapPin size={20} color={Colors.primary[500]} />
            <View style={styles.permissionContent}>
              <Text style={styles.permissionTitle}>
                Enable Weather Features
              </Text>
              <Text style={styles.permissionSubtitle}>
                Get outfit recommendations based on your local weather
              </Text>
            </View>
            <Button
              title="Enable"
              onPress={handleLocationRequest}
              size="small"
              style={styles.enableButton}
            />
          </View>
        </View>
        <LocationPermissionModal
          visible={showPermissionModal}
          onClose={() => setShowPermissionModal(false)}
          onRequestPermission={handlePermissionRequest}
          permissionStatus={permissionStatus}
        />
      </>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <RefreshCw size={20} color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Getting weather...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={handleRefresh}
            size="small"
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  if (!weatherData) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Thermometer size={20} color={Colors.primary[500]} />
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Get Weather</Text>
            <Text style={styles.permissionSubtitle}>
              Get current weather for outfit recommendations
            </Text>
          </View>
          <Button
            title="Get Weather"
            onPress={getCurrentWeather}
            size="small"
            style={styles.enableButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weatherContainer}>
        <View style={styles.weatherInfo}>
          <View style={styles.temperatureContainer}>
            <Text
              style={[
                styles.temperature,
                { color: getTemperatureColor(weatherData.temperature) },
              ]}
            >
              {weatherData.temperature}°C
            </Text>
            <Text style={styles.conditions}>
              {formatConditions(weatherData.conditions)}
            </Text>
          </View>
          <View style={styles.locationContainer}>
            <MapPin size={16} color={Colors.text.secondary} />
            <Text style={styles.location}>
              {weatherData.location.city}
              {weatherData.location.country &&
              weatherData.location.country !== 'Unknown'
                ? `, ${weatherData.location.country}`
                : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <RefreshCw
            size={20}
            color={Colors.primary[500]}
            style={isLoading ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface.primary,
    borderRadius: Layout.borderRadius.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    ...Shadows.sm,
  },
  permissionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  permissionContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  permissionTitle: {
    ...Typography.body.medium,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  permissionSubtitle: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  enableButton: {
    minWidth: 80,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
  },
  loadingText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  errorText: {
    ...Typography.body.small,
    color: Colors.error[500],
    flex: 1,
    marginRight: Spacing.sm,
  },
  retryButton: {
    minWidth: 80,
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  temperature: {
    ...Typography.heading.h3,
    fontWeight: '700',
  },
  conditions: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  refreshButton: {
    padding: Spacing.sm,
    borderRadius: Layout.borderRadius.full,
    backgroundColor: Colors.surface.secondary,
  },
  spinning: {
    transform: [{ rotate: '180deg' }],
  },
});
