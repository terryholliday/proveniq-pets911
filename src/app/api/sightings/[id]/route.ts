import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClientForAPI();
    const body = await request.json();
    const sightingId = params.id;

    // Validate the sighting exists
    const { data: existing, error: fetchError } = await supabase
      .from('sighting')
      .select('*')
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
      updates.status = body.status;
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
      await supabase
        .from('sighting_status_log')
        .insert({
          sighting_id: sightingId,
          from_status: existing.status,
          to_status: body.status,
          changed_by: body.changed_by || 'SYSTEM',
          notes: body.notes || null,
        });
    }

    // If status changed to IN_PROGRESS and this is a high priority sighting,
    // send notifications
    if (body.status === 'IN_PROGRESS' && existing.priority === 'HIGH') {
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
