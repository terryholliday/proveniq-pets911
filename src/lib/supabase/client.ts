import { createBrowserClient, createServerClient as createSupabaseServerClient } from '@supabase/ssr';

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('@supabase/ssr: Your project\'s URL and API key are required to create a Supabase client!');
  }

  return { url, anonKey };
}

export const createClient = () => {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
};

export const createServerClient = (cookieStore: any) => {
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

export const createClientForAPI = () => {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
};
