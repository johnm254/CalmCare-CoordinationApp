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
      className="w-full bg-[#0F2040] border border-[#1A3265] text-[#7AAAC8] font-semibold rounded-xl hover:bg-[#1A3265] hover:text-[#EAF4FF] transition-colors min-h-12 px-6 text-sm"
    >
      Sign out
    </button>
  );
}
