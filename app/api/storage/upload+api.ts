import { supabase } from '../../../lib/supabase';
import { storageService } from '../../../lib/storage';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    const { imageData, itemType, itemId } = body;
    
    if (!imageData || !itemType) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Validate item type
    if (!['clothing', 'outfit', 'profile'].includes(itemType)) {
      return new Response(JSON.stringify({ error: 'Invalid item type' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // For web: imageData is a data URL
    // Extract base64 data from data URL
    let imageUri = imageData;
    if (imageData.startsWith('data:')) {
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        return new Response(JSON.stringify({ error: 'Invalid image data' }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Create a temporary file URL for web
      const blob = await (await fetch(imageData)).blob();
      imageUri = URL.createObjectURL(blob);
    }

    // Upload image
    const result = await storageService.uploadImage(
      imageUri,
      userId,
      itemType as 'clothing' | 'outfit' | 'profile',
      itemId
    );

    if (result.error) {
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    if (!result.data) {
      return new Response(JSON.stringify({ error: 'Upload failed' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Get public URL
    const publicUrl = storageService.getImageUrl(result.data.path);

    return new Response(JSON.stringify({
      success: true,
      data: {
        path: result.data.path,
        url: publicUrl,
        thumbnailUrl: storageService.getOptimizedImageUrl(result.data.path, 'thumbnail'),
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}