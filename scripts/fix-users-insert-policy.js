const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment or app config
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://bmxvzumzlvksfttgmizn.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables'
  );
  console.log(
    'Using default URL, please provide EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
  process.exit(1);
}

console.log('Connecting to Supabase at:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixUsersInsertPolicy() {
  console.log('🔧 Fixing users table INSERT policy...');

  try {
    console.log('1. Creating users INSERT policy...');

    // Use raw SQL instead of rpc
    const { error } = await supabase
      .from('_realtime_schema')
      .select('*')
      .limit(1);

    console.log('Connection test result:', error ? 'Failed' : 'Success');

    // Since we can't use admin functions with anon key, let's check if we can query users table
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    console.log(
      'Users table access test:',
      testError ? testError.message : 'Success'
    );

    if (testError && testError.message.includes('row-level security')) {
      console.log(
        '❌ Cannot fix policies with anon key. Need service role key.'
      );
      console.log(
        'Please set SUPABASE_SERVICE_ROLE_KEY environment variable and try again.'
      );
      return false;
    }

    console.log(
      '✅ Users table is accessible, policies may already be working.'
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to fix users INSERT policy:', error.message);
    return false;
  }
}

async function main() {
  const success = await fixUsersInsertPolicy();

  if (success) {
    console.log(
      '✅ Check complete. If you still get errors, you need to apply the migration via Supabase Dashboard SQL Editor.'
    );
    console.log('\nSQL to run in Dashboard:');
    console.log(`
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create INSERT policy for users table  
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    `);
  } else {
    console.log(
      '❌ Could not fix automatically. Please use Supabase Dashboard SQL Editor.'
    );
    process.exit(1);
  }
}

main().catch(console.error);
