import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow build to proceed without env vars (they're required at runtime)
  if (!url || !anonKey) {
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
      // Build time - return placeholders to allow static analysis
      return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder-key' };
    }
    // If VERCEL_ENV is set, we're in runtime - env vars should be configured
    if (process.env.VERCEL_ENV) {
      console.warn('Supabase env vars not configured in Vercel dashboard');
      return { url: 'https://placeholder.supabase.co', anonKey: 'placeholder-key' };
    }
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!');
  }

  return { url, anonKey };
}

export const createClient = async () => {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();
  
  return createSupabaseServerClient(
    url,
    anonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options });
          } catch {
          }
        },
      },
    }
  );
};
