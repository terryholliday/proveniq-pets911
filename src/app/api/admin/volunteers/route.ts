import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        },
        { status: 401 }
      );
    }

    const supabase = createServiceRoleClient();

    // Authorization: only ACTIVE SYSOP/MODERATOR can view all volunteers
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
        {
          success: false,
          error: { code: 'FORBIDDEN', message: 'Insufficient privileges' },
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all';

    let query = supabase.from('volunteers').select('*');

    if (filter === 'pending') {
      query = query.eq('background_check_completed', false);
    } else if (filter === 'active') {
      query = query.eq('status', 'ACTIVE');
    } else if (filter === 'suspended') {
      query = query.eq('status', 'SUSPENDED');
    }

    const { data: volunteers, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Volunteers query error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'DATABASE_ERROR', 
            message: 'Failed to fetch volunteers' 
          } 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volunteers || [],
      meta: {
        request_id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Admin volunteers error:', error);
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
