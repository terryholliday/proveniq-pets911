import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Authorization: only ACTIVE SYSOP/MODERATOR can suspend volunteers
    const { data: actorVolunteer } = await supabase
      .from('volunteers')
      .select('status, capabilities')
      .eq('user_id', user.id)
      .maybeSingle<{ status: string; capabilities: string[] }>();

    const isPrivileged =
      actorVolunteer?.status === 'ACTIVE' &&
      Array.isArray(actorVolunteer.capabilities) &&
      (actorVolunteer.capabilities.includes('SYSOP') || actorVolunteer.capabilities.includes('MODERATOR'));

    if (!isPrivileged) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient privileges' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { volunteer_id, reason } = body;

    if (!volunteer_id || !reason) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'volunteer_id and reason are required' 
          } 
        },
        { status: 400 }
      );
    }

    const { data: volunteer, error } = await supabase
      .from('volunteers')
      .update({
        status: 'SUSPENDED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', volunteer_id)
      .select()
      .single();

    if (error) {
      console.error('Volunteer suspension error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to suspend volunteer' 
          } 
        },
        { status: 500 }
      );
    }

    // Log suspension action
    await supabase.from('volunteer_moderation_log').insert({
      volunteer_id,
      action: 'SUSPENDED',
      reason,
      performed_by: user.id,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Volunteer suspension error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: 'An unexpected error occurred' 
        } 
      },
      { status: 500 }
    );
  }
}
