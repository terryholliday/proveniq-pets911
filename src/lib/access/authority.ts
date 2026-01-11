import { cookies } from 'next/headers';
import { createServerClient } from '@/lib/supabase/client';
import { trainingProgressService } from '@/services/training-progress.service';
import { isTrainingComplete } from '@/lib/roles/moderator-rules';
import type { RoleId } from '@/lib/roles/role-hierarchy';

export type VolunteerAuthorityCapability =
  | 'COMMUNITY_VOLUNTEER'
  | 'TRANSPORT'
  | 'FOSTER'
  | 'EMERGENCY_FOSTER'
  | 'TRAP'
  | 'MODERATOR';

type VolunteerRow = {
  status: 'ACTIVE' | 'INACTIVE' | 'TEMPORARILY_UNAVAILABLE' | 'SUSPENDED';
  capabilities: string[];
};

function capabilityToRoleId(capability: VolunteerAuthorityCapability): RoleId {
  switch (capability) {
    case 'COMMUNITY_VOLUNTEER':
      return 'community_volunteer';
    case 'TRANSPORT':
      return 'transporter';
    case 'FOSTER':
      return 'foster';
    case 'EMERGENCY_FOSTER':
      return 'emergency_foster';
    case 'TRAP':
      return 'trapper';
    case 'MODERATOR':
      return 'moderator';
  }
}

export async function getAuthorityGate(params: { capability: VolunteerAuthorityCapability }): Promise<
  | {
      allowed: true;
      volunteer: VolunteerRow;
      roleId: RoleId;
    }
  | {
      allowed: false;
      reason: 'UNAUTHENTICATED' | 'NO_APPLICATION' | 'NOT_APPROVED' | 'CAPABILITY_NOT_REQUESTED' | 'TRAINING_INCOMPLETE';
      missingTraining?: string[];
    }
> {
  const cookieStore = cookies();
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

  if (error) {
    return { allowed: false, reason: 'NO_APPLICATION' };
  }

  if (!volunteer) {
    return { allowed: false, reason: 'NO_APPLICATION' };
  }

  if (!Array.isArray(volunteer.capabilities) || volunteer.capabilities.length === 0) {
    return { allowed: false, reason: 'CAPABILITY_NOT_REQUESTED' };
  }

  if (!volunteer.capabilities.includes(params.capability)) {
    return { allowed: false, reason: 'CAPABILITY_NOT_REQUESTED' };
  }

  if (volunteer.status !== 'ACTIVE') {
    return { allowed: false, reason: 'NOT_APPROVED' };
  }

  const roleId = capabilityToRoleId(params.capability);
  const completed = await trainingProgressService.getCompletedModuleIds(supabase, user.id);
  const training = isTrainingComplete(roleId, completed);

  if (!training.complete) {
    return { allowed: false, reason: 'TRAINING_INCOMPLETE', missingTraining: training.missing };
  }

  return { allowed: true, volunteer, roleId };
}
