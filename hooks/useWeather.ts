import { useCallback, useEffect, useState } from 'react';
import {
  LocationPermissionStatus,
  WeatherData,
  weatherService,
} from '../lib/weatherService';

export interface UseWeatherReturn {
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: LocationPermissionStatus | null;
  isLocationEnabled: boolean;
  requestLocationPermission: () => Promise<LocationPermissionStatus>;
  getCurrentWeather: () => Promise<void>;
  getWeatherByCity: (city: string) => Promise<void>;
  clearError: () => void;
  refreshWeather: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] =
    useState<LocationPermissionStatus | null>(null);

  const checkPermissionStatus = useCallback(async () => {
    try {
      const status = await weatherService.getLocationPermissionStatus();
      setPermissionStatus(status);
      return status;
    } catch (err) {
      console.error('Error checking permission status:', err);
      return null;
    }
  }, []);

  const requestLocationPermission =
    useCallback(async (): Promise<LocationPermissionStatus> => {
      try {
        setIsLoading(true);
        setError(null);

        const status = await weatherService.requestLocationPermission();
        setPermissionStatus(status);

        if (!status.granted) {
          setError(
            'Location permission is required to get weather data for your current location'
          );
        }

        return status;
      } catch (err) {
        const errorMessage = 'Failed to request location permission';
        setError(errorMessage);
        console.error(errorMessage, err);

        return {
          granted: false,
          canAskAgain: false,
          status: 'denied' as any,
        };
      } finally {
        setIsLoading(false);
      }
    }, []);

  const getCurrentWeather = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!weatherService.isApiKeyConfigured()) {
        throw new Error('Weather API key is not configured');
      }

      const permission = permissionStatus || (await checkPermissionStatus());

      if (!permission?.granted) {
        const newPermission = await requestLocationPermission();
        if (!newPermission.granted) {
          throw new Error('Location permission denied');
        }
      }

      const weather = await weatherService.getCurrentWeather();

      if (!weather) {
        throw new Error('Failed to fetch weather data');
      }

      setWeatherData(weather);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get current weather';
      setError(errorMessage);
      console.error('Error getting current weather:', err);
    } finally {
      setIsLoading(false);
    }
  }, [permissionStatus, checkPermissionStatus, requestLocationPermission]);

  const getWeatherByCity = useCallback(async (city: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      if (!weatherService.isApiKeyConfigured()) {
        throw new Error('Weather API key is not configured');
      }

      if (!city.trim()) {
        throw new Error('City name is required');
      }

      const weather = await weatherService.getWeatherByCity(city);

      if (!weather) {
        throw new Error(`Failed to fetch weather data for ${city}`);
      }

      setWeatherData(weather);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get weather by city';
      setError(errorMessage);
      console.error('Error getting weather by city:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshWeather = useCallback(async (): Promise<void> => {
    weatherService.clearCache();

    if (weatherData?.location.coordinates) {
      await getCurrentWeather();
    }
  }, [weatherData, getCurrentWeather]);

  useEffect(() => {
    checkPermissionStatus();
  }, [checkPermissionStatus]);

  return {
    weatherData,
    isLoading,
    error,
    permissionStatus,
    isLocationEnabled: permissionStatus?.granted || false,
    requestLocationPermission,
    getCurrentWeather,
    getWeatherByCity,
    clearError,
    refreshWeather,
  };
}
