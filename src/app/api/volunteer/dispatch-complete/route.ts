import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { request_id } = await request.json();

    // Update dispatch request
    const { data: dispatch, error } = await supabase
      .from('dispatch_requests')
      .update({ 
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
      })
      .eq('id', request_id)
      .select('case_id')
      .single();

    if (error) {
      console.error('Dispatch complete error:', error);
      return NextResponse.json({ error: 'Failed to complete' }, { status: 500 });
    }

    // Update volunteer stats
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, completed_dispatches')
      .eq('user_id', user.id)
      .single();

    if (volunteer) {
      await supabase
        .from('volunteers')
        .update({ 
          completed_dispatches: (volunteer.completed_dispatches || 0) + 1,
        })
        .eq('id', volunteer.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dispatch complete API error:', error);
    return NextResponse.json({ error: 'Failed to complete' }, { status: 500 });
  }
}
