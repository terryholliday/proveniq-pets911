import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

/**
 * GET /api/admin/partners/organizations
 * List all partner organizations
 */
export async function GET() {
  const admin = await getAdminGate({ required: 'MODERATOR' });
  if (!admin.allowed) {
    return NextResponse.json(
      { error: admin.reason, allowed: false },
      { status: admin.reason === 'UNAUTHENTICATED' ? 401 : 403 }
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: organizations, error } = await supabase
    .from('partner_organizations')
    .select('*')
    .order('name');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organizations: organizations || [] });
}

/**
 * POST /api/admin/partners/organizations
 * Create a new partner organization
 */
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const { name, type, county } = body;

    if (!name || !type || !county) {
      return NextResponse.json(
        { error: 'name, type, and county are required' },
        { status: 400 }
      );
    }

    const { data: org, error } = await supabase
      .from('partner_organizations')
      .insert({
        name,
        type,
        county,
        status: 'active',
        verified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ organization: org });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
