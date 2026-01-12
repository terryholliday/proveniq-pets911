import { createServerClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getSafeRedirectPath(redirectTo: string | null): string {
  if (!redirectTo) return '/';
  
  // Only allow relative paths starting with /
  // Reject absolute URLs, protocol-relative URLs, and javascript: URIs
  const trimmed = redirectTo.trim();
  if (
    !trimmed.startsWith('/') ||
    trimmed.startsWith('//') ||
    trimmed.toLowerCase().startsWith('/\\') ||
    /^\/[a-z]+:/i.test(trimmed)
  ) {
    return '/';
  }
  
  return trimmed;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = getSafeRedirectPath(requestUrl.searchParams.get('redirectTo'));

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
