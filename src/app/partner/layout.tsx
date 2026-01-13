import { redirect } from 'next/navigation';
import { getPartnerGate } from '@/lib/access/authority';
import PartnerLayoutClient from './PartnerLayoutClient';

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const gate = await getPartnerGate();

  if (!gate.allowed) {
    const errorParam = gate.reason === 'UNAUTHENTICATED' ? '' : `&error=${gate.reason.toLowerCase()}`;
    redirect(`/login?redirectTo=/partner/dashboard${errorParam}`);
  }

  return (
    <PartnerLayoutClient
      organizationId={gate.organizationId}
      organizationName={gate.organizationName}
    >
      {children}
    </PartnerLayoutClient>
  );
}
