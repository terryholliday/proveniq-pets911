import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let query = supabase.from('volunteers').select('*');

    if (filter === 'pending') {
      query = query.eq('background_check_completed', false);
    } else if (filter === 'active') {
      query = query.eq('status', 'ACTIVE');
    } else if (filter === 'suspended') {
      query = query.eq('status', 'SUSPENDED');
    }

    const { data: volunteers, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Volunteers query error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch volunteers' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteers || [],
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin volunteers error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}
