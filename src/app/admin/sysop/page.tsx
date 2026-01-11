import { redirect } from 'next/navigation';
import SysopDashboard from './dashboard';
import { getAuthorityGate } from '@/lib/access/authority';

export default async function SysopPage() {
  const gate = await getAuthorityGate({ capability: 'SYSOP' });

  if (!gate.allowed) {
    if (gate.reason === 'UNAUTHENTICATED') {
      redirect('/login?redirectTo=' + encodeURIComponent('/admin/sysop'));
    }

    if (gate.reason === 'NO_APPLICATION' || gate.reason === 'CAPABILITY_NOT_REQUESTED') {
      redirect('/unauthorized?reason=sysop_required');
    }

    if (gate.reason === 'NOT_APPROVED') {
      redirect('/helpers/dashboard');
    }

    if (gate.reason === 'TRAINING_INCOMPLETE') {
      redirect('/training');
    }

    redirect('/');
  }

  return <SysopDashboard />;
}
