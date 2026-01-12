import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Just return the environment variables to debug
    return NextResponse.json({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
