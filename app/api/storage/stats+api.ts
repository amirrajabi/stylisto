import { supabase } from '../../../lib/supabase';
import { storageService } from '../../../lib/storage';

export async function GET(request: Request) {
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
    
    // Get storage stats
    const stats = await storageService.getStorageStats(userId);

    return new Response(JSON.stringify({
      success: true,
      data: stats,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    
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