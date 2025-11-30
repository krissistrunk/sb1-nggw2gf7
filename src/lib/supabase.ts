import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Check if mock mode is enabled
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-key-for-development';

// Only throw error if NOT in mock mode and credentials are missing
if (!USE_MOCK_DATA && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.error('Missing Supabase environment variables. Set VITE_USE_MOCK_DATA=true to use mock data instead.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: !USE_MOCK_DATA,
    autoRefreshToken: !USE_MOCK_DATA,
  },
});

// Log mode on startup
if (USE_MOCK_DATA) {
  console.log('%c🎭 MOCK MODE', 'background: #FCD34D; color: #78350F; font-weight: bold; padding: 4px 8px; border-radius: 4px;', 'Using local mock data');
} else {
  console.log('%c✅ DATABASE MODE', 'background: #10B981; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;', 'Connected to Supabase');
}
