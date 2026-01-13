import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

export async function PATCH(
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
    const { status } = await request.json();

    const { error } = await supabase
      .from('incident_cases')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
