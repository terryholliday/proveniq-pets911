import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

async function checkAdminPermission(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return { error: NextResponse.json({ success: false, error: { message: 'Auth required' } }, { status: 401 }) };

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return { error: NextResponse.json({ success: false, error: { message: 'Invalid token' } }, { status: 401 }) };

  const adminDb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: vol } = await adminDb.from('volunteers').select('id, capabilities, status').eq('user_id', data.user.id).maybeSingle();
  
  const caps = (vol?.capabilities as string[]) || [];
  if (vol?.status !== 'ACTIVE' || (!caps.includes('SYSOP') && !caps.includes('MODERATOR'))) {
    return { error: NextResponse.json({ success: false, error: { message: 'Admin access required' } }, { status: 403 }) };
  }

  return { userId: data.user.id, adminDb };
}

export async function GET(req: NextRequest) {
  const auth = await checkAdminPermission(req);
  if ('error' in auth && auth.error) return auth.error;

  const url = new URL(req.url);
  const filter = url.searchParams.get('filter') || 'active';

  let query = auth.adminDb
    .from('volunteer_certifications')
    .select('*, volunteer:volunteers(display_name, email)')
    .order('issued_at', { ascending: false });

  if (filter === 'active') query = query.eq('status', 'active');
  else if (filter === 'expiring') {
    const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.eq('status', 'active').lt('expires_at', thirtyDays).gt('expires_at', new Date().toISOString());
  }

  const { data, error } = await query.limit(200);
  if (error) return NextResponse.json({ success: false, error: { message: 'Failed to load' } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdminPermission(req);
  if ('error' in auth && auth.error) return auth.error;

  const { id, status, reason } = await req.json();
  if (!id || !status) return NextResponse.json({ success: false, error: { message: 'ID and status required' } }, { status: 400 });

  const updates: any = { status, updated_by: auth.userId };
  if (reason) updates.revocation_reason = reason;

  const { error } = await auth.adminDb.from('volunteer_certifications').update(updates).eq('id', id);
  if (error) return NextResponse.json({ success: false, error: { message: 'Failed to update' } }, { status: 500 });
  return NextResponse.json({ success: true });
}
