# Virtual Try-On Implementation Guide

## Overview

The Virtual Try-On feature uses Black Forest Labs' FLUX.1 Kontext API to generate realistic images of users wearing different clothing combinations. This guide covers the updated implementation with proper authentication and correct API endpoints.

## API Configuration

### Required Environment Variables

```env
# FLUX API for Virtual Try-On
EXPO_PUBLIC_FLUX_API_KEY=your_actual_flux_api_key_here
```

### Getting Your FLUX API Key

1. Visit [Black Forest Labs Dashboard](https://dashboard.bfl.ai/)
2. Sign up for an account and verify your email
3. Create a new API key in the dashboard
4. Copy the API key to your `.env` file

### Supported Key Formats

- **UUID Format**: `1c7de010-b634-4042-a7e0-1b7379252db8`
- **BFL Format**: `bfl_sk_1234567890abcdef...`

## API Endpoints (Updated - January 2025)

The implementation now uses the correct Black Forest Labs endpoints:

### FLUX.1 Kontext API (Primary)

- **Base URL**: `https://api.blackforestlabs.ai/kontext/v1`
- **Models**: `flux-kontext-pro`, `flux-kontext-max`, `flux-kontext-dev`
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`

### Standard FLUX API (Fallback)

- **Image Generation**: `https://api.blackforestlabs.ai/v1/image_generation`
- **Result Retrieval**: `https://api.blackforestlabs.ai/v1/get_result`
- **Authentication**: Bearer token in Authorization header
- **Content-Type**: `application/json`

## Model Selection

### FLUX.1 Kontext Pro (Default)

- **Use Case**: Fast, high-quality image editing and virtual try-on
- **Speed**: 3-5 seconds at 1MP resolution
- **Features**: Multi-step editing, character consistency
- **Best For**: Real-time virtual try-on applications

### FLUX.1 Kontext Max (High Quality)

- **Use Case**: Maximum quality and prompt adherence
- **Features**: Enhanced typography, sharper details
- **Best For**: Professional-grade results when quality is paramount

### FLUX.1 Kontext Dev (Research)

- **Use Case**: Research and development
- **License**: Non-commercial only
- **Features**: Open-weight 12B parameter model

## Implementation Details

### VirtualTryOnService Architecture

The service implements a robust dual-endpoint strategy:

1. **Primary**: FLUX.1 Kontext API for image editing
2. **Fallback**: Standard FLUX API for image generation

### Key Features

1. **Intelligent Fallback**: Automatically switches to standard API if Kontext fails
2. **Multi-step Editing**: Up to 6 iterations of edits with minimal drift
3. **Character Consistency**: Maintains user appearance across generations
4. **Style Reference**: Uses clothing items as reference images
5. **Error Recovery**: Automatic retries with exponential backoff
6. **Network Resilience**: Comprehensive connectivity testing

### Request Structure

#### FLUX.1 Kontext API

```json
{
  "model": "flux-kontext-pro",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "prompt": "Virtual try-on of red dress, professional photography",
  "guidance_scale": 2.5,
  "safety_tolerance": 2,
  "output_format": "jpeg"
}
```

#### Standard FLUX API (Fallback)

```json
{
  "model": "flux-pro-1.1",
  "prompt": "Virtual try-on of red dress, professional photography",
  "width": 1024,
  "height": 1024,
  "steps": 30,
  "guidance": 3.5,
  "safety_tolerance": 2,
  "output_format": "jpeg",
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "strength": 0.8
}
```

### Response Handling

#### Synchronous Response

```json
{
  "images": [
    {
      "url": "https://example.com/generated-image.jpg",
      "width": 1024,
      "height": 1024
    }
  ]
}
```

#### Asynchronous Response

```json
{
  "id": "task-12345",
  "polling_url": "https://api.blackforestlabs.ai/v1/get_result?id=task-12345"
}
```

### Polling Strategy

- **Timeout**: 2 minutes maximum
- **Interval**: 3 seconds between polls
- **Per-request timeout**: 15 seconds
- **Retry logic**: Network errors are automatically retried

### Error Handling

The implementation handles various error scenarios:

- **401/403**: API key authentication issues
- **429**: Rate limiting with automatic backoff
- **500**: Server errors with retry logic
- **Network errors**: Connectivity issues with fallback

### Mock Data Fallback

When API key is not configured or invalid, the service returns mock data:

- Placeholder images for testing
- Simulated processing delays
- Consistent response format

## Usage Example

```typescript
import { useVirtualTryOn } from '@/hooks/useVirtualTryOn';

const { processOutfitTryOn } = useVirtualTryOn();

const handleVirtualTryOn = async () => {
  try {
    const result = await processOutfitTryOn(
      'outfit-123',
      userImageUri,
      selectedClothingItems,
      progress => {
        console.log(`Progress: ${progress.progress}% - ${progress.message}`);
      }
    );

    console.log('Generated image:', result.generatedImageUrl);
  } catch (error) {
    console.error('Virtual try-on failed:', error);
  }
};
```

## Configuration Options

### Model Selection

```typescript
// In VirtualTryOnService
private readonly DEFAULT_MODEL = 'flux-kontext-pro';
private readonly HIGH_QUALITY_MODEL = 'flux-kontext-max';
```

### Timeout Settings

```typescript
private readonly MAX_RETRIES = 3;
private readonly RETRY_DELAY = 2000; // 2 seconds
```

### API Endpoints

```typescript
private readonly FLUX_BASE_URL = 'https://api.blackforestlabs.ai';
private readonly KONTEXT_BASE_URL = 'https://api.blackforestlabs.ai/kontext/v1';
```

## Troubleshooting

### Common Issues

1. **500 Server Errors**:
   - Fixed in current implementation
   - Now uses correct endpoints and request format
   - Automatic fallback to standard API

2. **Authentication Failures**:
   - Verify API key format (UUID or bfl*sk* prefix)
   - Check key validity at https://dashboard.bfl.ai/

3. **Network Timeouts**:
   - Automatic retry with exponential backoff
   - Fallback to mock data for testing

4. **Image Processing Errors**:
   - Base64 encoding with proper error handling
   - Image optimization for API limits

### Debug Information

The service provides comprehensive logging:

- API key validation and format detection
- Request/response details
- Network connectivity tests
- Polling status updates
- Error context and retry attempts

## Performance Optimization

1. **Image Optimization**: Automatic resizing to 1024x1024 maximum
2. **Request Batching**: Efficient handling of multiple items
3. **Caching**: Mock responses for development
4. **Error Recovery**: Graceful degradation and fallbacks

## Security Considerations

- API keys are validated before use
- Base64 encoding for secure image transmission
- Safety tolerance settings for content filtering
- Error messages don't expose sensitive information

## Recent Updates (January 2025)

- ✅ Fixed 500 server errors by using correct API endpoints
- ✅ Updated to FLUX.1 Kontext API for better image editing
- ✅ Implemented intelligent fallback system
- ✅ Enhanced error handling and retry logic
- ✅ Added comprehensive logging and debugging
- ✅ Improved network resilience and timeout handling
