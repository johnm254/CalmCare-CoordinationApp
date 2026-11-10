import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.epimoyo.health'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/login', '/signup', '/forgot-password'],
        disallow: ['/dashboard/', '/admin/', '/api/', '/mfa-setup', '/mfa-verify', '/verification-pending', '/reset-password'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
