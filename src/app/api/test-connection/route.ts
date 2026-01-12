import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Just test if we can create a Supabase client
    const supabase = createClientForAPI();
    
    // Test basic auth by checking the health endpoint
    const { data, error } = await supabase
      .rpc('version'); // This is a built-in function in Supabase
    
    if (error && !error.message.includes('function') && !error.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Failed to connect to Supabase'
      }, { status: 500 });
    }
    
    // If we get here, the connection works
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      note: 'Tables may not exist yet - please run the migration',
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...'
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: 'Failed to initialize Supabase client'
    }, { status: 500 });
  }
}
