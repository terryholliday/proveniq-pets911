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
      const cookieStore = await cookies();
      const supabase = createServerClient(cookieStore);

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
        );
      }

      return response;
    } catch {
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url));
    }
  }

  return response;
}
