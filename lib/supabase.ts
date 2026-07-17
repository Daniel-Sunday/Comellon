import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Expo automatically exposes environment variables starting with EXPO_PUBLIC_
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = 
  supabaseUrl !== 'https://placeholder-url.supabase.co' && 
  supabaseAnonKey !== 'placeholder-anon-key' &&
  supabaseUrl.trim().length > 0;

// SSR-Safe storage adapter to avoid "window is not defined" crashes on Node.js server render
const ssrSafeStorage = {
  getItem: async (key: string) => {
    if (typeof window === 'undefined') return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string) => {
    if (typeof window === 'undefined') return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: typeof window !== 'undefined',
    persistSession: true,
    detectSessionInUrl: false, // Disables URL auth checks on mobile, preventing routing loops
  },
});
