import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createClientForAPI();
    
    // Test basic connection
    const { data, error } = await supabase
      .from('sighting')
      .select('count')
      .limit(1);
    
    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Supabase connection failed - check your .env file'
      }, { status: 500 });
    }
    
    // Check if tables exist
    const tables = ['sighting', 'sighting_notification', 'sighting_status_log'];
    const tableStatus: Record<string, string> = {};
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        tableStatus[table] = tableError ? 'Missing' : 'Exists';
      } catch (e) {
        tableStatus[table] = 'Error';
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful!',
      tables: tableStatus,
      sightingsCount: data?.length || 0
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      details: 'Failed to initialize Supabase client'
    }, { status: 500 });
  }
}
