import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string;
    const callStatus = formData.get('CallStatus') as string;
    const duration = formData.get('CallDuration') as string;

    if (callSid) {
      await supabase
        .from('mod_call_logs')
        .update({
          status: callStatus,
          duration: duration ? parseInt(duration) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('twilio_call_sid', callSid);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Call status webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}
