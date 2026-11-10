# epimoyo — Go-Live Checklist

> Generated: 2026-11-10  
> Status: **Pre-launch** — all code is production-ready; the items below are infrastructure, secrets, and store-submission tasks that require manual action before the first real users onboard.

---

## 1. Supabase — Backend

| # | Task | Owner | Done |
|---|------|-------|------|
| 1.1 | Copy the **service_role key** from Supabase Dashboard → Project Settings → API and paste it into Vercel env (`SUPABASE_SERVICE_ROLE_KEY`) and local `.env.local` | DevOps | ☐ |
| 1.2 | Enable **pg_cron** and **pg_net** extensions in Supabase Dashboard → Database → Extensions | DevOps | ☐ |
| 1.3 | Re-run **migration 014** after enabling pg_cron (it sets up the scheduled cron jobs) | DevOps | ☐ |
| 1.4 | Deploy all **5 Edge Functions** via `supabase functions deploy` from the `supabase/functions/` directory | DevOps | ☐ |
| 1.5 | Create the **first admin user** in Supabase Auth console and set their role to `admin` in the `profiles` table | DevOps | ☐ |
| 1.6 | Run the **pgTAP test suite** (`supabase test db`) and confirm all RLS policy tests pass | DevOps | ☐ |

---

## 2. Environment Variables — Vercel

All variables below must be added in **Vercel Dashboard → Project → Settings → Environment Variables** for Production (and optionally Preview).

| Variable | Value source | Done |
|----------|-------------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Project Settings → API | ☐ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API | ☐ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → service_role | ☐ |
| `RESEND_API_KEY` | resend.com → API Keys | ☐ |
| `RESEND_FROM_EMAIL` | `epimoyo SOS <sos@epimoyo.health>` — after domain verified in Resend | ☐ |
| `AT_API_KEY` | account.africastalking.com → API Key | ☐ |
| `AT_USERNAME` | `epimoyo` (production username — not `sandbox`) | ☐ |
| `AT_SENDER_ID` | Approved sender ID from Africa's Talking | ☐ |
| `AT_WEBHOOK_SECRET` | Generate: `openssl rand -hex 32` | ☐ |
| `CRON_SECRET` | Generate: `openssl rand -hex 32` | ☐ |
| `NEXT_PUBLIC_SITE_URL` | `https://epimoyo.health` (production domain) | ☐ |

---

## 3. Domain & Email

| # | Task | Done |
|---|------|------|
| 3.1 | Register domain `epimoyo.health` and point DNS to Vercel | ☐ |
| 3.2 | Add domain to Vercel project and confirm SSL certificate issued | ☐ |
| 3.3 | Add and **verify sending domain** in Resend dashboard (`epimoyo.health`) — required before switching `RESEND_FROM_EMAIL` away from `onboarding@resend.dev` | ☐ |
| 3.4 | Confirm MX records exist for `support@epimoyo.health` and `privacy@epimoyo.health` to receive replies | ☐ |

---

## 4. Africa's Talking SMS

| # | Task | Done |
|---|------|------|
| 4.1 | Sign B2B contract with Africa's Talking | ☐ |
| 4.2 | Move account from **sandbox** to **live** mode | ☐ |
| 4.3 | Register and get approved **sender ID** | ☐ |
| 4.4 | Update `AT_USERNAME` from `sandbox` → production username in Vercel env | ☐ |
| 4.5 | Set the **inbound SMS webhook URL** in AT dashboard: `https://epimoyo.health/api/sms-reply?secret=AT_WEBHOOK_SECRET_VALUE` | ☐ |

---

## 5. Mobile App — EAS Build & Store Submission

| # | Task | Done |
|---|------|------|
| 5.1 | Configure `eas.json` with production credentials (Apple Team ID, Android keystore) | ☐ |
| 5.2 | Run `eas build --platform ios --profile production` | ☐ |
| 5.3 | Run `eas build --platform android --profile production` | ☐ |
| 5.4 | Submit iOS build to **App Store Connect** and complete app review metadata (screenshots, description, privacy URL → `https://epimoyo.health/privacy`) | ☐ |
| 5.5 | Submit Android build to **Google Play Console** and complete store listing | ☐ |
| 5.6 | Complete **Apple HealthKit** entitlement review (required because the app reads health data) | ☐ |
| 5.7 | Enable **internal testing** track on both stores and distribute to QA team before public release | ☐ |

---

## 6. Security — Post-Deploy

| # | Task | Done |
|---|------|------|
| 6.1 | Upgrade `@supabase/ssr` from `0.0.10` to `^0.6.0` — requires updating cookie handling in `middleware.ts` and `lib/supabase-server.ts` to the new `getAll`/`setAll` API | ☐ |
| 6.2 | Upgrade `eslint` from deprecated v8 to v9 | ☐ |
| 6.3 | Upgrade `recharts` from v2 to v3 (v2 is no longer maintained) | ☐ |
| 6.4 | Enable **Supabase Auth email confirmation** in Dashboard → Authentication → Settings (disable "confirm email" is off by default in some projects) | ☐ |
| 6.5 | Set up **Vercel Web Analytics** or connect GA4 (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) after domain is live | ☐ |
| 6.6 | Configure **Supabase database backups** (daily PITR enabled in paid plan) | ☐ |

---

## 7. Legal & Compliance

| # | Task | Done |
|---|------|------|
| 7.1 | Register **epimoyo Health Ltd** as a business entity | ☐ |
| 7.2 | Register with the **Office of the Data Protection Commissioner (ODPC)** as a data controller (Kenya DPA 2019, s. 18) | ☐ |
| 7.3 | Obtain approval from **Kenya Medical Practitioners and Dentists Council (KMPDC)** or equivalent if required for a health platform | ☐ |
| 7.4 | Complete **Apple Health Records** data use agreement if integrating with health records in future | ☐ |

---

## 8. Operational Readiness

| # | Task | Done |
|---|------|------|
| 8.1 | Set up **error monitoring** (Sentry or equivalent) and wire `SENTRY_DSN` env var | ☐ |
| 8.2 | Set up **uptime monitoring** (e.g. Better Uptime, UptimeRobot) on `https://epimoyo.health` | ☐ |
| 8.3 | Define an **on-call rotation** for SOS alert system failures | ☐ |
| 8.4 | Write a **runbook** for the SOS notification pipeline so on-call engineers can triage quickly | ☐ |
| 8.5 | Perform a **load test** (k6 or Locust) targeting 100K concurrent users on the Supabase Realtime and SOS endpoints | ☐ |

---

## What is already done ✓

- All Supabase migrations (001–014) written and tested
- RLS enabled on all 50+ tables with role-based policies
- 5 Edge Functions implemented (follow-up reminders, missed-dose alerts, SOS escalation, etc.)
- Clinician portal (dashboard, patient profiles, ECG viewer, alert rules, follow-ups)
- Admin portal (clinician management, feature flags, DPA requests, incident log, analytics)
- Patient landing page with animated hero, app showcase, privacy policy, terms of service
- Mobile app (Today, Seizures, Medications, Care Circle, Me screens; SOS flow; epimoyo Strap pairing UI)
- OTA updates configured (Expo EAS Update)
- Security hardening: CSP headers, HSTS, rate limiting, webhook signature verification, IDOR fix on register-verification, source maps disabled in production
- Password strength enforcement on signup
- MFA (TOTP) gate on clinician dashboard and admin portal
- Clinician verification workflow
- Kenya DPA 2019-compliant privacy policy and terms of service at `/privacy` and `/terms`
