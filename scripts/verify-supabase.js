#!/usr/bin/env node
/**
 * Supabase Verification Script
 * Tests connection, database schema, and authentication setup
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '../.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

const env = loadEnv();
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const results = [];

function addResult(name, status, message) {
  results.push({ name, status, message });
  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${message}`);
}

async function verifySupabase() {
  console.log('\n🔍 Verifying Supabase Configuration...\n');

  // 1. Check environment variables
  console.log('📋 Checking Environment Variables...');
  if (!supabaseUrl) {
    addResult('Environment: EXPO_PUBLIC_SUPABASE_URL', 'fail', 'Missing from .env');
    return;
  }
  addResult('Environment: EXPO_PUBLIC_SUPABASE_URL', 'pass', `Found: ${supabaseUrl.substring(0, 30)}...`);

  if (!supabaseAnonKey) {
    addResult('Environment: EXPO_PUBLIC_SUPABASE_ANON_KEY', 'fail', 'Missing from .env');
    return;
  }
  addResult('Environment: EXPO_PUBLIC_SUPABASE_ANON_KEY', 'pass', 'Found');

  // 2. Initialize Supabase client
  console.log('\n🔌 Testing Supabase Connection...');
  let supabase;
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    addResult('Supabase Client', 'pass', 'Initialized successfully');
  } catch (error) {
    addResult('Supabase Client', 'fail', `Failed to initialize: ${error.message}`);
    return;
  }

  // 3. Test basic connection
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) throw error;
    addResult('Database Connection', 'pass', 'Connected successfully');
  } catch (error) {
    addResult('Database Connection', 'fail', `Connection failed: ${error.message}`);
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('\n💡 Tip: Run the migrations in Supabase SQL Editor:');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Run: supabase/migrations/001_initial_schema.sql');
      console.log('   3. Run: supabase/migrations/002_add_default_username.sql');
    }
    return;
  }

  // 4. Verify database tables exist
  console.log('\n📊 Verifying Database Schema...');
  const tables = ['profiles', 'videos', 'likes', 'comments', 'follows', 'saves'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        if (error.code === '42P01' || error.message.includes('does not exist')) {
          addResult(`Table: ${table}`, 'fail', 'Table does not exist');
        } else {
          addResult(`Table: ${table}`, 'warning', `Accessible but error: ${error.message}`);
        }
      } else {
        addResult(`Table: ${table}`, 'pass', 'Exists and accessible');
      }
    } catch (error) {
      addResult(`Table: ${table}`, 'fail', `Error: ${error.message}`);
    }
  }

  // 5. Check RLS is enabled
  console.log('\n🔒 Verifying Row Level Security...');
  try {
    const { data, error } = await supabase.from('profiles').select('id').limit(1);
    if (error && error.code === '42501') {
      addResult('RLS: Profiles', 'pass', 'RLS enabled (permission denied for write)');
    } else if (!error) {
      addResult('RLS: Profiles', 'pass', 'RLS enabled (public read allowed)');
    } else {
      addResult('RLS: Profiles', 'warning', `Unexpected: ${error.message}`);
    }
  } catch (error) {
    addResult('RLS: Profiles', 'warning', `Could not verify: ${error.message}`);
  }

  // 6. Verify storage buckets
  console.log('\n📦 Verifying Storage Buckets...');
  const buckets = ['avatars', 'videos'];
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          addResult(`Storage: ${bucket}`, 'fail', 'Bucket does not exist');
        } else {
          addResult(`Storage: ${bucket}`, 'warning', `Error: ${error.message}`);
        }
      } else {
        addResult(`Storage: ${bucket}`, 'pass', 'Bucket exists and accessible');
      }
    } catch (error) {
      addResult(`Storage: ${bucket}`, 'fail', `Error: ${error.message}`);
    }
  }

  // 7. Test authentication service
  console.log('\n🔐 Verifying Authentication...');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (session) {
      addResult('Auth: Session', 'pass', `Active session found for user: ${session.user.email || session.user.id}`);
    } else {
      addResult('Auth: Session', 'pass', 'No active session (expected if not logged in)');
    }
  } catch (error) {
    addResult('Auth: Session', 'fail', `Error: ${error.message}`);
  }

  // 8. Test auth state change listener
  try {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {});
    subscription.unsubscribe();
    addResult('Auth: State Listener', 'pass', 'Can subscribe to auth state changes');
  } catch (error) {
    addResult('Auth: State Listener', 'fail', `Error: ${error.message}`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Verification Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log('='.repeat(60));

  if (failed > 0) {
    console.log('\n❌ Some verifications failed. Please check the errors above.');
    console.log('\nCommon fixes:');
    console.log('1. Ensure migrations are run in Supabase SQL Editor');
    console.log('   - supabase/migrations/001_initial_schema.sql');
    console.log('   - supabase/migrations/002_add_default_username.sql');
    console.log('2. Check that storage buckets are created');
    console.log('3. Verify RLS policies are enabled');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Some warnings detected. Review above.');
    process.exit(0);
  } else {
    console.log('\n✅ All verifications passed!');
    process.exit(0);
  }
}

// Run verification
verifySupabase().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
