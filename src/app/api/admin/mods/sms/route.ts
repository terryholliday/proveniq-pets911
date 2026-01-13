import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const { recipient_phone, recipient_name, message, priority, type } = body;

    if (!recipient_phone || !message) {
      return NextResponse.json({ success: false, error: 'Phone and message required' }, { status: 400 });
    }

    // Check for Twilio credentials
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Log the SMS attempt
    const { data: smsLog, error: logError } = await supabase.from('sms_logs').insert({
      sender_id: user.id,
      recipient_phone,
      recipient_name,
      message,
      priority: priority || 'normal',
      type: type || 'notification',
      status: accountSid ? 'pending' : 'simulated',
      created_at: new Date().toISOString(),
    }).select().single();

    if (!accountSid || !authToken || !twilioPhone) {
      // Simulate SMS if Twilio not configured
      return NextResponse.json({ 
        success: true, 
        simulated: true,
        message: `SMS to ${recipient_name || recipient_phone} would be sent: "${message.substring(0, 50)}..."`,
        sms_id: smsLog?.id
      });
    }

    // Send via Twilio
    const twilio = require('twilio')(accountSid, authToken);
    
    const sms = await twilio.messages.create({
      body: message,
      to: recipient_phone,
      from: twilioPhone,
    });

    // Update log with Twilio SID
    await supabase.from('sms_logs').update({
      twilio_sid: sms.sid,
      status: 'sent',
    }).eq('id', smsLog?.id);

    return NextResponse.json({ 
      success: true, 
      sms_sid: sms.sid,
      message: `SMS sent to ${recipient_name || recipient_phone}`
    });

  } catch (error) {
    console.error('SMS API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    }, { status: 500 });
  }
}

// GET - Retrieve SMS logs
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const { data: logs, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: logs || [] });

  } catch (error) {
    console.error('SMS logs error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
