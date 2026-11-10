import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value, ...options } as any); } catch {}
        },
        remove(name: string, options: Record<string, unknown>) {
          try { cookieStore.set({ name, value: '', ...options } as any); } catch {}
        },
      },
      global: {
        // 10s timeout prevents serverless functions from hanging under load.
        // Enable PgBouncer in Supabase dashboard (Settings → Database →
        // Connection Pooling → Transaction mode) before deploying at scale.
        fetch: (url: RequestInfo | URL, options: RequestInit = {}) =>
          fetch(url, { ...options, signal: AbortSignal.timeout(10_000) }),
      },
    }
  );
}
