import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { volunteer_id } = body;

    if (!volunteer_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'volunteer_id is required' 
          } 
        },
        { status: 400 }
      );
    }

    const { data: volunteer, error } = await supabase
      .from('volunteers')
      .update({
        status: 'ACTIVE',
        background_check_completed: true,
        background_check_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', volunteer_id)
      .select()
      .single();

    if (error) {
      console.error('Volunteer approval error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to approve volunteer' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Volunteer approval error:', error);
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
