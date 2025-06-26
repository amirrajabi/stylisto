import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Location from 'expo-location';

export interface WeatherData {
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  location: {
    city: string;
    country: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  timestamp: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.LocationPermissionResponse['status'];
}

class WeatherService {
  private static instance: WeatherService;
  private apiKey: string;
  private baseUrl = 'https://api.openweathermap.org/data/2.5';
  private locationPermissionCache: LocationPermissionStatus | null = null;
  private weatherCache: Map<string, { data: WeatherData; expiry: number }> =
    new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private constructor() {
    this.apiKey =
      Constants.expoConfig?.extra?.weatherApiKey ||
      process.env.WEATHER_API_KEY ||
      process.env.EXPO_PUBLIC_WEATHER_API_KEY ||
      '';

    if (__DEV__) {
      console.log('🔑 Weather API Key configured:', this.apiKey ? 'Yes' : 'No');
      if (!this.apiKey) {
        console.error('❌ Weather API Key not found! Check your .env file');
      }
    }
  }

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } =
        await Location.requestForegroundPermissionsAsync();

      const permissionStatus: LocationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.locationPermissionCache = permissionStatus;

      await AsyncStorage.setItem(
        '@location_permission_status',
        JSON.stringify(permissionStatus)
      );

      return permissionStatus;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  async getLocationPermissionStatus(): Promise<LocationPermissionStatus> {
    if (this.locationPermissionCache) {
      return this.locationPermissionCache;
    }

    try {
      const { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();

      const permissionStatus: LocationPermissionStatus = {
        granted: status === 'granted',
        canAskAgain,
        status,
      };

      this.locationPermissionCache = permissionStatus;
      return permissionStatus;
    } catch (error) {
      console.error('Error getting location permission status:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED,
      };
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const permissionStatus = await this.getLocationPermissionStatus();

      if (!permissionStatus.granted) {
        const newPermissionStatus = await this.requestLocationPermission();
        if (!newPermissionStatus.granted) {
          throw new Error('Location permission denied');
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 100,
      });

      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async getCurrentWeather(): Promise<WeatherData | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('Could not get current location');
      }

      const { latitude, longitude } = location.coords;
      const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;

      const cached = this.weatherCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      const [weatherResponse, reverseGeoResponse] = await Promise.all([
        fetch(
          `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
        ),
        Location.reverseGeocodeAsync({ latitude, longitude }),
      ]);

      if (!weatherResponse.ok) {
        throw new Error(`Weather API error: ${weatherResponse.status}`);
      }

      const weatherData = await weatherResponse.json();
      const reverseGeoData = reverseGeoResponse[0];

      const weatherInfo: WeatherData = {
        temperature: Math.round(weatherData.main.temp),
        conditions: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind?.speed || 0,
        precipitation:
          weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
        location: {
          city: reverseGeoData?.city || weatherData.name || 'Unknown',
          country:
            reverseGeoData?.country || weatherData.sys?.country || 'Unknown',
          coordinates: { latitude, longitude },
        },
        timestamp: Date.now(),
      };

      this.weatherCache.set(cacheKey, {
        data: weatherInfo,
        expiry: Date.now() + this.CACHE_DURATION,
      });

      return weatherInfo;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  async getWeatherByCity(cityName: string): Promise<WeatherData | null> {
    try {
      if (!this.apiKey) {
        throw new Error('Weather API key not configured');
      }

      const cacheKey = `city:${cityName.toLowerCase()}`;
      const cached = this.weatherCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }

      const response = await fetch(
        `${this.baseUrl}/weather?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const weatherData = await response.json();

      const weatherInfo: WeatherData = {
        temperature: Math.round(weatherData.main.temp),
        conditions: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind?.speed || 0,
        precipitation:
          weatherData.rain?.['1h'] || weatherData.snow?.['1h'] || 0,
        location: {
          city: weatherData.name,
          country: weatherData.sys?.country || 'Unknown',
          coordinates: {
            latitude: weatherData.coord.lat,
            longitude: weatherData.coord.lon,
          },
        },
        timestamp: Date.now(),
      };

      this.weatherCache.set(cacheKey, {
        data: weatherInfo,
        expiry: Date.now() + this.CACHE_DURATION,
      });

      return weatherInfo;
    } catch (error) {
      console.error('Error fetching weather data by city:', error);
      return null;
    }
  }

  clearCache(): void {
    this.weatherCache.clear();
  }

  isApiKeyConfigured(): boolean {
    return !!this.apiKey;
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.weatherCache.size,
      keys: Array.from(this.weatherCache.keys()),
    };
  }
}

export const weatherService = WeatherService.getInstance();
