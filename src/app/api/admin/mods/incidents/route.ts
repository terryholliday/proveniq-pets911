import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/incidents
 * Fetch incidents and safety alerts
 */
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const county = searchParams.get('county');
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    const includeAlerts = searchParams.get('includeAlerts') !== 'false';

    // Fetch incidents
    let incidentQuery = adminDb
      .from('incidents')
      .select(`
        id,
        incident_number,
        title,
        type,
        severity,
        status,
        county,
        address,
        description,
        resolution_notes,
        reported_by,
        reporter_name,
        assigned_to,
        volunteer_id,
        case_id,
        reported_at,
        assigned_at,
        resolved_at,
        closed_at,
        created_at
      `)
      .order('reported_at', { ascending: false })
      .limit(100);

    if (county) incidentQuery = incidentQuery.eq('county', county);
    if (status) incidentQuery = incidentQuery.eq('status', status);
    if (severity) incidentQuery = incidentQuery.eq('severity', severity);

    const { data: incidents, error: incidentError } = await incidentQuery;

    // Fetch incident timelines for open/investigating incidents
    const activeIncidentIds = (incidents || [])
      .filter((i: any) => ['open', 'investigating'].includes(i.status))
      .map((i: any) => i.id);

    let timelines: Record<string, any[]> = {};
    if (activeIncidentIds.length > 0) {
      const { data: timelineData } = await adminDb
        .from('incident_timeline')
        .select('*')
        .in('incident_id', activeIncidentIds)
        .order('created_at', { ascending: true });

      if (timelineData) {
        timelineData.forEach((t: any) => {
          if (!timelines[t.incident_id]) timelines[t.incident_id] = [];
          timelines[t.incident_id].push({
            date: t.created_at,
            action: t.action,
            details: t.details,
            by: t.performed_by_name || 'System',
          });
        });
      }
    }

    // Map incidents
    const mappedIncidents = (incidents || []).map((i: any) => ({
      id: i.id,
      incident_number: i.incident_number,
      title: i.title,
      type: i.type,
      severity: i.severity,
      status: i.status,
      county: i.county,
      address: i.address,
      description: i.description,
      resolution_notes: i.resolution_notes,
      reported_by: i.reporter_name || 'Anonymous',
      assigned_to: i.assigned_to,
      reported_at: i.reported_at,
      resolved_at: i.resolved_at,
      timeline: timelines[i.id] || [],
    }));

    // Fetch safety alerts
    let alerts: any[] = [];
    if (includeAlerts) {
      let alertQuery = adminDb
        .from('safety_alerts')
        .select(`
          id,
          type,
          county,
          title,
          message,
          active,
          expires_at,
          incident_id,
          created_at
        `)
        .eq('active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (county) alertQuery = alertQuery.eq('county', county);

      const { data: alertData } = await alertQuery;
      alerts = (alertData || []).map((a: any) => ({
        id: a.id,
        type: a.type,
        county: a.county,
        title: a.title,
        message: a.message,
        expires_at: a.expires_at,
        incident_id: a.incident_id,
        created_at: a.created_at,
      }));
    }

    // Calculate stats
    const stats = {
      total: mappedIncidents.length,
      open: mappedIncidents.filter(i => i.status === 'open').length,
      investigating: mappedIncidents.filter(i => i.status === 'investigating').length,
      resolved: mappedIncidents.filter(i => i.status === 'resolved').length,
      critical: mappedIncidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length,
      active_alerts: alerts.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        incidents: mappedIncidents,
        alerts,
        stats,
      }
    });

  } catch (error) {
    console.error('Incidents API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/mods/incidents
 * Create or update incidents and safety alerts
 */
export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json();
    const { action, ...payload } = body;

    // Create incident
    if (action === 'create_incident') {
      const { title, type, severity, county, address, description, reporter_name } = payload;
      
      const { data: incident, error } = await adminDb
        .from('incidents')
        .insert({
          title,
          type,
          severity,
          status: 'open',
          county,
          address,
          description,
          reported_by: user.id,
          reporter_name: reporter_name || user.email,
          reported_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Incident create error:', error);
        return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
      }

      // Add initial timeline entry
      await adminDb.from('incident_timeline').insert({
        incident_id: incident.id,
        action: 'Incident reported',
        details: description,
        performed_by: user.id,
        performed_by_name: reporter_name || user.email,
      });

      return NextResponse.json({ success: true, incident });
    }

    // Update incident status
    if (action === 'update_status') {
      const { incident_id, status, notes } = payload;
      
      const updateData: any = { status };
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      if (status === 'closed') updateData.closed_at = new Date().toISOString();
      if (notes) updateData.resolution_notes = notes;

      const { error } = await adminDb
        .from('incidents')
        .update(updateData)
        .eq('id', incident_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 });
      }

      // Add timeline entry
      await adminDb.from('incident_timeline').insert({
        incident_id,
        action: `Status changed to ${status}`,
        details: notes,
        performed_by: user.id,
        performed_by_name: user.email,
      });

      return NextResponse.json({ success: true, message: 'Status updated' });
    }

    // Assign incident
    if (action === 'assign') {
      const { incident_id, assigned_to, assigned_to_name } = payload;
      
      const { error } = await adminDb
        .from('incidents')
        .update({
          assigned_to,
          assigned_at: new Date().toISOString(),
          status: 'investigating',
        })
        .eq('id', incident_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to assign incident' }, { status: 500 });
      }

      // Add timeline entry
      await adminDb.from('incident_timeline').insert({
        incident_id,
        action: `Assigned to ${assigned_to_name || 'moderator'}`,
        performed_by: user.id,
        performed_by_name: user.email,
      });

      return NextResponse.json({ success: true, message: 'Incident assigned' });
    }

    // Add timeline entry
    if (action === 'add_note') {
      const { incident_id, note } = payload;
      
      const { error } = await adminDb.from('incident_timeline').insert({
        incident_id,
        action: 'Note added',
        details: note,
        performed_by: user.id,
        performed_by_name: user.email,
      });

      if (error) {
        return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Note added' });
    }

    // Create safety alert
    if (action === 'create_alert') {
      const { type, county, title, message, expires_at, incident_id } = payload;
      
      const { data: alert, error } = await adminDb
        .from('safety_alerts')
        .insert({
          type,
          county,
          title,
          message,
          active: true,
          expires_at,
          incident_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Alert create error:', error);
        return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
      }

      return NextResponse.json({ success: true, alert });
    }

    // Deactivate safety alert
    if (action === 'deactivate_alert') {
      const { alert_id } = payload;
      
      const { error } = await adminDb
        .from('safety_alerts')
        .update({ active: false })
        .eq('id', alert_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to deactivate alert' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Alert deactivated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Incidents POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
