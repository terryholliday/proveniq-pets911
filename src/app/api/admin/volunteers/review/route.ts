import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

async function getUserIdFromAuthHeader(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { volunteer_id, action } = body as {
      volunteer_id?: string;
      action?: 'approve' | 'reject';
    };

    if (!volunteer_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'volunteer_id and action (approve|reject) required' } },
        { status: 400 }
      );
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: callerVolunteer } = await adminDb
      .from('volunteers')
      .select('id, capabilities, status')
      .eq('user_id', userId)
      .single();

    const callerCaps: string[] = (callerVolunteer?.capabilities as string[]) || [];
    const isSysop = callerVolunteer?.status === 'ACTIVE' && callerCaps.includes('SYSOP');

    if (!isSysop) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'SYSOP access required' } },
        { status: 403 }
      );
    }

    const { data: targetVolunteer } = await adminDb
      .from('volunteers')
      .select('id, status, display_name, capabilities')
      .eq('id', volunteer_id)
      .single();

    if (!targetVolunteer) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Volunteer not found' } },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      const { error: updateError } = await adminDb
        .from('volunteers')
        .update({
          status: 'ACTIVE',
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer_id);

      if (updateError) {
        console.error('Approve error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to approve volunteer' } },
          { status: 500 }
        );
      }

      await adminDb.from('volunteer_moderation_log').insert({
        volunteer_id,
        action: 'APPROVED',
        reason: `Approved by SYSOP`,
        performed_by: userId,
      });

      return NextResponse.json({
        success: true,
        data: { volunteer_id, action: 'approved', name: targetVolunteer.display_name },
      });
    } else {
      const { error: updateError } = await adminDb
        .from('volunteers')
        .update({
          status: 'SUSPENDED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer_id);

      if (updateError) {
        console.error('Reject error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to reject volunteer' } },
          { status: 500 }
        );
      }

      await adminDb.from('volunteer_moderation_log').insert({
        volunteer_id,
        action: 'SUSPENDED',
        reason: `Application rejected by SYSOP`,
        performed_by: userId,
      });

      return NextResponse.json({
        success: true,
        data: { volunteer_id, action: 'rejected', name: targetVolunteer.display_name },
      });
    }
  } catch (e) {
    console.error('Volunteer review error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
