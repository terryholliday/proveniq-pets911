import { createServerClient } from '@supabase/ssr';
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

  if (code) {
    const cookieStore = cookies();
    
    // Create Supabase client that can set cookies on the response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url));
      }
      
      console.log('OAuth session created successfully for user:', data.user?.email);
      
      // Redirect to the intended destination
      return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (err) {
      console.error('OAuth callback exception:', err);
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }

  // No code provided, just redirect
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
