# Project Epi - Complete Setup Guide

This is the implementation of **Project Epi**, a care-coordination app that works offline and syncs when connected.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Quick Start](#quick-start)
3. [Supabase Setup](#supabase-setup)
4. [Mobile App (Android/iOS)](#mobile-app)
5. [Clinician Dashboard](#clinician-dashboard)
6. [Testing & QA](#testing--qa)
7. [Deployment](#deployment)

---

## Project Structure

```
project-epi/
├── supabase/                     # Backend infrastructure
│   ├── migrations/
│   │   └── 001_init_schema.sql   # Database schema + RLS policies
│   └── README.md
│
├── mobile/                       # React Native app (iOS + Android)
│   ├── app/                      # Expo Router app structure
│   ├── db/                       # Offline SQLite database
│   ├── lib/                      # Utilities (Supabase, sync, location)
│   ├── components/               # Reusable components
│   ├── package.json
│   ├── app.json
│   ├── tsconfig.json
│   └── .env.local (create locally)
│
└── clinician-web/               # Next.js clinician dashboard
    ├── app/                      # Next.js app structure
    ├── lib/                      # Utilities (Supabase, queries)
    ├── components/               # Reusable components
    ├── package.json
    ├── tsconfig.json
    └── .env.local (create locally)
```

---

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Expo CLI: `npm install -g expo-cli`
- Supabase account (free at supabase.com)
- iOS Xcode or Android Studio (for local testing)
- Git

### 1. Set Up Supabase Backend

```bash
# Go to supabase.com and create a new project
# Once created, note your:
# - Project URL (SUPABASE_URL)
# - Public Anon Key (SUPABASE_ANON_KEY)
# - Service Role Key (for edge functions, keep secret)

# In Supabase dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Copy contents of supabase/migrations/001_init_schema.sql
# 4. Run the query to initialize database

# You should see tables created:
# - profiles, conditions, medications, medication_logs
# - events, observations, care_circle, grants
# - clinician_links, followups, sos_events, audit_log
# - outbox, sync_state
```

### 2. Set Up Mobile App

```bash
cd mobile

# Install dependencies
pnpm install

# Create .env.local
cat > .env.local << EOF
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

# Start development server
pnpm start

# In another terminal, run on Android
pnpm android

# Or on iOS
pnpm ios
```

### 3. Set Up Clinician Dashboard

```bash
cd clinician-web

# Install dependencies
pnpm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF

# Start development server
pnpm dev

# Open http://localhost:3000
```

---

## Supabase Setup

### Database Schema

The schema includes:

**Core Tables:**
- `profiles` - Users and roles (patient, caregiver, clinician)
- `conditions` - Patient conditions
- `medications` - Medication plan (versioned)
- `medication_logs` - "Taken" check-ins (append-only)
- `events` - Logged events (append-only)
- `observations` - Caregiver notes (append-only)

**Social & Access:**
- `care_circle` - Trusted contacts
- `grants` - Consent matrix per category
- `clinician_links` - Patient-clinician relationship

**Clinical:**
- `followups` - Follow-up tasks
- `audit_log` - Access audit (insert-only)

**Sync:**
- `outbox` - Local changes pending sync
- `sync_state` - Last sync timestamp per device

### Row-Level Security (RLS)

Every table has RLS enabled:

1. **Patients** can read/write their own data
2. **Caregivers** can only access categories they've been granted by the patient
3. **Clinicians** can only access verified patient links + granted categories
4. **Audit log** is append-only; patients can read their own

**Key RLS Rules:**
- Access starts empty (no default access)
- Grants are per-category and revocable
- Clinician access requires verification
- Every clinician/caregiver view is audited

### Test the RLS

```sql
-- Sign in as a patient
-- Can see their own medications

-- Sign in as a caregiver with NO grant
-- Should see ZERO medications

-- Have patient grant 'medications' to caregiver
-- Caregiver now sees medications

-- Revoke grant
-- Caregiver sees ZERO medications again
```

---

## Mobile App

### Architecture

```
App Structure:
├── (auth)          # Auth screens
│   ├── login.tsx
│   ├── signup.tsx
│   └── verify.tsx
│
├── (tabs)          # Tab-based navigation
│   ├── home.tsx    # Home (SOS, next med, insights)
│   ├── health.tsx  # Health (events, observations)
│   ├── circle.tsx  # Care Circle (manage contacts, grants)
│   └── records.tsx # Records (documents, conditions)
│
└── sos.tsx         # SOS screen (countdown + SMS fallback)
```

### Key Features

**Offline-First:**
- Local SQLite database with schema from `db/schema.ts`
- Outbox pattern: all writes → SQLite + outbox table
- Sync worker: push outbox → Supabase, pull changes
- Works fully offline; syncs when network returns

**Medication Management:**
- Local reminders scheduled on device
- "Taken" check-ins recorded with real time
- Synced as append-only records (no conflicts)

**Event Logging:**
- Patient/caregiver log events locally
- Attached to medication schedule or manual
- Observations are caregiver notes

**SOS System:**
- 5-second countdown to allow cancel
- Online: Push notifications to emergency contacts
- Offline: SMS fallback to each contact
- Queues if no signal; retries automatically

**Care Circle:**
- Patient invites contacts
- Granular per-category consent
- Activity log shows who viewed what

### Environment Variables

Create `mobile/.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Building for Android

```bash
cd mobile

# For local development
pnpm android

# For production APK (via EAS Build)
pnpm build:android

# Submit to Play Store
pnpm submit:android
```

### Building for iOS

```bash
cd mobile

# For local development
pnpm ios

# For production (via EAS Build)
pnpm build:ios

# Submit to App Store
pnpm submit:ios
```

---

## Clinician Dashboard

### Pages

**Dashboard** (`/dashboard`)
- Patient roster with status (Review/Follow-up/Stable)
- Health trends (last 90 days)
- Events review
- Follow-up queue

**Patients** (`/dashboard/patients`)
- Search and filter
- Patient detail view
- Pre-visit brief (auto-summary)
- Event history

**Follow-ups** (`/dashboard/follow-ups`)
- Queue of outstanding follow-ups
- Due date, patient name, status
- Mark complete or reschedule

**Activity** (`/dashboard/activity`)
- Audit log (who viewed what)
- Timestamp and resource type
- Patient view of their own activity

### Authentication

- Multi-factor sign-in for clinicians (email + password)
- Verification status check
- Session management

### Data Access

- Only shows patients with active clinician_links
- Only shows data within granted categories
- Every view is logged to audit_log
- Auto-clear on grant revocation

### Environment Variables

Create `clinician-web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### Development

```bash
cd clinician-web

pnpm dev

# Open http://localhost:3000
```

---

## Testing & QA

### Unit Tests (Mobile)

```bash
cd mobile
pnpm test
```

### E2E Testing (Mobile)

```bash
# Test offline sync flow
1. Start app in airplane mode
2. Log event + medication taken
3. Observe local database updates
4. Disable airplane mode
5. Observe sync completes
6. Verify data on server

# Test SOS
1. Tap SOS button
2. Confirm countdown appears
3. Observe SMS composed offline
4. Verify audit log created
```

### RLS Testing (Backend)

```bash
# In Supabase SQL Editor

-- Test 1: Caregiver with no grant sees nothing
SELECT * FROM medications WHERE patient_id = $1;
-- Should return 0 rows

-- Test 2: Grant access
INSERT INTO grants (patient_id, grantee_id, category)
VALUES ($1, $2, 'medications');

-- Test 3: Caregiver now sees medications
SELECT * FROM medications WHERE patient_id = $1;
-- Should return rows

-- Test 4: Revoke access
UPDATE grants SET revoked_at = NOW() WHERE ...;

-- Test 5: Access gone
SELECT * FROM medications WHERE patient_id = $1;
-- Should return 0 rows again
```

### Performance Testing

```bash
# Sync performance (with 1000+ medication logs)
# Should complete in < 5 seconds on 4G

# UI responsiveness
# Should handle 500+ events without lag

# Notification delivery
# Push alerts should arrive within 2 seconds online
```

---

## Deployment

### Supabase

No deployment needed—Supabase handles it. Just ensure:
- RLS policies are enabled on all tables
- Backups are configured
- SSL is enforced

### Mobile (Android)

```bash
cd mobile

# 1. Build APK
pnpm build:android

# 2. Test APK locally
adb install app.apk

# 3. Submit to Play Store
pnpm submit:android
```

### Mobile (iOS)

```bash
cd mobile

# 1. Build for TestFlight
pnpm build:ios

# 2. Submit to App Store
pnpm submit:ios
```

### Clinician Web (Next.js)

Option A: Vercel (recommended)
```bash
# Deploy with one click
vercel deploy
```

Option B: Self-hosted
```bash
cd clinician-web

pnpm build
pnpm start

# Or use PM2
pm2 start "pnpm start" --name "epi-clinician"
```

---

## Security Checklist

Before launch, confirm:

- [ ] Encrypt on-device database (SQLite)
- [ ] Use biometric/PIN lock on mobile
- [ ] Enforce RLS on every table
- [ ] Test RLS with each role (see Testing)
- [ ] No API keys in frontend code (only public anon key)
- [ ] Audit log populated for every clinician/caregiver view
- [ ] TLS enforced on all connections
- [ ] Data export/delete available to patients
- [ ] Clinician verification process implemented
- [ ] SMS SMS rate limiting configured
- [ ] Location data only in SOS events

---

## Troubleshooting

### Sync not working

```bash
# Check Supabase connection
curl https://your-supabase-url/rest/v1/ \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY"

# Check outbox entries
SELECT * FROM outbox WHERE synced = false;

# Check network status on device
# Try manual sync after reconnect
```

### RLS denying access

```bash
# In Supabase, check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

# Test policy
SELECT current_user;
SELECT * FROM medications;

# If denied, check grants table
SELECT * FROM grants WHERE grantee_id = current_user_id();
```

### Notifications not working

```bash
# Check permissions (Android/iOS)
# Test notification in Supabase:
INSERT INTO sos_events (patient_id, sent_at, channel, recipients)
VALUES (...);

# Monitor Supabase functions logs
```

---

## Next Steps

1. **Phase 1**: Complete database setup & RLS testing ✓ (you are here)
2. **Phase 2**: Build offline-first mobile app
3. **Phase 3**: Implement SOS and Care Circle
4. **Phase 4**: Build clinician dashboard
5. **Phase 5**: Launch & compliance review

See `PROJECT_EPI_ROADMAP.md` for detailed phase breakdowns.

---

## Support

- Supabase docs: https://supabase.com/docs
- React Native docs: https://reactnative.dev
- Expo docs: https://docs.expo.dev
- Next.js docs: https://nextjs.org/docs
