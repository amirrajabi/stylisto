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
    const { dryRun = true } = body;
    
    // Run cleanup
    const result = await storageService.cleanupOrphanedFiles(userId, dryRun);

    return new Response(JSON.stringify({
      success: true,
      data: {
        deletedFiles: result.deletedFiles,
        errors: result.errors,
        dryRun,
      },
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    
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