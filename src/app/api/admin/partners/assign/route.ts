import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * POST /api/admin/partners/assign
 * 
 * Assign a user to a partner organization
 * Requires SYSOP or admin capability
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  // Check admin auth
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify sysop/admin access
  const { data: adminVolunteer } = await supabase
    .from('volunteers')
    .select('capabilities')
    .eq('user_id', user.id)
    .single();

  const capabilities = adminVolunteer?.capabilities || [];
  if (!capabilities.includes('SYSOP') && !capabilities.includes('MODERATOR')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { userId, organizationId, role = 'staff' } = body;

    if (!userId || !organizationId) {
      return NextResponse.json(
        { error: 'userId and organizationId are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: targetUser } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', userId)
      .single();

    // Get or create volunteer record and add PARTNER capability
    const { data: existingVolunteer } = await supabase
      .from('volunteers')
      .select('id, capabilities')
      .eq('user_id', userId)
      .single();

    if (existingVolunteer) {
      // Add PARTNER capability if not present
      const currentCapabilities = existingVolunteer.capabilities || [];
      if (!currentCapabilities.includes('PARTNER')) {
        await supabase
          .from('volunteers')
          .update({ 
            capabilities: [...currentCapabilities, 'PARTNER'],
            status: 'ACTIVE'
          })
          .eq('user_id', userId);
      }
    } else {
      // Create volunteer record with PARTNER capability
      await supabase
        .from('volunteers')
        .insert({
          user_id: userId,
          status: 'ACTIVE',
          capabilities: ['PARTNER'],
        });
    }

    // Link user to organization (upsert)
    const { error: linkError } = await supabase
      .from('partner_users')
      .upsert({
        user_id: userId,
        organization_id: organizationId,
        role,
        status: 'active',
        accepted_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (linkError) {
      console.error('Link error:', linkError);
      return NextResponse.json(
        { error: 'Failed to link user to organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User assigned as partner successfully',
    });

  } catch (error) {
    console.error('Assign partner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
