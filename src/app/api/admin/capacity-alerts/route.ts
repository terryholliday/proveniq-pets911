import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: alerts, error } = await supabase
      .from('capacity_alerts')
      .select('*')
      .gte('sent_at', thirtyDaysAgo.toISOString())
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Capacity alerts error:', error);
      return NextResponse.json({ alerts: [] });
    }

    return NextResponse.json({ alerts: alerts || [] });
  } catch (error) {
    console.error('Capacity alerts API error:', error);
    return NextResponse.json({ alerts: [] });
  }
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  try {
    const { shelter_id } = await request.json();

    // Get shelter info
    const { data: shelter } = await supabase
      .from('partner_organizations')
      .select('*')
      .eq('id', shelter_id)
      .single();

    if (!shelter) {
      return NextResponse.json({ error: 'Shelter not found' }, { status: 404 });
    }

    // Get transport volunteers in county
    const { data: volunteers } = await supabase
      .from('volunteers')
      .select('id, user_id')
      .contains('capabilities', ['TRANSPORT'])
      .eq('county', shelter.county)
      .eq('status', 'ACTIVE');

    const volunteerCount = volunteers?.length || 0;

    // Create alert record
    const { data: alert, error } = await supabase
      .from('capacity_alerts')
      .insert({
        shelter_id,
        shelter_name: shelter.name,
        alert_type: 'CRITICAL',
        species: 'BOTH',
        current_percentage: 95,
        volunteers_notified: volunteerCount,
        responses_received: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Alert creation error:', error);
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }

    // TODO: Send actual notifications via Twilio/email

    return NextResponse.json({ success: true, alert, volunteers_notified: volunteerCount });
  } catch (error) {
    console.error('Capacity alert POST error:', error);
    return NextResponse.json({ error: 'Failed to send alert' }, { status: 500 });
  }
}
