import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminGate({ required: 'MODERATOR' });
  if (!admin.allowed) {
    return NextResponse.json(
      { error: admin.reason, allowed: false },
      { status: admin.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);
  const { id } = await params;

  try {
    const { note } = await request.json();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Add to case timeline
    const { error } = await supabase
      .from('case_timeline')
      .insert({
        case_id: id,
        event_type: 'NOTE_ADDED',
        description: note,
        actor_name: user?.user_metadata?.full_name || user?.email || 'Unknown',
        actor_type: 'MODERATOR',
      });

    if (error) {
      console.error('Note insert error:', error);
      return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Note error:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
}
