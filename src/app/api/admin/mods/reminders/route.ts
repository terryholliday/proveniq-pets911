import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/admin/mods/reminders
 * Fetch shift reminders (pending, sent, or all)
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const shiftId = searchParams.get('shift_id');

    let query = adminDb
      .from('shift_reminders')
      .select(`
        id,
        shift_id,
        volunteer_id,
        reminder_type,
        send_at,
        sent_at,
        channel,
        status,
        created_at,
        volunteer_shifts!inner (
          shift_date,
          start_time,
          end_time,
          shift_type,
          volunteers (
            display_name,
            phone,
            email
          )
        )
      `)
      .order('send_at', { ascending: true });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (shiftId) {
      query = query.eq('shift_id', shiftId);
    }

    const { data: reminders, error } = await query;

    if (error) {
      console.error('Reminders fetch error:', error);
      return NextResponse.json({ success: true, data: { reminders: [], stats: {} } });
    }

    const mapped = (reminders || []).map((r: any) => ({
      id: r.id,
      shift_id: r.shift_id,
      volunteer_id: r.volunteer_id,
      volunteer_name: r.volunteer_shifts?.volunteers?.display_name || 'Unknown',
      volunteer_phone: r.volunteer_shifts?.volunteers?.phone,
      volunteer_email: r.volunteer_shifts?.volunteers?.email,
      shift_date: r.volunteer_shifts?.shift_date,
      shift_time: `${r.volunteer_shifts?.start_time}-${r.volunteer_shifts?.end_time}`,
      reminder_type: r.reminder_type,
      send_at: r.send_at,
      sent_at: r.sent_at,
      channel: r.channel,
      status: r.status,
    }));

    const stats = {
      pending: mapped.filter(r => r.status === 'pending').length,
      sent: mapped.filter(r => r.status === 'sent').length,
      failed: mapped.filter(r => r.status === 'failed').length,
    };

    return NextResponse.json({ success: true, data: { reminders: mapped, stats } });

  } catch (error) {
    console.error('Reminders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/mods/reminders
 * Create or manage reminders
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
    const { action } = body;

    // Create reminder for a shift
    if (action === 'create') {
      const { shift_id, volunteer_id, reminder_type, send_at, channel } = body;

      const { data: reminder, error } = await adminDb
        .from('shift_reminders')
        .insert({
          shift_id,
          volunteer_id,
          reminder_type: reminder_type || '24hr',
          send_at,
          channel: channel || 'sms',
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Reminder create error:', error);
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
      }

      return NextResponse.json({ success: true, reminder });
    }

    // Auto-create reminders for a shift (24hr + 1hr)
    if (action === 'auto_create') {
      const { shift_id, volunteer_id, shift_datetime, channel } = body;

      const shiftTime = new Date(shift_datetime);
      const reminder24hr = new Date(shiftTime.getTime() - 24 * 60 * 60 * 1000);
      const reminder1hr = new Date(shiftTime.getTime() - 1 * 60 * 60 * 1000);

      const reminders = [];

      // Only create if send time is in the future
      if (reminder24hr > new Date()) {
        reminders.push({
          shift_id,
          volunteer_id,
          reminder_type: '24hr',
          send_at: reminder24hr.toISOString(),
          channel: channel || 'sms',
          status: 'pending',
        });
      }

      if (reminder1hr > new Date()) {
        reminders.push({
          shift_id,
          volunteer_id,
          reminder_type: '1hr',
          send_at: reminder1hr.toISOString(),
          channel: channel || 'sms',
          status: 'pending',
        });
      }

      if (reminders.length > 0) {
        const { error } = await adminDb.from('shift_reminders').insert(reminders);
        if (error) {
          console.error('Auto-create reminders error:', error);
          return NextResponse.json({ error: 'Failed to create reminders' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true, created: reminders.length });
    }

    // Cancel reminder
    if (action === 'cancel') {
      const { reminder_id } = body;

      const { error } = await adminDb
        .from('shift_reminders')
        .update({ status: 'cancelled' })
        .eq('id', reminder_id);

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel reminder' }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Reminder cancelled' });
    }

    // Process pending reminders (called by cron/scheduled job)
    if (action === 'process') {
      const now = new Date().toISOString();

      // Get pending reminders that should be sent
      const { data: pendingReminders, error: fetchError } = await adminDb
        .from('shift_reminders')
        .select(`
          id,
          shift_id,
          volunteer_id,
          reminder_type,
          channel,
          volunteer_shifts (
            shift_date,
            start_time,
            county,
            volunteers (
              display_name,
              phone,
              email
            )
          )
        `)
        .eq('status', 'pending')
        .lte('send_at', now)
        .limit(50);

      if (fetchError) {
        console.error('Fetch pending reminders error:', fetchError);
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
      }

      const results = { sent: 0, failed: 0 };

      for (const reminder of pendingReminders || []) {
        try {
          const shift = reminder.volunteer_shifts as any;
          const volunteer = shift?.volunteers;
          
          if (!volunteer) {
            // Mark as failed - no volunteer info
            await adminDb
              .from('shift_reminders')
              .update({ status: 'failed' })
              .eq('id', reminder.id);
            results.failed++;
            continue;
          }

          // Build message
          const message = buildReminderMessage(
            reminder.reminder_type,
            volunteer.display_name,
            shift.shift_date,
            shift.start_time,
            shift.county
          );

          // Send via appropriate channel
          let sent = false;
          
          if ((reminder.channel === 'sms' || reminder.channel === 'all') && volunteer.phone) {
            // TODO: Integrate with Twilio/SMS service
            console.log(`[SMS] To ${volunteer.phone}: ${message}`);
            sent = true;
          }

          if ((reminder.channel === 'email' || reminder.channel === 'all') && volunteer.email) {
            // TODO: Integrate with email service
            console.log(`[EMAIL] To ${volunteer.email}: ${message}`);
            sent = true;
          }

          // Update reminder status
          await adminDb
            .from('shift_reminders')
            .update({
              status: sent ? 'sent' : 'failed',
              sent_at: sent ? new Date().toISOString() : null,
            })
            .eq('id', reminder.id);

          if (sent) results.sent++;
          else results.failed++;

        } catch (err) {
          console.error(`Reminder ${reminder.id} error:`, err);
          await adminDb
            .from('shift_reminders')
            .update({ status: 'failed' })
            .eq('id', reminder.id);
          results.failed++;
        }
      }

      return NextResponse.json({ success: true, processed: results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Reminders POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildReminderMessage(
  type: string,
  volunteerName: string,
  shiftDate: string,
  startTime: string,
  county: string
): string {
  const timeFrame = type === '24hr' ? 'tomorrow' : type === '1hr' ? 'in 1 hour' : 'soon';
  
  return `Hi ${volunteerName}! 🐾 Reminder: Your PetMayday shift starts ${timeFrame} on ${shiftDate} at ${startTime} in ${county} County. Reply HELP for assistance or SWAP to request coverage. Thank you for saving lives!`;
}
