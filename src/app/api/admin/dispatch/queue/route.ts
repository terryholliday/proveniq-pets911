import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromAuthHeader(req);
    if (!userId) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Sign in required' } }, { status: 401 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify caller is MODERATOR or SYSOP via volunteer profile
    const { data: callerVolunteer } = await adminDb
      .from('volunteers')
      .select('id, capabilities, status')
      .eq('user_id', userId)
      .single();

    const callerCaps: string[] = (callerVolunteer?.capabilities as any) || [];
    const isAdmin = callerVolunteer?.status === 'ACTIVE' && (callerCaps.includes('MODERATOR') || callerCaps.includes('SYSOP'));

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Moderator or SYSOP access required' } }, { status: 403 });
    }

    const { data, error } = await adminDb
      .from('dispatch_requests')
      .select('*')
      .eq('status', 'PENDING')
      .order('requested_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to load dispatch queue' } }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Dispatch queue error:', e);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } }, { status: 500 });
  }
}
