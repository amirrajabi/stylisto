import * as Sentry from '@sentry/react-native';
import { supabase } from '../../lib/supabase';
import { errorHandling, ErrorSeverity, ErrorCategory } from '../../lib/errorHandling';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    // Parse request body
    const body = await request.json();
    const { error, context, feedback, email } = body;
    
    if (!error) {
      return new Response(JSON.stringify({ error: 'Error details are required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
    
    // Create error object
    const errorObj = new Error(error.message || 'User reported error');
    if (error.stack) {
      errorObj.stack = error.stack;
    }
    if (error.name) {
      errorObj.name = error.name;
    }
    
    // Capture error in Sentry
    Sentry.withScope(scope => {
      // Add user context if available
      if (session?.user) {
        scope.setUser({
          id: session.user.id,
          email: session.user.email,
        });
      }
      
      // Add additional context
      if (context) {
        scope.setContext('error_context', context);
      }
      
      // Add feedback if provided
      if (feedback) {
        scope.setContext('user_feedback', {
          feedback,
          email: email || (session?.user?.email || 'anonymous'),
        });
      }
      
      // Capture the error
      Sentry.captureException(errorObj);
    });
    
    // Also capture with our error handling service
    errorHandling.captureError(errorObj, {
      severity: ErrorSeverity.ERROR,
      category: ErrorCategory.UI,
      context: {
        userId: session?.user?.id,
        email: session?.user?.email,
        ...context,
      },
    });
    
    // If feedback is provided, also capture user feedback
    if (feedback) {
      Sentry.captureUserFeedback({
        email: email || (session?.user?.email || 'anonymous@user.com'),
        name: email ? email.split('@')[0] : (session?.user?.email?.split('@')[0] || 'Anonymous User'),
        comments: feedback,
      });
    }
    
    // Store error in database for analytics
    if (session?.user) {
      await supabase.from('error_logs').insert({
        user_id: session.user.id,
        error_message: error.message,
        error_stack: error.stack,
        error_name: error.name,
        context: context || {},
        feedback: feedback || null,
        platform: Platform.OS,
        app_version: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
      });
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error report API error:', error);
    
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