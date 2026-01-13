import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import type { VolunteerCapability, VolunteerStatus } from '@/lib/types/volunteer';

type VolunteerRow = {
  status: VolunteerStatus;
  capabilities: VolunteerCapability[];
};

const ROLE_TRAINING_PATHS: Record<'COMMUNITY_VOLUNTEER' | 'TRANSPORT' | 'MODERATOR' | 'SYSOP' | 'PARTNER', string[]> = {
  COMMUNITY_VOLUNTEER: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety'],
  TRANSPORT: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'trn101/vehicle-setup'],
  MODERATOR: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'mod101/code-of-conduct'],
  SYSOP: ['vol101/orientation', 'vol101/platform-basics', 'vol101/safety', 'mod101/code-of-conduct'],
  PARTNER: [], // Partners don't require volunteer training
};

function requiredTrainingForCapability(capability: VolunteerCapability): string[] {
  switch (capability) {
    case 'TRANSPORT':
    case 'VET_TRANSPORT':
    case 'SHELTER_TRANSPORT':
      return ROLE_TRAINING_PATHS.TRANSPORT;
    case 'MODERATOR':
      return ROLE_TRAINING_PATHS.MODERATOR;
    case 'SYSOP':
      return ROLE_TRAINING_PATHS.SYSOP;
    case 'PARTNER':
      return ROLE_TRAINING_PATHS.PARTNER;
    default:
      return ROLE_TRAINING_PATHS.COMMUNITY_VOLUNTEER;
  }
}

export async function getAuthorityGate(params: { capability: VolunteerCapability }): Promise<
  | { allowed: true; volunteer: VolunteerRow }
  | {
      allowed: false;
      reason: 'UNAUTHENTICATED' | 'NO_APPLICATION' | 'NOT_APPROVED' | 'CAPABILITY_NOT_REQUESTED' | 'TRAINING_INCOMPLETE';
      missingTraining?: string[];
    }
> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  const { data: volunteer, error } = await supabase
    .from('volunteers')
    .select('status, capabilities')
    .eq('user_id', user.id)
    .maybeSingle<VolunteerRow>();

  if (error || !volunteer) {
    return { allowed: false, reason: 'NO_APPLICATION' };
  }

  const capabilities: VolunteerCapability[] = Array.isArray(volunteer.capabilities) ? volunteer.capabilities : [];
  if (capabilities.length === 0 || !capabilities.includes(params.capability)) {
    return { allowed: false, reason: 'CAPABILITY_NOT_REQUESTED' };
  }

  if (volunteer.status !== 'ACTIVE') {
    return { allowed: false, reason: 'NOT_APPROVED' };
  }

  const required = requiredTrainingForCapability(params.capability);
  const { data: completions, error: completionError } = await supabase
    .from('training_module_completions')
    .select('module_id')
    .eq('user_id', user.id);

  if (completionError) {
    // Fail-closed: if we cannot verify training, require completion.
    return { allowed: false, reason: 'TRAINING_INCOMPLETE', missingTraining: required };
  }

  const completed = new Set<string>((completions || []).map((c: any) => String(c.module_id)));
  const missingTraining = required.filter((moduleId) => !completed.has(moduleId));

  if (missingTraining.length > 0) {
    return { allowed: false, reason: 'TRAINING_INCOMPLETE', missingTraining };
  }

  return { allowed: true, volunteer };
}

/**
 * Partner-specific auth gate
 * Returns organization info if user has PARTNER capability
 */
export async function getPartnerGate(): Promise<
  | { allowed: true; userId: string; organizationId: string; organizationName: string }
  | { allowed: false; reason: 'UNAUTHENTICATED' | 'NOT_A_PARTNER' | 'NO_ORGANIZATION' }
> {
  const cookieStore = await cookies();
  const supabase = createServerClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, reason: 'UNAUTHENTICATED' };
  }

  // Check if user has PARTNER capability
  const { data: volunteer } = await supabase
    .from('volunteers')
    .select('capabilities')
    .eq('user_id', user.id)
    .maybeSingle();

  const capabilities: VolunteerCapability[] = Array.isArray(volunteer?.capabilities) ? volunteer.capabilities : [];
  
  if (!capabilities.includes('PARTNER')) {
    return { allowed: false, reason: 'NOT_A_PARTNER' };
  }

  // Get partner's organization
  const { data: partnerOrg } = await supabase
    .from('partner_users')
    .select('organization_id, organizations(id, name)')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!partnerOrg?.organization_id) {
    return { allowed: false, reason: 'NO_ORGANIZATION' };
  }

  return {
    allowed: true,
    userId: user.id,
    organizationId: partnerOrg.organization_id,
    organizationName: (partnerOrg.organizations as any)?.name || 'Unknown Organization',
  };
}
