import { Platform } from 'react-native';
import * as Amplitude from '@amplitude/analytics-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorHandling, ErrorSeverity, ErrorCategory } from './errorHandling';
import Constants from 'expo-constants';

// Event categories
export enum EventCategory {
  AUTHENTICATION = 'Authentication',
  WARDROBE = 'Wardrobe',
  OUTFITS = 'Outfits',
  ANALYTICS = 'Analytics',
  CAMERA = 'Camera',
  NAVIGATION = 'Navigation',
  PERFORMANCE = 'Performance',
  USER_PREFERENCES = 'UserPreferences',
  ONBOARDING = 'Onboarding',
  ENGAGEMENT = 'Engagement',
  ERROR = 'Error',
}

// User properties
export enum UserProperty {
  TOTAL_ITEMS = 'total_items',
  TOTAL_OUTFITS = 'total_outfits',
  FAVORITE_ITEMS = 'favorite_items',
  WARDROBE_VALUE = 'wardrobe_value',
  MOST_COMMON_CATEGORY = 'most_common_category',
  MOST_COMMON_COLOR = 'most_common_color',
  MOST_COMMON_BRAND = 'most_common_brand',
  ACCOUNT_AGE_DAYS = 'account_age_days',
  LAST_ACTIVE = 'last_active',
  PLATFORM = 'platform',
  APP_VERSION = 'app_version',
  DEVICE_TYPE = 'device_type',
  OS_VERSION = 'os_version',
  ANALYTICS_OPTED_IN = 'analytics_opted_in',
}

// Conversion funnels
export enum ConversionFunnel {
  REGISTRATION = 'registration_funnel',
  ITEM_UPLOAD = 'item_upload_funnel',
  OUTFIT_GENERATION = 'outfit_generation_funnel',
  ONBOARDING = 'onboarding_funnel',
}

// Funnel steps
export enum FunnelStep {
  // Registration funnel
  REGISTRATION_START = 'registration_start',
  REGISTRATION_FORM_FILLED = 'registration_form_filled',
  REGISTRATION_SUBMITTED = 'registration_submitted',
  REGISTRATION_COMPLETED = 'registration_completed',
  
  // Item upload funnel
  ITEM_UPLOAD_START = 'item_upload_start',
  ITEM_CAMERA_OPENED = 'item_camera_opened',
  ITEM_PHOTO_TAKEN = 'item_photo_taken',
  ITEM_DETAILS_FILLED = 'item_details_filled',
  ITEM_SAVED = 'item_saved',
  
  // Outfit generation funnel
  OUTFIT_GENERATION_START = 'outfit_generation_start',
  OUTFIT_PARAMETERS_SET = 'outfit_parameters_set',
  OUTFIT_GENERATED = 'outfit_generated',
  OUTFIT_SAVED = 'outfit_saved',
  
  // Onboarding funnel
  ONBOARDING_START = 'onboarding_start',
  ONBOARDING_STEP_1 = 'onboarding_step_1',
  ONBOARDING_STEP_2 = 'onboarding_step_2',
  ONBOARDING_STEP_3 = 'onboarding_step_3',
  ONBOARDING_COMPLETED = 'onboarding_completed',
}

// Privacy consent status
export enum ConsentStatus {
  UNKNOWN = 'unknown',
  GRANTED = 'granted',
  DENIED = 'denied',
}

// Analytics service class
class AnalyticsService {
  private static instance: AnalyticsService;
  private isInitialized = false;
  private consentStatus: ConsentStatus = ConsentStatus.UNKNOWN;
  private readonly CONSENT_STORAGE_KEY = '@stylisto_analytics_consent';
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private lastActivityTimestamp = Date.now();
  private userId: string | null = null;
  private userProperties: Record<string, any> = {};
  private readonly API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';
  private readonly ENVIRONMENT = process.env.EXPO_PUBLIC_ENV || 'development';

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Initialize the analytics service
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load consent status
      await this.loadConsentStatus();

