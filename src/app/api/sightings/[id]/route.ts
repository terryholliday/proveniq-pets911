import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, getSupabaseUser } from '@/lib/api/server-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await getSupabaseUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServiceRoleClient();
    const body = await request.json();
    const sightingId = params.id;

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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate the sighting exists
    const { data: existing, error: fetchError } = await supabase
      .from('sighting')
      .select('id, status, priority')
      .eq('id', sightingId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: 'Sighting not found' },
        { status: 404 }
      );
    }

    // Update the sighting
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.status) {
      const nextStatus = String(body.status).toUpperCase();
      const allowed = new Set(['ACTIVE', 'IN_PROGRESS', 'RESOLVED']);
      if (!allowed.has(nextStatus)) {
        return NextResponse.json({ error: `Invalid status. Allowed: ${Array.from(allowed).join(', ')}` }, { status: 400 });
      }
      updates.status = nextStatus;
    }

    if (body.estimated_arrival) {
      updates.estimated_arrival = body.estimated_arrival;
    }

    if (body.rescuer_assigned) {
      updates.rescuer_assigned = body.rescuer_assigned;
    }

    const { data, error } = await supabase
      .from('sighting')
      .update(updates)
      .eq('id', sightingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating sighting:', error);
      return NextResponse.json(
        { error: 'Failed to update sighting' },
        { status: 500 }
      );
    }

    // Log the status change
    if (body.status && body.status !== existing.status) {
      try {
        await supabase.from('sighting_status_log').insert({
          sighting_id: sightingId,
          from_status: existing.status,
          to_status: updates.status || body.status,
          changed_by: user.id,
          notes: body.notes || null,
        } as any);
      } catch {
      }
    }

    // If status changed to IN_PROGRESS and this is a high priority sighting,
    // send notifications
    if (updates.status === 'IN_PROGRESS' && existing.priority === 'HIGH') {
      // TODO: Send notification to reporter
      console.log('Sighting marked IN_PROGRESS, sending notification to reporter');
    }

    return NextResponse.json({ sighting: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
