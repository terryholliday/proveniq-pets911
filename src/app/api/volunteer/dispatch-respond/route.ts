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

    const { request_id, accept } = await request.json();

    const newStatus = accept ? 'ACCEPTED' : 'DECLINED';

    const { error } = await supabase
      .from('dispatch_requests')
      .update({ 
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq('id', request_id);

    if (error) {
      console.error('Dispatch respond error:', error);
      return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
    }

    // If accepted, update case status
    if (accept) {
      const { data: dispatch } = await supabase
        .from('dispatch_requests')
        .select('case_id')
        .eq('id', request_id)
        .single();

      if (dispatch?.case_id) {
        await supabase
          .from('incident_cases')
          .update({ status: 'IN_PROGRESS' })
          .eq('id', dispatch.case_id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Dispatch respond API error:', error);
    return NextResponse.json({ error: 'Failed to respond' }, { status: 500 });
  }
}
