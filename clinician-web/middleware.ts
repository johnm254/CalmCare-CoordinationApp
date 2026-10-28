import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...options } as any);
          response.cookies.set({ name, value, ...options } as any);
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...options } as any);
          response.cookies.set({ name, value: '', ...options } as any);
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // ── Unauthenticated → login ────────────────────────────────────────────────
  if (!session) {
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    return response;
  }

  // ── Authenticated: gates for /dashboard/* ─────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    // Fetch role once
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role;

    // Only clinicians (and admins standing in) may use the dashboard
    if (role !== 'clinician' && role !== 'admin' && role !== 'org_admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (role === 'clinician') {
      // Gate 1 — MFA: if user has a TOTP factor enrolled, they must be at AAL2
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
        return NextResponse.redirect(new URL('/mfa-verify', request.url));
      }

      // Gate 2 — Verification: must have an approved clinician_verifications row
      // Skip check if already on the verification-pending page to avoid redirect loop
      if (!pathname.startsWith('/verification-pending')) {
        const { data: verification } = await supabase
          .from('clinician_verifications')
          .select('status')
          .eq('clinician_id', session.user.id)
          .eq('status', 'verified')
          .maybeSingle();

        if (!verification) {
          return NextResponse.redirect(new URL('/verification-pending', request.url));
        }
      }
    }
  }

  // ── Authenticated: gates for /admin/* ────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const role = profile?.role;

    // Only admins and org_admins may use the admin portal
    if (role !== 'admin' && role !== 'org_admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // MFA required for admin portal
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === 'aal2' && aal.currentLevel !== 'aal2') {
      return NextResponse.redirect(new URL('/mfa-verify', request.url));
    }
  }

  // ── Already logged in → skip login pages ──────────────────────────────────
  if (pathname === '/login' || pathname === '/admin/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const dest = (profile?.role === 'admin' || profile?.role === 'org_admin')
      ? '/admin'
      : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/login', '/admin/login'],
};
