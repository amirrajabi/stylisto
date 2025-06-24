import { supabase } from '../../lib/supabase';

export async function GET(request: Request) {
  try {
    // Check database connection
    const { data, error } = await supabase.from('health_checks').select('*').limit(1);
    
    if (error) {
      throw error;
    }
    
    // Return health status
    return new Response(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.EXPO_PUBLIC_ENV || 'development',
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    // Return error status
    return new Response(JSON.stringify({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

export function HEAD(request: Request) {
  // Lightweight health check for monitoring
  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}