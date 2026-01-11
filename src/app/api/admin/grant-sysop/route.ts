import { createServerClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use service role key for admin operations
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

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
