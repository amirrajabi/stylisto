#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise(resolve => {
    rl.question(query, resolve);
  });
}

async function setupEnvironment() {
  console.log('🎨 Welcome to Stylisto setup!');
  console.log(
    'This script will help you configure your environment variables.\n'
  );

  console.log('📝 You need to provide your Supabase project details:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Go to Settings > API');
  console.log('4. Copy your Project URL and anon/public key\n');

  const supabaseUrl = await question('Enter your Supabase Project URL: ');
  const supabaseAnonKey = await question('Enter your Supabase anon key: ');

  const envContent = `# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=${supabaseUrl}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}

# Sentry Configuration (Optional)
EXPO_PUBLIC_SENTRY_DSN=
EXPO_PUBLIC_SENTRY_URL=
SENTRY_AUTH_TOKEN=
`;

  const envPath = path.join(process.cwd(), '.env.local');

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Environment file created successfully at .env.local');
    console.log('🚀 You can now run: npm start or npx expo start');
  } catch (error) {
    console.error('\n❌ Failed to create environment file:', error.message);
    console.log(
      '\n📝 Please create .env.local manually with the following content:'
    );
    console.log(envContent);
  }

  rl.close();
}

if (require.main === module) {
  setupEnvironment().catch(console.error);
}

module.exports = { setupEnvironment };
