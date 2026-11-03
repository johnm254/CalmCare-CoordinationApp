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
      className="w-full bg-[#F1F5FA] border border-[#E6ECF2] text-[#5B6B7F] font-semibold rounded-xl hover:bg-[#E6ECF2] hover:text-[#0F1B2D] transition-colors min-h-12 px-6 text-sm"
    >
      Sign out
    </button>
  );
}
