import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

export async function POST(request: NextRequest) {
  const admin = await getAdminGate({ required: 'MODERATOR' });
  if (!admin.allowed) {
    return NextResponse.json(
      { error: admin.reason, allowed: false },
      { status: admin.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { volunteer_id, case_id } = await request.json();

    // Create dispatch request
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2); // 2 hour expiry

    const { data: dispatch, error } = await supabase
      .from('dispatch_requests')
      .insert({
        volunteer_id,
        case_id,
        status: 'PENDING',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Dispatch creation error:', error);
      return NextResponse.json({ error: 'Failed to dispatch volunteer' }, { status: 500 });
    }

    // TODO: Send notification to volunteer via Twilio/push

    return NextResponse.json({ success: true, dispatch });
  } catch (error) {
    console.error('Dispatch volunteer error:', error);
    return NextResponse.json({ error: 'Failed to dispatch' }, { status: 500 });
  }
}
