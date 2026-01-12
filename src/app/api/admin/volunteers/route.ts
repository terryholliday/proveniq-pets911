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

// Shared permission check - returns volunteer if authorized, or error response
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
    .select('id, capabilities, status, user_id')
    .eq('user_id', userId)
    .maybeSingle();

  console.log('Admin check - userId:', userId, 'volunteer:', callerVolunteer);

  const callerCaps: string[] = (callerVolunteer?.capabilities as string[]) || [];
  const hasAccess = callerVolunteer?.status === 'ACTIVE' && 
    (callerCaps.includes('SYSOP') || callerCaps.includes('MODERATOR'));

  if (!hasAccess) {
    const message = callerVolunteer 
      ? `Access denied. Status: ${callerVolunteer.status}, Caps: [${callerCaps.join(', ') || 'none'}]. Need ACTIVE + SYSOP or MODERATOR.`
      : `No volunteer record linked to your user_id (${userId}). Contact admin.`;
    
    return {
      error: NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message } },
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
      .from('volunteers')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('status', 'INACTIVE');
    } else if (filter === 'active') {
      query = query.eq('status', 'ACTIVE');
    }

    const { data, error } = await query.limit(500);

    if (error) {
      console.error('Volunteers query error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to load volunteers' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Volunteers list error:', e);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Volunteer ID required' } },
        { status: 400 }
      );
    }

    const { data, error } = await adminDb
      .from('volunteers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Volunteer update error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update volunteer' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('Volunteer update error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const authResult = await checkAdminPermission(req, adminDb);
    if ('error' in authResult) return authResult.error;

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'Volunteer ID required' } },
        { status: 400 }
      );
    }

    // Prevent self-deletion
    if (authResult.callerVolunteer?.id === id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Cannot delete your own account' } },
        { status: 403 }
      );
    }

    const { error } = await adminDb
      .from('volunteers')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Volunteer delete error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to delete volunteer' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Volunteer delete error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
