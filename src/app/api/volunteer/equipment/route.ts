import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * GET /api/volunteer/equipment
 * Get current user's equipment list
 */
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: equipment, error } = await supabase
    .from('volunteer_equipment')
    .select('*')
    .eq('volunteer_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ equipment: equipment || [] });
}

/**
 * POST /api/volunteer/equipment
 * Add new equipment
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { equipment_type, equipment_detail } = body;

    if (!equipment_type) {
      return NextResponse.json({ error: 'equipment_type required' }, { status: 400 });
    }

    const { data: equipment, error } = await supabase
      .from('volunteer_equipment')
      .insert({
        volunteer_id: user.id,
        equipment_type,
        equipment_detail,
        is_available: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ equipment });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
