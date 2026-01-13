import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================================
// POST - Start a new background check
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a pending or active background check
    const { data: existingCheck } = await supabase
      .from('volunteer_background_checks')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['pending', 'in_review', 'cleared'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (existingCheck) {
      if (existingCheck.status === 'cleared') {
        // Check if it's expired
        if (existingCheck.expires_at && new Date(existingCheck.expires_at) > new Date()) {
          return NextResponse.json(
            { error: 'You already have an active background check' },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'You already have a pending background check' },
          { status: 400 }
        );
      }
    }

    // Get user info for the background check
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (!user?.user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userEmail = user.user.email;
    const userName = user.user.user_metadata?.name || userEmail;

    // Generate a unique check ID for tracking
    const externalCheckId = `PetMayday-${crypto.randomBytes(8).toString('hex')}`;

    // Create background check record
    const { data: check, error } = await supabase
      .from('volunteer_background_checks')
      .insert({
        user_id: userId,
        provider: process.env.BACKGROUND_CHECK_PROVIDER || 'checkr',
        external_check_id: externalCheckId,
        status: 'pending',
        check_type: 'standard',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // In production, integrate with actual background check provider
    // For now, we'll simulate the flow
    
    // Option 1: If using Checkr or similar provider, redirect to their hosted flow
    const useExternalProvider = process.env.BACKGROUND_CHECK_EXTERNAL === 'true';
    
    if (useExternalProvider) {
      // Create invitation URL for external provider
      const redirectUrl = await createExternalBackgroundCheck({
        userId,
        email: userEmail!,
        name: userName,
        checkId: check.id,
        externalCheckId,
      });

      return NextResponse.json({
        success: true,
        checkId: check.id,
        redirectUrl,
        message: 'Redirecting to background check provider...',
      });
    }

    // Option 2: Self-service or demo mode
    // In demo mode, auto-approve after a delay (for testing)
    if (process.env.NODE_ENV === 'development' || process.env.DEMO_MODE === 'true') {
      // Schedule auto-approval (in production, this would be a webhook from the provider)
      setTimeout(async () => {
        await supabase
          .from('volunteer_background_checks')
          .update({
            status: 'cleared',
            completed_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
            result_summary: 'Clear - No records found',
            updated_at: new Date().toISOString(),
          })
          .eq('id', check.id);
      }, 5000); // Auto-clear after 5 seconds in dev mode
    }

    return NextResponse.json({
      success: true,
      checkId: check.id,
      status: 'pending',
      message: 'Background check initiated. You will receive an email with next steps.',
    });
  } catch (error) {
    console.error('Failed to start background check:', error);
    return NextResponse.json(
      { error: 'Failed to start background check' },
      { status: 500 }
    );
  }
}

// ============================================================================
// External provider integration (example for Checkr)
// ============================================================================

async function createExternalBackgroundCheck(params: {
  userId: string;
  email: string;
  name: string;
  checkId: string;
  externalCheckId: string;
}): Promise<string> {
  // This is a placeholder for actual provider integration
  // In production, you would:
  // 1. Call the provider's API to create a candidate
  // 2. Create an invitation for the hosted background check flow
  // 3. Return the invitation URL
  
  // Example for Checkr:
  // const response = await fetch('https://api.checkr.com/v1/invitations', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Basic ${btoa(process.env.CHECKR_API_KEY + ':')}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     package: 'PetMayday_volunteer_package',
  //     candidate: {
  //       email: params.email,
  //       first_name: params.name.split(' ')[0],
  //       last_name: params.name.split(' ').slice(1).join(' ') || 'Unknown',
  //     },
  //     tags: ['PetMayday-volunteer'],
  //     custom_id: params.checkId,
  //   }),
  // });
  
  // For demo, return to a status page
  return `/admin/training/background-check?status=pending&id=${params.checkId}`;
}
