import { NextRequest, NextResponse } from 'next/server';
import { createClientForAPI } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ['organizationName', 'organizationType', 'county', 'contactName', 'contactEmail', 'contactPhone', 'partnershipGoals'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.contactEmail)) {
      return NextResponse.json(
        { error: 'Invalid email address format' },
        { status: 400 }
      );
    }

    const supabase = createClientForAPI();

    // Insert partner application
    const { data, error } = await supabase
      .from('partner_applications')
      .insert({
        organization_name: body.organizationName,
        organization_type: body.organizationType,
        county: body.county.toUpperCase(),
        address: body.address || null,
        city: body.city || null,
        zip_code: body.zipCode || null,
        contact_name: body.contactName,
        contact_title: body.contactTitle || null,
        contact_email: body.contactEmail,
        contact_phone: body.contactPhone,
        website: body.website || null,
        ein: body.ein || null,
        year_established: body.yearEstablished || null,
        annual_intake: body.annualIntake || null,
        services: body.services || [],
        has_physical_location: body.hasPhysicalLocation ?? true,
        operating_hours: body.operatingHours || null,
        staff_count: body.staffCount || null,
        volunteer_count: body.volunteerCount || null,
        current_challenges: body.currentChallenges || null,
        partnership_goals: body.partnershipGoals,
        how_did_you_hear: body.howDidYouHear || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again.' },
        { status: 500 }
      );
    }

    // TODO: Send confirmation email to applicant
    // TODO: Send notification to admin team

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: data.id,
    });

  } catch (error) {
    console.error('Partner application error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
