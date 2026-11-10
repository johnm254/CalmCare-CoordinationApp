/** @type {import('next').NextConfig} */

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  : '*.supabase.co';

const securityHeaders = [
  // Prevent browsers from MIME-sniffing a response away from the declared Content-Type
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Disallow embedding in iframes — prevents clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Force HTTPS for one year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Minimal referrer — avoids leaking URL params to third parties
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restrict browser features that are unnecessary for a medical dashboard
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=()',
  },
  // Content Security Policy
  // unsafe-inline is required by Next.js 14 App Router for inline scripts/styles.
  // Pair with HSTS + X-Frame-Options to compensate.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js hydration + Tailwind runtime inline scripts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Tailwind utility classes injected via style attributes
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Google Fonts glyphs
      `font-src 'self' https://fonts.gstatic.com data:`,
      // Supabase REST, Auth, Realtime; Resend via server only (no browser fetch)
      `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}`,
      // Supabase Storage bucket images + data URIs for avatars
      `img-src 'self' data: blob: https://${supabaseHost}`,
      // No plugins (Flash etc.)
      "object-src 'none'",
      // Disallow all framing
      "frame-ancestors 'none'",
      // Only navigate to same origin or Supabase auth callbacks
      `form-action 'self' https://${supabaseHost}`,
      // Block mixed content
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

const nextConfig = {
  // Remove the "X-Powered-By: Next.js" header — reduces information leakage
  poweredByHeader: false,

  // Disable source maps in production builds — prevents exposing source code
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  experimental: {},
};

module.exports = nextConfig;