      // Initialize Amplitude
      Amplitude.init(this.API_KEY, {
        // Only track events if consent is granted
        trackingOptions: {
          trackEvents: this.consentStatus === ConsentStatus.GRANTED,
          trackingSessionEvents: this.consentStatus === ConsentStatus.GRANTED,
        },
        // Set environment
        logLevel: this.ENVIRONMENT === 'production' ? 0 : 2, // 0: Disable, 2: Debug
        // Use AsyncStorage for persistence
        storageProvider: {
          getItem: async (key) => {
            try {
              return await AsyncStorage.getItem(key);
            } catch (e) {
              return null;
            }
          },
          setItem: async (key, value) => {
            try {
              await AsyncStorage.setItem(key, value);
            } catch (e) {
              // Ignore errors
            }
          },
          remove: async (key) => {
            try {
              await AsyncStorage.removeItem(key);
            } catch (e) {
              // Ignore errors
            }
          },
        },
      });

      // Set default user properties
      this.setDefaultUserProperties();

      // Start session tracking
      this.startSessionTracking();

      this.isInitialized = true;
      console.log('Analytics initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      errorHandling.captureError(
        error instanceof Error ? error : new Error('Failed to initialize analytics'),
        {
          severity: ErrorSeverity.ERROR,
          category: ErrorCategory.ANALYTICS,
        }
      );
    }
  }

  /**
   * Track an event
   */
  trackEvent(
    eventName: string,
    properties?: Record<string, any>,
    options?: {
      category?: EventCategory;
      funnelName?: ConversionFunnel;
      funnelStep?: FunnelStep;
    }
  ) {
    if (!this.isInitialized || this.consentStatus !== ConsentStatus.GRANTED) {
      return;
    }

    try {
      // Update last activity timestamp
      this.lastActivityTimestamp = Date.now();

      // Prepare event properties
      const eventProperties = {
        ...properties,
        category: options?.category || EventCategory.ENGAGEMENT,
        platform: Platform.OS,
        app_version: Constants.expoConfig?.version || '1.0.0',
        environment: this.ENVIRONMENT,
      };

      // Add funnel information if provided
      if (options?.funnelName && options?.funnelStep) {
        eventProperties.funnel_name = options.funnelName;
        eventProperties.funnel_step = options.funnelStep;
      }

      // Track the event
      Amplitude.track(eventName, eventProperties);
    } catch (error) {
      console.error(`Failed to track event ${eventName}:`, error);
      errorHandling.captureError(
        error instanceof Error ? error : new Error(`Failed to track event ${eventName}`),
        {
          severity: ErrorSeverity.WARNING,
          category: ErrorCategory.ANALYTICS,
          context: {
            eventName,
            properties,
          },
        }
      );
    }
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string | null) {
    if (!this.isInitialized) {
      this.userId = userId;
      return;
    }

    try {
      this.userId = userId;
      
      if (userId) {
        Amplitude.setUserId(userId);
      } else {
        Amplitude.reset();
      }
    } catch (error) {
      console.error('Failed to set user ID:', error);
    }
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: Record<string, any>) {
    if (!this.isInitialized || this.consentStatus !== ConsentStatus.GRANTED) {
      // Store properties for when consent is granted
      this.userProperties = { ...this.userProperties, ...properties };
      return;
    }

    try {
      // Store properties locally
      this.userProperties = { ...this.userProperties, ...properties };
      
      // Set user properties in Amplitude
      Amplitude.identify(
        Object.entries(properties).reduce((identify, [key, value]) => {
          return identify.set(key, value);
        }, new Amplitude.Identify())
      );
    } catch (error) {
      console.error('Failed to set user properties:', error);
    }
  }

  /**
   * Track a screen view
   */
  trackScreenView(screenName: string, properties?: Record<string, any>) {
    this.trackEvent('screen_view', {
      screen_name: screenName,
      ...properties,
    }, {
      category: EventCategory.NAVIGATION,
    });
  }

  /**
   * Track a conversion funnel step
   */
  trackFunnelStep(
    funnelName: ConversionFunnel,
    step: FunnelStep,
    properties?: Record<string, any>
  ) {
    const eventName = `funnel_step_${step}`;
    
    this.trackEvent(eventName, properties, {
      category: EventCategory.ENGAGEMENT,
      funnelName,
      funnelStep: step,
    });
  }

  /**
   * Track an error
   */
  trackError(
    errorName: string,
    errorMessage: string,
    properties?: Record<string, any>
  ) {
    this.trackEvent('error', {
      error_name: errorName,
      error_message: errorMessage,
      ...properties,
    }, {
      category: EventCategory.ERROR,
    });
  }

  /**
   * Set user consent status
   */
  async setConsentStatus(status: ConsentStatus) {
    this.consentStatus = status;
    
    // Save consent status
    await AsyncStorage.setItem(this.CONSENT_STORAGE_KEY, status);
    
    if (this.isInitialized) {
      // Update tracking options
      Amplitude.setTrackingOptions({
        trackEvents: status === ConsentStatus.GRANTED,
        trackingSessionEvents: status === ConsentStatus.GRANTED,
      });
      
      // If consent is granted, set user properties
      if (status === ConsentStatus.GRANTED && Object.keys(this.userProperties).length > 0) {
        this.setUserProperties(this.userProperties);
      }
      
      // Track consent status change
      if (status === ConsentStatus.GRANTED) {
        this.trackEvent('analytics_opt_in', {}, { category: EventCategory.ANALYTICS });
      } else {
        this.trackEvent('analytics_opt_out', {}, { category: EventCategory.ANALYTICS });
      }
    }
  }

  /**
   * Get user consent status
   */
  getConsentStatus(): ConsentStatus {
    return this.consentStatus;
  }

  /**
   * Start a new session
   */
  startSession() {
    if (!this.isInitialized || this.consentStatus !== ConsentStatus.GRANTED) {
      return;
    }

    try {
      // Reset session
      Amplitude.setSessionId(Date.now());
      
      // Track session start
      this.trackEvent('session_start', {}, { category: EventCategory.ENGAGEMENT });
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  }

  /**
   * End the current session
   */
  endSession() {
    if (!this.isInitialized || this.consentStatus !== ConsentStatus.GRANTED) {
      return;
    }

    try {
      // Track session end
      this.trackEvent('session_end', {
        session_duration_ms: Date.now() - this.lastActivityTimestamp,
      }, { category: EventCategory.ENGAGEMENT });
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Flush events to ensure they are sent
   */
  async flushEvents() {
    if (!this.isInitialized) {
      return;
    }

    try {
      await Amplitude.flush();
    } catch (error) {
      console.error('Failed to flush events:', error);
    }
  }

  /**
   * Load consent status from storage
   */
  private async loadConsentStatus() {
    try {
      const status = await AsyncStorage.getItem(this.CONSENT_STORAGE_KEY);
      if (status) {
        this.consentStatus = status as ConsentStatus;
      }
    } catch (error) {
      console.error('Failed to load consent status:', error);
    }
  }

  /**
   * Set default user properties
   */
  private setDefaultUserProperties() {
    const defaultProperties = {
      [UserProperty.PLATFORM]: Platform.OS,
      [UserProperty.APP_VERSION]: Constants.expoConfig?.version || '1.0.0',
      [UserProperty.DEVICE_TYPE]: Platform.OS === 'web' ? 'web' : Platform.OS,
      [UserProperty.OS_VERSION]: Platform.Version,
      [UserProperty.ANALYTICS_OPTED_IN]: this.consentStatus === ConsentStatus.GRANTED,
    };

    this.setUserProperties(defaultProperties);
  }

  /**
   * Start session tracking
   */
  private startSessionTracking() {
    // Check for session timeout every minute
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastActivityTimestamp > this.SESSION_TIMEOUT) {
        // End current session
        this.endSession();
        
        // Start new session
        this.startSession();
      }
    }, 60 * 1000); // Check every minute
  }
}

export const analytics = AnalyticsService.getInstance();