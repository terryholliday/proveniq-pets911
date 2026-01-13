import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import twilio from 'twilio'; // Temporarily commented for build

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { volunteer_id, volunteer_phone, volunteer_name, reason } = body;

    if (!volunteer_phone) {
      return NextResponse.json({ success: false, error: 'Volunteer phone number required' }, { status: 400 });
    }

    // Check for Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !twilioPhone) {
      // Log the call attempt even if Twilio isn't configured
      await supabase.from('mod_call_logs').insert({
        moderator_id: user.id,
        volunteer_id,
        volunteer_phone,
        volunteer_name,
        reason,
        status: 'simulated',
        created_at: new Date().toISOString(),
      }).select().single();

      return NextResponse.json({ 
        success: true, 
        simulated: true,
        message: `Call to ${volunteer_name} (${volunteer_phone}) would be initiated. Twilio not configured.`
      });
    }

    // Initialize Twilio client
    // const twilio = require('twilio')(accountSid, authToken);

    // Create the call
    // const call = await twilio.calls.create({
    //   url: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/mods/call/twiml?name=${encodeURIComponent(volunteer_name)}&reason=${encodeURIComponent(reason || 'dispatch')}`,
    //   to: volunteer_phone,
    //   from: twilioPhone,
    //   statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/mods/call/status`,
    //   statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    // });

    // Log the call
    await supabase.from('mod_call_logs').insert({
      moderator_id: user.id,
      volunteer_id,
      volunteer_phone,
      volunteer_name,
      reason,
      // twilio_call_sid: call.sid,
      status: 'simulated',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      simulated: true,
      message: `Call to ${volunteer_name} (${volunteer_phone}) simulated for build.`
    });

  } catch (error) {
    console.error('Call API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to initiate call' 
    }, { status: 500 });
  }
}
