# Project Epi - Quick Start (5 min)

## What You Need

- **Supabase account**: supabase.com (free tier OK)
- **Node.js 18+** and pnpm
- **Expo CLI**: `npm install -g expo-cli`
- **Android Studio** or **Xcode** (for device simulation)

## 1. Set Up Backend (5 min)

```bash
# 1. Create Supabase project
# Go to supabase.com → New Project
# Name: "project-epi"
# Note your: Project URL and Public Anon Key

# 2. Run database schema
# In Supabase → SQL Editor → New Query
# Copy & run: supabase/migrations/001_init_schema.sql

# 3. Create .env file with your keys
# Store these securely:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_ANON_KEY=eyJhbGc...
```

## 2. Test RLS (2 min)

```sql
-- In Supabase SQL Editor

-- Sign in as patient
SELECT auth.uid();  -- Returns your UUID

-- Can see own medications
SELECT * FROM medications WHERE patient_id = auth.uid();

-- Sign in as caregiver (different account)
SELECT * FROM medications WHERE patient_id = '<patient_uuid>';
-- Returns 0 rows (no access)

-- Patient grants access
INSERT INTO grants (patient_id, grantee_id, category)
VALUES ('<patient_uuid>', '<caregiver_uuid>', 'medications');

-- Caregiver now sees medications
SELECT * FROM medications WHERE patient_id = '<patient_uuid>';
-- Returns rows ✓

-- Revoke access
UPDATE grants SET revoked_at = NOW() WHERE ...;

-- Access gone ✓
```

## 3. Run Mobile App (10 min)

```bash
cd mobile

# Install dependencies
pnpm install

# Create .env.local
cat > .env.local << EOF
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EOF

# Start development server
pnpm start

# In terminal, press:
# 'a' for Android (emulator must be running)
# 'i' for iOS simulator
# 'w' for web preview
```

## 4. Run Clinician Dashboard (5 min)

```bash
cd clinician-web

# Install dependencies
pnpm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EOF

# Start dev server
pnpm dev

# Open http://localhost:3000
```

## 5. Test Sign-In Flow

```
Mobile App:
1. Sign in with patient@test.local / TestPass123!
2. Tap "Taken" on medication
3. Observe local SQLite update
4. App syncs to Supabase

Clinician Web:
1. Sign in with clinician@test.local / TestPass123!
2. See patient roster (if clinician_links created)
3. Click on patient → see pre-visit brief
```

---

## Key File Locations

```
supabase/
├── migrations/001_init_schema.sql  ← Database + RLS

mobile/
├── db/schema.ts                    ← SQLite schema
├── db/offline.ts                   ← Local DB operations
├── db/sync.ts                      ← Sync engine
├── lib/supabase.ts                 ← Supabase client
├── app/(auth)/                     ← Auth screens
├── app/(tabs)/                     ← Main app screens
└── package.json                    ← Dependencies

clinician-web/
├── lib/supabase.ts                 ← Supabase client
├── app/dashboard/                  ← Dashboard pages
├── components/                     ← Reusable components
└── package.json                    ← Dependencies
```

---

## Common Commands

```bash
# Mobile
pnpm start                 # Start dev server
pnpm android              # Run on Android emulator
pnpm ios                  # Run on iOS simulator
pnpm build:android        # Build APK
pnpm test                 # Run tests

# Clinician Web
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Start production server
pnpm lint                 # Lint code
```

---

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@test.local | TestPass123! |
| Caregiver | caregiver@test.local | TestPass123! |
| Clinician | clinician@test.local | TestPass123! |

---

## Documentation

- **Setup Guide**: `PROJECT_EPI_SETUP.md`
- **Development**: `DEVELOPMENT_GUIDE.md`
- **Architecture**: See diagram in artifacts
- **Build Scope**: `Project Epi - Build Documentation.md`

---

## Next Steps

1. ✓ Backend set up (Supabase)
2. ✓ Database schema + RLS
3. ✓ Test accounts created
4. → Build mobile app screens
5. → Implement offline sync
6. → Add SOS system
7. → Complete clinician dashboard
8. → Security review
9. → Launch

---

## Support

- Supabase: https://supabase.com/docs
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- Next.js: https://nextjs.org/docs

---

**Version**: 0.1.0  
**Last Updated**: Oct 14, 2026
