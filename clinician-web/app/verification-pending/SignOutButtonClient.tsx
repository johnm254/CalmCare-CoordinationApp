'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase-browser';

export default function SignOutButtonClient() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="w-full bg-[#131029] border border-[#1E1B38] text-[#9490BF] font-semibold rounded-xl hover:bg-[#1E1B38] hover:text-[#EDE8FF] transition-colors min-h-12 px-6 text-sm"
    >
      Sign out
    </button>
  );
}
