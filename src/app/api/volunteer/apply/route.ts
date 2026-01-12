import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

interface ApplicationPayload {
  user_id: string;
  email: string | null;
  display_name: string;
  phone: string;
  primary_county: string;
  address_city: string;
  address_zip: string;
  capabilities: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation?: string;
  has_vehicle?: boolean;
  vehicle_type?: string | null;
  can_transport_crate?: boolean;
  max_animal_size?: string | null;
  available_weekdays?: boolean;
  available_weekends?: boolean;
  available_nights?: boolean;
  available_immediately?: boolean;
  max_response_radius_miles?: number;
  application_meta?: {
    agreed_code_of_conduct_at?: string | null;
    agreed_background_check_at?: string | null;
    agreed_terms_at?: string | null;
    agreed_liability_at?: string | null;
    experience_description?: string;
    why_volunteer?: string;
  };
}

async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const supabaseAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ApplicationPayload;

    if (!body.user_id || !body.display_name || !body.phone || !body.primary_county) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } },
        { status: 400 }
      );
    }

    if (!['GREENBRIER', 'KANAWHA'].includes(body.primary_county)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid county' } },
        { status: 400 }
      );
    }

    const adminDb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await adminDb
      .from('volunteers')
      .select('id, status')
      .eq('user_id', body.user_id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await adminDb
        .from('volunteers')
        .update({
          display_name: body.display_name,
          phone: body.phone,
          email: body.email,
          primary_county: body.primary_county,
          address_city: body.address_city,
          address_zip: body.address_zip,
          capabilities: body.capabilities,
          emergency_contact_name: body.emergency_contact_name,
          emergency_contact_phone: body.emergency_contact_phone,
          has_vehicle: body.has_vehicle ?? false,
          vehicle_type: body.vehicle_type,
          can_transport_crate: body.can_transport_crate ?? false,
          max_animal_size: body.max_animal_size,
          available_weekdays: body.available_weekdays ?? false,
          available_weekends: body.available_weekends ?? false,
          available_nights: body.available_nights ?? false,
          available_immediately: body.available_immediately ?? false,
          max_response_radius_miles: body.max_response_radius_miles ?? 15,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', body.user_id);

      if (updateError) {
        console.error('Volunteer update error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to update application' } },
          { status: 500 }
        );
      }

      await adminDb.from('volunteer_moderation_log').insert({
        volunteer_id: existing.id,
        action: 'APPLICATION_UPDATED',
        reason: 'Volunteer updated their application',
        performed_by: body.user_id,
      });

      return NextResponse.json({ success: true, data: { id: existing.id, updated: true } });
    }

    const { data: inserted, error: insertError } = await adminDb
      .from('volunteers')
      .insert({
        user_id: body.user_id,
        status: 'INACTIVE',
        display_name: body.display_name,
        phone: body.phone,
        email: body.email,
        primary_county: body.primary_county,
        address_city: body.address_city,
        address_zip: body.address_zip,
        capabilities: body.capabilities,
        emergency_contact_name: body.emergency_contact_name,
        emergency_contact_phone: body.emergency_contact_phone,
        has_vehicle: body.has_vehicle ?? false,
        vehicle_type: body.vehicle_type,
        can_transport_crate: body.can_transport_crate ?? false,
        max_animal_size: body.max_animal_size,
        available_weekdays: body.available_weekdays ?? false,
        available_weekends: body.available_weekends ?? false,
        available_nights: body.available_nights ?? false,
        available_immediately: body.available_immediately ?? false,
        max_response_radius_miles: body.max_response_radius_miles ?? 15,
        last_active_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Volunteer insert error:', insertError);
      return NextResponse.json(
        { success: false, error: { code: 'DATABASE_ERROR', message: 'Failed to submit application' } },
        { status: 500 }
      );
    }

    await adminDb.from('volunteer_moderation_log').insert({
      volunteer_id: inserted.id,
      action: 'APPLICATION_SUBMITTED',
      reason: body.application_meta
        ? JSON.stringify({
            role: body.capabilities[0],
            experience: body.application_meta.experience_description,
            motivation: body.application_meta.why_volunteer,
          })
        : 'New volunteer application submitted',
      performed_by: body.user_id,
    });

    return NextResponse.json({ success: true, data: { id: inserted.id, created: true } });
  } catch (e) {
    console.error('Volunteer apply error:', e);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unexpected error' } },
      { status: 500 }
    );
  }
}
