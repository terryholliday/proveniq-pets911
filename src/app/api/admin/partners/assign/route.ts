import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { getAdminGate } from '@/lib/access/authority';

/**
 * POST /api/admin/partners/assign
 * 
 * Assign a user to a partner organization
 * Requires SYSOP or admin capability
 */
export async function POST(request: NextRequest) {
  const admin = await getAdminGate({ required: 'SYSOP' });
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
