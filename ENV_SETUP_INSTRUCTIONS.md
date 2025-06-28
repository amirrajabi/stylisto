# Environment Setup Instructions

This document contains the complete list of environment variables needed to run the Stylisto app.

## Required Environment Variables

Create a `.env` file in the root of your project with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Weather API
EXPO_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key

# Sentry Configuration (for error tracking)
EXPO_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
SENTRY_PROJECT=your_sentry_project_name
SENTRY_ORG=your_sentry_organization

# Virtual Try-On API (FLUX by Black Forest Labs)
EXPO_PUBLIC_FLUX_API_KEY=your_flux_api_key

# GPT-4 Vision API (for clothing analysis)
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key
```

## Getting the API Keys

### Supabase

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project or select existing one
3. Go to Settings > API
4. Copy the Project URL and anon/public key

### OpenWeather API

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your API key from the account dashboard

### Sentry

1. Sign up at [Sentry](https://sentry.io)
2. Create a new project
3. Get the DSN from Settings > Client Keys
4. Create an auth token from Settings > Auth Tokens

### FLUX API

1. Sign up at [Black Forest Labs](https://blackforestlabs.ai/)
2. Go to [Dashboard](https://dashboard.bfl.ai/)
3. Generate an API key
4. The key should start with `bfl_sk_` or be in UUID format

### OpenAI API

1. Sign up at [OpenAI](https://platform.openai.com)
2. Go to [API Keys](https://platform.openai.com/api-keys)
3. Create a new API key
4. Make sure you have GPT-4 Vision access

## Example .env file

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Weather
EXPO_PUBLIC_OPENWEATHER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry
EXPO_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENTRY_PROJECT=stylisto
SENTRY_ORG=your-org-name

# Virtual Try-On
EXPO_PUBLIC_FLUX_API_KEY=bfl_sk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AI Vision
EXPO_PUBLIC_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Important Notes

1. Never commit the `.env` file to version control
2. Add `.env` to your `.gitignore` file
3. For production, set these variables in your hosting environment (e.g., EAS Build secrets)
4. The `EXPO_PUBLIC_` prefix is required for variables that need to be accessible in the React Native app
5. Variables without the prefix are only accessible during build time

## Testing Your Setup

After setting up your environment variables, test them by running:

```bash
npm start
```

Check the console for any missing environment variable warnings.
