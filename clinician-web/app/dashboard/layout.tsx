import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase-server';
import Sidebar from '../../components/layout/Sidebar';
import InactivityLogout from '../../components/InactivityLogout';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'clinician') redirect('/login');

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
