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

    // Check if user is privileged (SYSOP/MODERATOR) to view all dispatches
    const { data: actorVolunteer } = await supabase
      .from('volunteers')
      .select('id, status, capabilities')
      .eq('user_id', user.id)
      .maybeSingle<{ id: string; status: string; capabilities: string[] }>();

    const isPrivileged =
      actorVolunteer?.status === 'ACTIVE' &&
      Array.isArray(actorVolunteer.capabilities) &&
      (actorVolunteer.capabilities.includes('SYSOP') || actorVolunteer.capabilities.includes('MODERATOR'));

    let query = supabase
      .from('dispatch_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    // Non-privileged users only see their own requests or dispatches assigned to them
    if (!isPrivileged) {
      if (actorVolunteer?.id) {
        // User is a volunteer - show requests they made OR are assigned to
        query = query.or(`requester_id.eq.${user.id},volunteer_id.eq.${actorVolunteer.id}`);
      } else {
        // User is not a volunteer - show only their own requests
        query = query.eq('requester_id', user.id);
      }
    }

    const { data: dispatches, error } = await query;

    if (error) {
      console.error('Dispatch history query error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch dispatch history' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: dispatches || [],
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dispatch history error:', error);
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
