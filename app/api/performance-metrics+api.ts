import { supabase } from '../../lib/supabase';

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

    // Parse request body
    const body = await request.json();
    const { 
      metrics, 
      component, 
      deviceInfo, 
      timestamp = new Date().toISOString() 
    } = body;
    
    if (!metrics || !component) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Store metrics in database
    const { data, error } = await supabase
      .from('performance_metrics')
      .insert({
        user_id: session.user.id,
        component,
        metrics,
        device_info: deviceInfo,
        timestamp,
      });

    if (error) {
      console.error('Error storing performance metrics:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Performance metrics API error:', error);
    
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

    // Parse query parameters
    const url = new URL(request.url);
    const component = url.searchParams.get('component');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const timeframe = url.searchParams.get('timeframe') || '7d'; // 1d, 7d, 30d
    
    // Calculate date range
    let startDate: Date;
    const now = new Date();
    
    switch (timeframe) {
      case '1d':
        startDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '7d':
      default:
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
    }

    // Build query
    let query = supabase
      .from('performance_metrics')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);
    
    // Add component filter if provided
    if (component) {
      query = query.eq('component', component);
    }
    
    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching performance metrics:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Calculate aggregated metrics
    const aggregatedMetrics = {
      averageRenderTime: 0,
      averageMemoryUsage: 0,
      averageFrameRate: 0,
      slowRenders: 0,
      totalSamples: data.length,
    };
    
    if (data.length > 0) {
      const renderTimes = data.map(item => item.metrics.renderTime || 0);
      const memoryUsages = data.map(item => item.metrics.memoryUsage || 0);
      const frameRates = data.map(item => item.metrics.frameRate || 60);
      
      aggregatedMetrics.averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
      aggregatedMetrics.averageMemoryUsage = memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length;
      aggregatedMetrics.averageFrameRate = frameRates.reduce((a, b) => a + b, 0) / frameRates.length;
      aggregatedMetrics.slowRenders = renderTimes.filter(time => time > 16.67).length; // 60fps threshold
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      aggregated: aggregatedMetrics,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Performance metrics API error:', error);
    
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