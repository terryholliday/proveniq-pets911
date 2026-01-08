import { createServerClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  if (code) {
    try {
      const cookieStore = cookies();
      const supabase = createServerClient(cookieStore);
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
      }
      
      console.log('OAuth session created successfully for user:', data.user?.email);
      
      // Session is now set in cookies via createServerClient
      // Return the redirect response
      return response;
    } catch (err) {
      console.error('OAuth callback exception:', err);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }

  return response;
}
