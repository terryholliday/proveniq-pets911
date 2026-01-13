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
    const { recipient_id, recipient_name, message, context } = body;

    if (!recipient_id || !message) {
      return NextResponse.json({ success: false, error: 'Recipient and message required' }, { status: 400 });
    }

    // Create the direct message
    const { data: dm, error: dmError } = await supabase
      .from('direct_messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        message,
        context: context || null,
        read: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dmError) {
      console.error('Failed to create DM:', dmError);
      return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
    }

    // Create a notification for the recipient
    await supabase.from('notifications').insert({
      user_id: recipient_id,
      type: 'direct_message',
      title: 'New Message from Dispatch',
      message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      data: { message_id: dm.id, sender_id: user.id },
      read: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message_id: dm.id,
      sent_to: recipient_name || recipient_id
    });

  } catch (error) {
    console.error('Message API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    }, { status: 500 });
  }
}

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
    const volunteerId = searchParams.get('volunteer_id');

    // Get conversation with specific volunteer or all recent messages
    let query = supabase
      .from('direct_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (volunteerId) {
      query = supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${volunteerId}),and(sender_id.eq.${volunteerId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true });
    }

    const { data: messages, error } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: messages || [] });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}
