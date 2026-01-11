import { redirect } from 'next/navigation';

export default function LegacyModeratorRedirectPage() {
  redirect('https://lostpets911.org/admin/mods');
}
