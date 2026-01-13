import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/volunteers/[id]
 * Get a single volunteer's details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: volunteer, error } = await adminDb
      .from('volunteers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !volunteer) {
      return NextResponse.json({ error: 'Volunteer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, volunteer });

  } catch (error) {
    console.error('Volunteer GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/mods/volunteers/[id]
 * Update volunteer information (moderator/sysop only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check moderator permissions
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    const allowedRoles = ['moderator', 'admin', 'sysop', 'MODERATOR', 'ADMIN', 'SYSOP'];
    
    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: modCheck } = await adminDb
      .from('volunteers')
      .select('capabilities')
      .eq('user_id', user.id)
      .single();

    const hasModCapability = modCheck?.capabilities?.some((c: string) => 
      ['MODERATOR', 'SYSOP', 'ADMIN'].includes(c)
    );

    if (!allowedRoles.includes(userRole) && !hasModCapability) {
      return NextResponse.json({ error: 'Forbidden - Moderator access required' }, { status: 403 });
    }

    // Parse update payload
    const body = await request.json();
    
    // Map frontend fields to database fields
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.display_name = body.name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.county !== undefined) updateData.primary_county = body.county;
    if (body.coverage_counties !== undefined) updateData.coverage_counties = body.coverage_counties;
    if (body.capabilities !== undefined) updateData.capabilities = body.capabilities;
    if (body.vehicle_type !== undefined) updateData.vehicle_type = body.vehicle_type;
    if (body.can_transport_crate !== undefined) updateData.can_transport_crate = body.can_transport_crate;
    if (body.foster_capacity !== undefined) updateData.max_foster_count = body.foster_capacity;
    
    // Map status
    if (body.status !== undefined) {
      const statusMap: Record<string, string> = {
        'available': 'ACTIVE',
        'busy': 'ON_MISSION',
        'offline': 'INACTIVE',
      };
      updateData.status = statusMap[body.status] || 'INACTIVE';
    }

    // Perform update
    const { data: updated, error: updateError } = await adminDb
      .from('volunteers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Volunteer update error:', updateError);
      return NextResponse.json({ error: 'Failed to update volunteer' }, { status: 500 });
    }

    // Log the moderation action (fire and forget)
    try {
      await adminDb.from('volunteer_moderation_log').insert({
        volunteer_id: id,
        action: 'PROFILE_UPDATED_BY_MOD',
        reason: `Updated by moderator: ${Object.keys(updateData).filter(k => k !== 'updated_at').join(', ')}`,
        performed_by: user.id,
      });
    } catch {
      console.warn('Failed to log moderation action');
    }

    return NextResponse.json({ 
      success: true, 
      volunteer: updated,
      message: 'Volunteer updated successfully'
    });

  } catch (error) {
    console.error('Volunteer PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/mods/volunteers/[id]
 * Deactivate a volunteer (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check sysop permissions (only sysop can deactivate)
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (!['sysop', 'SYSOP', 'admin', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Forbidden - SYSOP access required' }, { status: 403 });
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Soft delete - set status to DEACTIVATED
    const { error: updateError } = await adminDb
      .from('volunteers')
      .update({ 
        status: 'DEACTIVATED',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Volunteer deactivate error:', updateError);
      return NextResponse.json({ error: 'Failed to deactivate volunteer' }, { status: 500 });
    }

    // Log the action
    await adminDb.from('volunteer_moderation_log').insert({
      volunteer_id: id,
      action: 'DEACTIVATED',
      reason: 'Deactivated by SYSOP',
      performed_by: user.id,
    });

    return NextResponse.json({ success: true, message: 'Volunteer deactivated' });

  } catch (error) {
    console.error('Volunteer DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
