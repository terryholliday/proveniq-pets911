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

  const { data, error } = await auth.adminDb
    .from('volunteer_cooldown_events')
    .select('*, volunteer:volunteers(display_name, email, phone)')
    .gt('ends_at', new Date().toISOString())
    .order('ends_at', { ascending: true });

  if (error) return NextResponse.json({ success: false, error: { message: 'Failed to load' } }, { status: 500 });
  return NextResponse.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const auth = await checkAdminPermission(req);
  if ('error' in auth && auth.error) return auth.error;

  const { id, override_reason } = await req.json();
  if (!id) return NextResponse.json({ success: false, error: { message: 'ID required' } }, { status: 400 });

  const { error } = await auth.adminDb
    .from('volunteer_cooldown_events')
    .update({ ends_at: new Date().toISOString(), override_reason, overridden_by: auth.userId })
    .eq('id', id);

  if (error) return NextResponse.json({ success: false, error: { message: 'Failed to update' } }, { status: 500 });
  return NextResponse.json({ success: true });
}
