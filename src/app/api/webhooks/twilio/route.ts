import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { handleVolunteerResponse } from '@/lib/services/twilio-dispatch-service';

/**
 * Twilio Webhook: Handle incoming SMS responses from volunteers
 * When volunteer replies Y/N to dispatch request
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase client inside the handler
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formData = await request.formData();
    
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    if (!from || !body) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log('Twilio webhook received:', { from, body, messageSid });

    // Parse volunteer response
    const { dispatchId, action } = await handleVolunteerResponse(from, body);

    if (!dispatchId || !action) {
      // Unknown response - send help message
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Reply Y to accept or N to decline the dispatch request.</Message></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Find volunteer by phone
    const { data: volunteer } = await supabase
      .from('volunteers')
      .select('id, display_name')
      .eq('phone', from)
      .single();

    if (!volunteer) {
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Volunteer profile not found. Please register at pet911.org/helpers/join</Message></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Update dispatch request
    if (action === 'ACCEPTED') {
      const { error } = await supabase
        .from('dispatch_requests')
        .update({
          status: 'ACCEPTED',
          volunteer_id: volunteer.id,
          volunteer_name: volunteer.display_name,
          volunteer_phone: from,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispatchId)
        .eq('status', 'PENDING'); // Only update if still pending

      if (error) {
        console.error('Failed to update dispatch:', error);
      }

      // Log notification response
      await supabase
        .from('dispatch_notifications')
        .update({
          response_at: new Date().toISOString(),
          response_action: 'ACCEPTED',
        })
        .eq('dispatch_request_id', dispatchId)
        .eq('volunteer_id', volunteer.id);

      // Update volunteer stats
      const { data: currentVolunteer } = await supabase
        .from('volunteers')
        .select('total_dispatches')
        .eq('id', volunteer.id)
        .single();

      await supabase
        .from('volunteers')
        .update({
          total_dispatches: (currentVolunteer?.total_dispatches || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer.id);

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Thank you! You\'ve accepted the dispatch. The finder will be notified. Check your dashboard for details: pet911.org/helpers/dashboard</Message></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    } else {
      // DECLINED
      const { error } = await supabase
        .from('dispatch_requests')
        .update({
          status: 'DECLINED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', dispatchId)
        .eq('volunteer_id', volunteer.id);

      if (error) {
        console.error('Failed to update dispatch:', error);
      }

      // Log notification response
      await supabase
        .from('dispatch_notifications')
        .update({
          response_at: new Date().toISOString(),
          response_action: 'DECLINED',
        })
        .eq('dispatch_request_id', dispatchId)
        .eq('volunteer_id', volunteer.id);

      // Update volunteer stats
      const { data: currentVolunteer } = await supabase
        .from('volunteers')
        .select('declined_dispatches')
        .eq('id', volunteer.id)
        .single();

      await supabase
        .from('volunteers')
        .update({
          declined_dispatches: (currentVolunteer?.declined_dispatches || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', volunteer.id);

      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response><Message>Understood. We\'ll notify another volunteer. Thank you for responding!</Message></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

  } catch (error) {
    console.error('Twilio webhook error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
