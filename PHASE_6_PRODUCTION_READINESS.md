# Phase 6: Production Readiness (Go-Live)

> Status: In Progress  
> Reference: GO_LIVE_CHECKLIST.md  
> Target: All items ready for production deployment

## Overview

Phase 6 focuses on infrastructure setup, security hardening, dependency upgrades, and operational readiness. This phase does NOT add features, but rather prepares the complete system for real users and emergencies.

## Phase 6 Worksheets

### WS1: Security & Dependency Upgrades ⏳
- Upgrade @supabase/ssr from 0.0.10 → ^0.6.0
  - Update middleware.ts cookie handling
  - Update lib/supabase-server.ts to new API
- Upgrade eslint from v8 → v9
- Upgrade recharts from v2 → v3
- Verify no security vulnerabilities (npm audit)
- Target: All deps current, security patches applied

### WS2: Error Monitoring & Observability ⏳
- Set up Sentry integration
- Configure error tracking in mobile app
- Add Sentry to clinician-web
- Wire SENTRY_DSN in .env
- Test error capture pipeline

### WS3: Mobile Production Build Config ⏳
- Configure eas.json with production credentials
- Set up iOS certificate and provisioning profiles
- Configure Android keystore
- Create production build profiles
- Test internal builds before store submission

### WS4: Environment Variables & Secrets ⏳
- Document all required env vars
- Create .env.production templates
- Verify Vercel env setup checklist
- Set up secure secret rotation strategy

### WS5: Supabase Backend Verification ⏳
- Verify all 14 migrations applied
- Run pgTAP test suite (all RLS policies)
- Deploy all 5 Edge Functions
- Test cron job schedule
- Verify webhook endpoints

### WS6: Operational Readiness ⏳
- Set up error monitoring alerts
- Configure uptime monitoring
- Create SOS pipeline runbook
- Define on-call rotation
- Load test simulation (k6)

## Checklist Mapping

| Go-Live Section | Phase 6 WS | Status |
|---|---|---|
| 1. Supabase Backend | WS5 | ⏳ |
| 2. Vercel Environment | WS4 | ⏳ |
| 3. Domain & Email | Manual | — |
| 4. Africa's Talking SMS | Manual | — |
| 5. Mobile App Store | WS3 | ⏳ |
| 6. Security Post-Deploy | WS1 | ⏳ |
| 7. Legal & Compliance | Manual | — |
| 8. Operational Readiness | WS2, WS6 | ⏳ |

## Already Completed (Per GO_LIVE_CHECKLIST)

✅ All Supabase migrations (001–014)  
✅ RLS policies on 50+ tables  
✅ 5 Edge Functions implemented  
✅ Clinician portal & dashboards  
✅ Admin portal  
✅ Patient landing page  
✅ Mobile app (all screens + SOS)  
✅ OTA updates configured  
✅ Security hardening (CSP, HSTS, rate limiting, IDOR fixes)  
✅ Password strength + MFA  
✅ Clinician verification workflow  
✅ Kenya DPA 2019 compliance docs  

## Manual Tasks (Out of Scope for This Phase)

⚠️ Domain registration & DNS  
⚠️ Email setup & verification  
⚠️ Africa's Talking SMS integration & sender ID  
⚠️ Apple/Google store accounts  
⚠️ Legal entity registration  
⚠️ ODPC & KMPDC registrations  

---

## Next: WS1 — Security & Dependency Upgrades

Starting now...
