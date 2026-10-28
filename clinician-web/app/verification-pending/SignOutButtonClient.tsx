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
      className="w-full bg-[#1C1A35] border border-[#2E2B50] text-[#9B96C0] font-semibold rounded-xl hover:bg-[#2E2B50] hover:text-[#F5F0FF] transition-colors min-h-12 px-6 text-sm"
    >
      Sign out
    </button>
  );
}
