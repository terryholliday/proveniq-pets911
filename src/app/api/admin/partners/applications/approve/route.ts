import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';

/**
 * POST /api/admin/partners/applications/approve
 * Approve a partner application and create organization
 */
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { applicationId } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 });
    }

    // Get application
    const { data: app, error: appError } = await supabase
      .from('partner_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create organization from application
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: app.organization_name,
        type: app.organization_type,
        county: app.county,
        address: app.address,
        city: app.city,
        zip_code: app.zip_code,
        phone: app.contact_phone,
        email: app.contact_email,
        website: app.website,
        status: 'active',
        verified_at: new Date().toISOString(),
        application_id: app.id,
      })
      .select()
      .single();

    if (orgError) {
      return NextResponse.json({ error: orgError.message }, { status: 500 });
    }

    // Update application status
    await supabase
      .from('partner_applications')
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    return NextResponse.json({
      success: true,
      organization: org,
      message: 'Application approved and organization created',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
