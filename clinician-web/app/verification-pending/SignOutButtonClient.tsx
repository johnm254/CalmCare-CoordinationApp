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
      className="w-full bg-[#EDE8DF] border border-[#D6CFC4] text-[#3A5255] font-semibold rounded-xl hover:bg-[#D6CFC4] hover:text-[#0C1F20] transition-colors min-h-12 px-6 text-sm"
    >
      Sign out
    </button>
  );
}
