import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing',
    };
    
    // Check if any required vars are missing
    const missing = Object.entries(envVars)
      .filter(([key, value]) => value === 'Missing' && key.startsWith('NEXT_PUBLIC_'))
      .map(([key]) => key);
    
    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        missing,
        envVars
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Environment variables are set',
      envVars
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
