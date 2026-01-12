import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase service role is not configured');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getSupabaseUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

