import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const { data: volunteer, error } = await supabase
      .from('volunteers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !volunteer) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'NOT_FOUND', 
            message: 'Volunteer profile not found' 
          } 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Get volunteer profile error:', error);
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

export async function PATCH(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    const body = await request.json();

    // Only allow safe self-service updates. All privileged fields (status approval,
    // capabilities, background checks, moderation) must be changed by moderators/sysops.
    const allowedKeys = new Set([
      'status',
      'available_weekdays',
      'available_weekends',
      'available_nights',
      'available_immediately',
      'last_active_at',
    ]);

    const requestedUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body || {})) {
      if (allowedKeys.has(key)) {
        requestedUpdates[key] = value;
      }
    }

    if (Object.keys(requestedUpdates).length === 0) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No updatable fields provided' } },
        { status: 400 }
      );
    }

    const { data: existingVolunteer } = await supabase
      .from('volunteers')
      .select('status')
      .eq('user_id', user.id)
      .single<{ status: string }>();

    if (requestedUpdates.status) {
      const nextStatus = String(requestedUpdates.status);
      const currentStatus = existingVolunteer?.status;

      const canSelfToggle =
        currentStatus === 'ACTIVE' || currentStatus === 'TEMPORARILY_UNAVAILABLE';

      const allowedNext = nextStatus === 'ACTIVE' || nextStatus === 'TEMPORARILY_UNAVAILABLE';

      if (!canSelfToggle || !allowedNext) {
        return NextResponse.json(
          {
            success: false,
            error: { code: 'FORBIDDEN', message: 'Status changes require moderator approval' },
          },
          { status: 403 }
        );
      }
    }

    const { data: volunteer, error } = await supabase
      .from('volunteers')
      .update({
        ...requestedUpdates,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update volunteer profile error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to update volunteer profile' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteer,
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Update volunteer profile error:', error);
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
