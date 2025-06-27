# Environment Setup Instructions

To fix the API errors and configure your project properly, create a `.env.local` file in the project root with the following content:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
EXPO_PUBLIC_REDIRECT_URL=stylisto://

# Weather API
EXPO_PUBLIC_WEATHER_API_KEY=your_weather_api_key
WEATHER_API_KEY=your_weather_api_key

# Analytics
EXPO_PUBLIC_AMPLITUDE_API_KEY=your_amplitude_api_key

# Environment
EXPO_PUBLIC_ENV=development

# Sentry (Error Reporting)
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
EXPO_PUBLIC_SENTRY_URL=your_sentry_url

# FLUX API for Virtual Try-On (Get from https://dashboard.bfl.ai/)
# IMPORTANT: API key can be either UUID format or "bfl_sk_" prefix format
# Get your API key from: https://dashboard.bfl.ai/
EXPO_PUBLIC_FLUX_API_KEY=your_actual_flux_api_key_here

# Google Cloud Vision API
GOOGLE_CLOUD_VISION_API_KEY=your_google_vision_api_key

# App Configuration
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## To fix FLUX API 403 errors:

1. Visit https://dashboard.bfl.ai/ and sign up for a Black Forest Labs account
2. Create an API key from the dashboard
3. Copy your API key and replace `your_actual_flux_api_key_here` in your .env file
4. Ensure the API key format is correct (either UUID or "bfl*sk*" prefix)
5. Restart your Expo development server

## Common API Key Issues:

✅ **UUID Format**: Keys like "1c7de010-b634-4042-a7e0-1b7379252db8" (current format)
✅ **BFL Format**: Keys like "bfl_sk_1234567890abcdef..." (legacy format)  
❌ **Invalid Format**: Random strings or incomplete keys will cause 403 errors
❌ **Wrong Endpoint**: Old endpoint `api.bfl.ml` is deprecated - now uses `api.blackforestlabs.ai`

## Quick Fix for Testing:

For immediate testing, the app is configured to use a mock FLUX API response when no key is provided or when using the test key `bfl_sk_test_1234567890abcdef`.

## Fixed Issues:

✅ **Native Module Errors**: Replaced `@react-native-community/datetimepicker` with Expo Go compatible date picker
✅ **Image Fallback Warnings**: Updated `virtualTryOn.ts` to use `expo-image-manipulator` instead of React Native Image.getSize
✅ **Expo Go Compatibility**: All components now use Expo SDK packages

The app should now run properly in Expo Go without the "Invariant Violation" errors.

# Environment Setup Instructions for Stylisto

## Black Forest Labs (FLUX) API Configuration

### 1. Get Your API Key

1. Go to [Black Forest Labs Dashboard](https://dashboard.bfl.ai/)
2. Sign up or log in to your account
3. Create a new API key (it will look like either `bfl_sk_...` or a UUID format like `1c7de010-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Set Up Environment Variables

Create a `.env` file in the project root directory with your API key:

```bash
# Black Forest Labs API Key for Virtual Try-On
EXPO_PUBLIC_FLUX_API_KEY=your-api-key-here
```

Replace `your-api-key-here` with your actual API key from the dashboard.

### 3. Available Models & Pricing

Based on your API key, you can use these models:

- **flux-kontext-pro**: $0.04 per image - Best for editing and virtual try-on
- **flux-kontext-max**: $0.08 per image - Maximum quality
- **flux-pro-1.1**: $0.04 per image - Standard generation
- **flux-dev**: $0.025 per image - Development/testing

### 4. Troubleshooting

If you're getting "Network request failed" errors:

1. **Verify your API key is correctly set in `.env`**
   - Make sure there are no extra spaces or quotes
   - Restart your Expo development server after adding the key

2. **Check that you have credits in your Black Forest Labs account**
   - Log in to [dashboard.bfl.ai](https://dashboard.bfl.ai/) and check your balance

3. **Ensure you have an active internet connection**
   - Try accessing https://api.bfl.ml/v1/get_result?id=test in your browser
   - You should see a response (even if it's an error about authentication)

4. **The API uses `https://api.bfl.ml/v1/` as the base URL**
   - Not `blackforestlabs.ai` - this is the correct domain

5. **Common error messages and solutions:**
   - `401/403 Error`: Your API key is invalid or missing credits
   - `429 Error`: Rate limit exceeded, wait a moment before trying again
   - `Network request failed`: Check internet connection or firewall settings
   - `TypeError: Failed to fetch`: Usually a connectivity issue or CORS problem

### 5. Testing Your Setup

After setting up your API key, you can test it by:

1. Running the app: `npx expo start`
2. Going to the Virtual Try-On test screen
3. Trying to generate an image

The console will show debug information about your API key and connection status.

### 6. API Technical Details

The Black Forest Labs API uses:

- **Authentication**: `x-key` header (not `Authorization: Bearer`)
- **Endpoints**:
  - Image generation: `POST https://api.bfl.ml/v1/{model-name}`
  - Result polling: `GET https://api.bfl.ml/v1/get_result?id={task-id}`
- **Response format**: Returns a task ID that you poll for results
- **Status values**: `Ready` when complete, `Error` when failed

### 7. Getting Help

If you're still having issues:

1. Check the [BFL API Documentation](https://docs.bfl.ml/)
2. Contact support through the dashboard
3. Ensure your development environment allows outbound HTTPS connections
