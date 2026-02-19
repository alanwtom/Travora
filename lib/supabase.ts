import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { Platform } from 'react-native';

// From .env / .env.example: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://otffnddjbvmchkwuobli.supabase.co';
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im90ZmZuZGRqYnZtY2hrd3VvYmxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyODIyODYsImV4cCI6MjA4Njg1ODI4Nn0._mTeWfzbvLxtFhKXlNmvMnKDrbE6nHw57yyErxlDYzo';

let _supabase: SupabaseClient<Database> | null = null;

function getSupabaseClient(): SupabaseClient<Database> {
  if (_supabase) return _supabase;

  // On web during SSR (Node.js), window is not defined and AsyncStorage fails.
  // Use a no-op storage for SSR; on client-side it will re-initialize properly.
  const isServer = typeof window === 'undefined';

  const noopStorage = {
    getItem: (_key: string) => Promise.resolve(null),
    setItem: (_key: string, _value: string) => Promise.resolve(),
    removeItem: (_key: string) => Promise.resolve(),
  };

  if (isServer) {
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: noopStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  } else {
    // Dynamically require AsyncStorage only when window exists
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop, receiver) {
    const client = getSupabaseClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
