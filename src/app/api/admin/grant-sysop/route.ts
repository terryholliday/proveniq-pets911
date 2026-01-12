import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const bootstrapHeader = request.headers.get('x-sysop-bootstrap-token') || '';
    const bootstrapToken = process.env.SYSOP_BOOTSTRAP_TOKEN || '';

    // Either: bootstrap token OR authenticated SYSOP.
    if (!(bootstrapToken && bootstrapHeader === bootstrapToken)) {
      const { user } = await getSupabaseUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const supabase = createServiceRoleClient();
      const { data: actorVolunteer } = await supabase
        .from('volunteers')
        .select('status, capabilities')
        .eq('user_id', user.id)
        .maybeSingle<{ status: string; capabilities: string[] }>();

      const isSysop =
        actorVolunteer?.status === 'ACTIVE' &&
        Array.isArray(actorVolunteer.capabilities) &&
        actorVolunteer.capabilities.includes('SYSOP');

      if (!isSysop) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use service role key for admin operations
    const supabase = createServiceRoleClient();

    // Find the user by email
    const { data: user, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Auth admin error:', userError);
      return NextResponse.json({ error: 'Failed to access auth admin' }, { status: 500 });
    }

    const targetUser = user.users.find((u: any) => u.email === email);
    
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Grant SYSOP capability
    const { data: volunteer, error: volunteerError } = await supabase
      .from('volunteers')
      .upsert({
        user_id: targetUser.id,
        display_name: 'SYSOP Admin',
        phone: '000-000-0000',
        email: email,
        primary_county: 'GREENBRIER',
        address_city: 'SYSOP',
        address_zip: '00000',
        capabilities: ['SYSOP'],
        status: 'ACTIVE',
        max_response_radius_miles: 100,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (volunteerError) {
      console.error('Volunteer upsert error:', volunteerError);
      return NextResponse.json({ error: 'Failed to grant SYSOP', details: volunteerError }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SYSOP privileges granted successfully',
      volunteer: {
        id: volunteer.id,
        user_id: volunteer.user_id,
        email: volunteer.email,
        capabilities: volunteer.capabilities,
        status: volunteer.status,
      },
    });

  } catch (error) {
    console.error('Grant SYSOP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed. Use POST with { "email": "your-email@example.com" }' 
  }, { status: 405 });
}
