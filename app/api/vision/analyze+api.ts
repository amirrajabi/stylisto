import { supabase } from '../../../lib/supabase';
import { visionAIService } from '../../../lib/visionAI';

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

    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Vision API key not configured' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Set API key
    visionAIService.setApiKey(apiKey);
    
    // Parse request body
    const body = await request.json();
    const { imageData } = body;
    
    if (!imageData) {
      return new Response(JSON.stringify({ error: 'Missing image data' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // For web: imageData is a data URL
    // For native: imageData is a file URI
    let imageUri = imageData;
    if (imageData.startsWith('data:')) {
      // Create a temporary file URL for web
      const blob = await (await fetch(imageData)).blob();
      imageUri = URL.createObjectURL(blob);
    }

    // Analyze the image
    const result = await visionAIService.analyzeClothing(imageUri);

    return new Response(JSON.stringify({
      success: true,
      data: result,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Vision API error:', error);
    
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