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
    const { volunteer_id, reason } = body;

    if (!volunteer_id || !reason) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'volunteer_id and reason are required' 
          } 
        },
        { status: 400 }
      );
    }

    const { data: volunteer, error } = await supabase
      .from('volunteers')
      .update({
        status: 'SUSPENDED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', volunteer_id)
      .select()
      .single();

    if (error) {
      console.error('Volunteer suspension error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to suspend volunteer' 
          } 
        },
        { status: 500 }
      );
    }

    // Log suspension action
    await supabase.from('volunteer_moderation_log').insert({
      volunteer_id,
      action: 'SUSPENDED',
      reason,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Volunteer suspension error:', error);
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
