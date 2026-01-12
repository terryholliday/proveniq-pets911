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

async function checkAdminPermission(req: NextRequest, adminDb: any) {
  const userId = await getUserIdFromAuthHeader(req);
  if (!userId) {
    return { 
      error: NextResponse.json(
        { success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } },
        { status: 401 }
      )
    };
  }

  const { data: callerVolunteer } = await adminDb
    .from('volunteers')
    .select('id, capabilities, status')
    .eq('user_id', userId)
    .maybeSingle();

  const callerCaps: string[] = (callerVolunteer?.capabilities as string[]) || [];
  const hasAccess = callerVolunteer?.status === 'ACTIVE' && 
    (callerCaps.includes('SYSOP') || callerCaps.includes('MODERATOR'));

  if (!hasAccess) {
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } },
        { status: 403 }
      )
    };
  }

  return { userId, callerVolunteer };
}

export async function GET(req: NextRequest) {
  try {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authResult = await checkAdminPermission(req, adminDb);
    if ('error' in authResult) return authResult.error;

    const url = new URL(req.url);
    const filter = url.searchParams.get('filter') || 'all';

    let query = adminDb
      .from('volunteer_background_checks')
      .select('*, volunteer:volunteers(display_name, email, phone)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.in('status', ['pending', 'in_review', 'flagged']);
    } else if (filter === 'completed') {
      query = query.in('status', ['cleared', 'failed', 'expired']);
    }

    const { data, error } = await query.limit(200);

    if (error) {
      console.error('Background checks query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to load background checks' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Background checks error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authResult = await checkAdminPermission(req, adminDb);
    if ('error' in authResult) return authResult.error;

    const body = await req.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'ID and status required' } },
        { status: 400 }
      );
    }

    const updates: any = { 
      status,
      reviewed_by: authResult.userId,
      reviewed_at: new Date().toISOString(),
    };

    if (['cleared', 'failed'].includes(status)) {
      updates.completed_at = new Date().toISOString();
    }

    if (notes) {
      updates.result_summary = notes;
    }

    const { data, error } = await adminDb
      .from('volunteer_background_checks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Background check update error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Background check update error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
