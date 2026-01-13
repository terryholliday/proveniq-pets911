import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

export async function GET(request: NextRequest) {
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
    const { data: cases, error } = await supabase
      .from('incident_cases')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
      return NextResponse.json({ cases: [] });
    }

    return NextResponse.json({ cases: cases || [] });
  } catch (error) {
    console.error('Cases API error:', error);
    return NextResponse.json({ cases: [] });
  }
}
