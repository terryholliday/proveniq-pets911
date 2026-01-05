import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client
export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};

// Server-side Supabase client for server components
export const createServerClient = () => {
  return createServerComponentClient({
    cookies,
  });
};

// For API routes (server-side)
export const createClientForAPI = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
};
