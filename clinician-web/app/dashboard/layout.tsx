import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import Sidebar from '../../components/layout/Sidebar';
import InactivityLogout from '../../components/InactivityLogout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Role check
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile.role !== 'clinician' && profile.role !== 'admin')) {
    redirect('/login');
  }

  // Verification gate — admin bypasses verification check
  if (profile.role === 'clinician') {
    const { data: verification } = await supabase
      .from('clinician_verifications')
      .select('status, expires_at')
      .eq('clinician_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // No verification row at all, or status is not 'verified', or licence expired
    if (!verification) {
      redirect('/verification-pending');
    }

    const isExpired =
      verification.status === 'expired' ||
      (verification.expires_at && new Date(verification.expires_at) < new Date());

    if (isExpired || verification.status !== 'verified') {
      redirect('/verification-pending');
    }
  }

  // MFA assurance gate
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aalData && aalData.nextLevel === 'aal2' && aalData.currentLevel !== 'aal2') {
    redirect('/mfa-verify');
  }

  return (
    <div className="flex min-h-screen bg-[#070D1A]">
      <InactivityLogout redirectTo="/login" />
      <Sidebar profile={profile} />
      <main className="flex-1 ml-60 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
