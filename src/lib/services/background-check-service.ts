/**
 * Background Check Service
 * Integration with Checkr API for volunteer verification
 * https://docs.checkr.com/
 */

interface CheckrConfig {
  apiKey: string;
  webhookSecret: string;
}

function getCheckrConfig(): CheckrConfig | null {
  const apiKey = process.env.CHECKR_API_KEY;
  const webhookSecret = process.env.CHECKR_WEBHOOK_SECRET;

  if (!apiKey || !webhookSecret) {
    console.warn('Checkr API credentials not configured');
    return null;
  }

  return { apiKey, webhookSecret };
}

export interface BackgroundCheckRequest {
  volunteerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string; // YYYY-MM-DD
  ssn: string; // Last 4 digits only for basic check
  zipCode: string;
}

export interface BackgroundCheckResult {
  checkrId: string;
  status: 'pending' | 'consider' | 'clear' | 'suspended';
  completedAt: string | null;
  reportUrl: string | null;
  adjudication: 'approved' | 'rejected' | 'pending';
}

/**
 * Initiate background check via Checkr API
 * Package: "basic" (criminal records, sex offender registry)
 */
export async function initiateBackgroundCheck(
  request: BackgroundCheckRequest
): Promise<{ success: boolean; checkrId?: string; error?: string }> {
  const config = getCheckrConfig();
  
  if (!config) {
    return { 
      success: false, 
      error: 'Background check service not configured' 
    };
  }

  try {
    // Create candidate
    const candidateResponse = await fetch('https://api.checkr.com/v1/candidates', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(config.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: request.email,
        phone: request.phone,
        first_name: request.firstName,
        last_name: request.lastName,
        dob: request.dob,
        ssn: request.ssn,
        zipcode: request.zipCode,
      }),
    });

    if (!candidateResponse.ok) {
      const error = await candidateResponse.json();
      console.error('Checkr candidate creation failed:', error);
      return { success: false, error: 'Failed to create candidate' };
    }

    const candidate = await candidateResponse.json();

    // Create report (background check)
    const reportResponse = await fetch('https://api.checkr.com/v1/reports', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(config.apiKey + ':').toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        candidate_id: candidate.id,
        package: 'basic', // or 'pro', 'premium' for more comprehensive checks
      }),
    });

    if (!reportResponse.ok) {
      const error = await reportResponse.json();
      console.error('Checkr report creation failed:', error);
      return { success: false, error: 'Failed to initiate background check' };
    }

    const report = await reportResponse.json();

    // Store checkr_id in volunteers table
    await updateVolunteerCheckrId(request.volunteerId, report.id);

    return { 
      success: true, 
      checkrId: report.id 
    };

  } catch (error) {
    console.error('Background check initiation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Handle Checkr webhook for background check completion
 * Webhook endpoint: POST /api/webhooks/checkr
 */
export async function handleCheckrWebhook(
  payload: any,
  signature: string
): Promise<{ success: boolean }> {
  const config = getCheckrConfig();
  
  if (!config) {
    return { success: false };
  }

  // Verify webhook signature
  // (Implementation depends on Checkr's signature scheme)
  
  const { type, data } = payload;

  if (type === 'report.completed') {
    const report = data.object;
    const volunteerId = await findVolunteerByCheckrId(report.id);

    if (!volunteerId) {
      console.error('Volunteer not found for Checkr report:', report.id);
      return { success: false };
    }

    // Update volunteer record
    await updateVolunteerBackgroundCheck(volunteerId, {
      status: report.status, // 'clear', 'consider', 'suspended'
      completed_at: report.completed_at,
      report_url: report.report_url,
    });

    // Auto-approve if clear, flag for manual review if 'consider'
    if (report.status === 'clear') {
      await approveVolunteer(volunteerId);
    } else if (report.status === 'consider') {
      await flagVolunteerForReview(volunteerId, 'Background check requires manual review');
    } else if (report.status === 'suspended') {
      await suspendVolunteer(volunteerId, 'Background check failed');
    }

    return { success: true };
  }

  return { success: true };
}

/**
 * Manual approval override (admin action)
 */
export async function approveVolunteerManually(
  volunteerId: string,
  adminId: string,
  notes: string
): Promise<{ success: boolean }> {
  try {
    await updateVolunteerBackgroundCheck(volunteerId, {
      status: 'clear',
      completed_at: new Date().toISOString(),
      manual_override: true,
      override_by: adminId,
      override_notes: notes,
    });

    await approveVolunteer(volunteerId);

    return { success: true };
  } catch (error) {
    console.error('Manual approval error:', error);
    return { success: false };
  }
}

// Helper functions (implement with Supabase)

async function updateVolunteerCheckrId(volunteerId: string, checkrId: string): Promise<void> {
  // TODO: Update volunteers table with checkr_report_id
  console.log('Updating volunteer Checkr ID:', volunteerId, checkrId);
}

async function findVolunteerByCheckrId(checkrId: string): Promise<string | null> {
  // TODO: Query volunteers table by checkr_report_id
  console.log('Finding volunteer by Checkr ID:', checkrId);
  return null;
}

async function updateVolunteerBackgroundCheck(volunteerId: string, data: any): Promise<void> {
  // TODO: Update volunteers table with background check results
  console.log('Updating volunteer background check:', volunteerId, data);
}

async function approveVolunteer(volunteerId: string): Promise<void> {
  // TODO: Set volunteer status to ACTIVE, background_check_completed = true
  console.log('Approving volunteer:', volunteerId);
}

async function flagVolunteerForReview(volunteerId: string, reason: string): Promise<void> {
  // TODO: Set volunteer status to PENDING_REVIEW, create admin task
  console.log('Flagging volunteer for review:', volunteerId, reason);
}

async function suspendVolunteer(volunteerId: string, reason: string): Promise<void> {
  // TODO: Set volunteer status to SUSPENDED
  console.log('Suspending volunteer:', volunteerId, reason);
}
