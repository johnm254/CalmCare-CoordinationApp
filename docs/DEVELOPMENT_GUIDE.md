# Project Epi - Development Guide

## Phase 1: Foundation (Current)

**Goal**: Set up Supabase with proper schema, RLS policies, and auth.

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in / create account
3. Click "New Project"
4. Fill in:
   - Project name: `project-epi`
   - Database password: (strong password)
   - Region: (closest to your patients)
5. Click "Create new project"
6. Wait for database to initialize (~1 minute)

### Step 2: Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `supabase/migrations/001_init_schema.sql`
4. Paste into query editor
5. Click **Run**
6. Verify success (should see "COMMIT" at bottom)

### Step 3: Get API Keys

In Supabase dashboard:

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (SUPABASE_URL) - e.g., `https://xxxxx.supabase.co`
   - **Public Anon Key** (SUPABASE_ANON_KEY) - starts with `eyJhbGc...`
3. Keep **Service Role Key** secret (for server-side only)

### Step 4: Test RLS with SQL

In SQL Editor, test each rule:

```sql
-- As a patient (your user ID)
SELECT auth.uid(); -- Should return your UUID

-- Can access own medications
SELECT * FROM medications WHERE patient_id = auth.uid();

-- As a caregiver with no grant
-- Switch to a different user (create test account)
SELECT * FROM medications WHERE patient_id = '<patient_uuid>';
-- Should return 0 rows

-- Grant access to caregiver
INSERT INTO grants (patient_id, grantee_id, category, revoked_at)
VALUES (
  '<patient_uuid>',
  '<caregiver_uuid>',
  'medications',
  NULL
);

-- Caregiver now sees medications
SELECT * FROM medications WHERE patient_id = '<patient_uuid>';
-- Should return rows

-- Revoke grant
UPDATE grants
SET revoked_at = NOW()
WHERE patient_id = '<patient_uuid>'
  AND grantee_id = '<caregiver_uuid>';

-- Access gone
SELECT * FROM medications WHERE patient_id = '<patient_uuid>';
-- Should return 0 rows again
```

### Step 5: Create Test Accounts

In Supabase dashboard, go to **Authentication** → **Users**:

1. **Create Patient Account**
   - Email: `patient@test.local`
   - Password: `TestPass123!`
   - User metadata: `{"role": "patient"}`

2. **Create Caregiver Account**
   - Email: `caregiver@test.local`
   - Password: `TestPass123!`
   - User metadata: `{"role": "caregiver"}`

3. **Create Clinician Account**
   - Email: `clinician@test.local`
   - Password: `TestPass123!`
   - User metadata: `{"role": "clinician"}`

### Step 6: Test Auth Flow

```bash
# Test signup
curl -X POST https://your-supabase-url/auth/v1/signup \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "user_metadata": {"role": "patient"}
  }'

# Test sign in
curl -X POST https://your-supabase-url/auth/v1/token?grant_type=password \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

---

## Phase 2: Mobile App (Offline-First)

### Step 1: Initialize Expo Project

```bash
cd mobile
pnpm install
```

### Step 2: Create Environment File

Create `mobile/.env.local`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-key...
```

### Step 3: Set Up Local Database

The database layer is in `db/`:

- `schema.ts` - TypeScript interfaces + SQL schema
- `offline.ts` - SQLite operations (insert, update, delete, query)
- `sync.ts` - Sync orchestration (push outbox, pull changes)

**Key flow:**

```
User action
  ↓
  Insert/update local SQLite
  ↓
  Add to outbox table
  ↓
  On network: Push outbox to Supabase
  ↓
  Pull remote changes
  ↓
  Merge with local database
  ↓
  Update sync_state timestamp
```

### Step 4: Create Auth Screens

Create `app/(auth)/login.tsx`:

```tsx
import { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { supabase } from '@lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // Will navigate to app via auth state listener
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-slate-900">
      <Text className="text-2xl font-bold text-white mb-8">Project Epi</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        className="bg-slate-800 text-white p-4 rounded mb-4"
        placeholderTextColor="#888"
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="bg-slate-800 text-white p-4 rounded mb-6"
        placeholderTextColor="#888"
      />

      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        className="bg-cyan-500 p-4 rounded items-center"
      >
        <Text className="text-white font-bold">
          {loading ? 'Signing in...' : 'Sign In'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Step 5: Create Tab Navigation

Create `app/(tabs)/home.tsx` (main patient home screen):

```tsx
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { supabase } from '@lib/supabase';
import { queryAll } from '@db/offline';

export default function HomeScreen() {
  const [medications, setMedications] = useState([]);
  const [nextMed, setNextMed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Get next medication from local database
      const meds = await queryAll('medications', { active: true });
      setMedications(meds);

      // Find next medication based on schedule
      if (meds.length > 0) {
        setNextMed(meds[0]); // Simplified; implement proper scheduling
      }
    } catch (error) {
      console.error('Error loading medications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-900 px-4 py-6">
      <Text className="text-3xl font-bold text-white mb-8">
        Your care, your control
      </Text>

      {/* SOS Button */}
      <TouchableOpacity className="bg-red-500 rounded-full h-40 items-center justify-center mb-6">
        <Text className="text-white text-5xl font-bold">Hold</Text>
        <Text className="text-white text-lg">to send SOS</Text>
      </TouchableOpacity>

      {/* Next Medication */}
      {nextMed && (
        <View className="bg-slate-800 rounded-lg p-6 mb-6">
          <Text className="text-cyan-400 text-sm">Next medication • {nextMed.schedule.time}</Text>
          <Text className="text-white text-2xl font-bold">{nextMed.name}</Text>
          <Text className="text-gray-400">{nextMed.dose}</Text>
          <TouchableOpacity className="bg-cyan-500 rounded-full p-4 mt-4">
            <Text className="text-white font-bold text-center">Taken</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Navigation Cards */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity className="flex-1 bg-slate-800 rounded-lg p-6 mr-2 items-center">
          <Text className="text-white font-bold">Conditions</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-slate-800 rounded-lg p-6 ml-2 items-center">
          <Text className="text-white font-bold">Care Circle</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row justify-between">
        <TouchableOpacity className="flex-1 bg-slate-800 rounded-lg p-6 mr-2 items-center">
          <Text className="text-white font-bold">My Doctor</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-1 bg-slate-800 rounded-lg p-6 ml-2 items-center">
          <Text className="text-white font-bold">Records</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

### Step 6: Implement Offline Sync

In `app/(tabs)/health.tsx`, add sync trigger:

```tsx
import { useEffect } from 'react';
import { syncData } from '@db/sync';
import { initializeDB } from '@db/offline';
import * as SecureStore from 'expo-secure-store';

export default function HealthScreen() {
  useEffect(() => {
    // Initialize database
    initializeDB().then(() => {
      // Start sync on app load
      syncOnConnectivity();
    });
  }, []);

  const syncOnConnectivity = async () => {
    try {
      const deviceId = await SecureStore.getItemAsync('device_id') ||
        (await SecureStore.setItemAsync('device_id', Date.now().toString()));

      const result = await syncData(deviceId);
      console.log('Sync result:', result);
    } catch (error) {
      console.error('Sync error:', error);
      // Retry later
    }
  };

  // ... rest of component
}
```

---

## Phase 3: SOS & Care Circle

### SOS Implementation

Create `app/sos.tsx`:

```tsx
import { View, Text, TouchableOpacity, Animated, Alert } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@lib/supabase';
import { insert } from '@db/offline';
import * as Location from 'expo-location';
import * as SMS from 'expo-sms';

export default function SOSScreen({ navigation }) {
  const [countdown, setCountdown] = useState(5);
  const [sending, setSending] = useState(false);
  const animatedValue = useRef(new Animated.Value(5)).current;

  useEffect(() => {
    startCountdown();
  }, []);

  const startCountdown = () => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 5000,
      useNativeDriver: false,
    }).start(() => {
      // Auto-send if not cancelled
      if (countdown > 0) {
        sendSOS();
      }
    });
  };

  const sendSOS = async () => {
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Get location
      let location = null;
      try {
        const { coords } = await Location.getCurrentPositionAsync();
        location = { latitude: coords.latitude, longitude: coords.longitude };
      } catch (e) {
        console.log('Location unavailable');
      }

      // Get emergency contacts
      const { data: circle } = await supabase
        .from('care_circle')
        .select('phone, full_name')
        .eq('patient_id', user.id)
        .eq('is_emergency', true);

      // Try online first
      try {
        const { data: sos } = await supabase
          .from('sos_events')
          .insert([
            {
              patient_id: user.id,
              sent_at: new Date().toISOString(),
              channel: 'push',
              location,
              recipients: circle.map(c => c.id),
              status: 'sent',
            },
          ])
          .select();

        // Log locally
        await insert('sos_events', sos[0]);
        Alert.alert('SOS Sent', 'Emergency contacts have been alerted');
      } catch (onlineError) {
        // Fallback to SMS
        if (circle && circle.length > 0) {
          const phones = circle.map(c => c.phone);
          const message = location
            ? `Emergency SOS from Epi app. Location: ${location.latitude}, ${location.longitude}`
            : 'Emergency SOS from Epi app.';

          // Send SMS
          await SMS.sendSMSAsync(phones, message);

          // Log locally
          await insert('sos_events', {
            id: uuidv4(),
            patient_id: user.id,
            sent_at: new Date().toISOString(),
            channel: 'sms',
            location,
            recipients: phones,
            status: 'sent',
          });

          Alert.alert('SOS Sent via SMS', 'SMS sent to emergency contacts');
        }
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
      setSending(false);
    }
  };

  return (
    <View className="flex-1 bg-slate-900 items-center justify-center">
      {/* Countdown Circle */}
      <View className="w-48 h-48 rounded-full border-8 border-red-500 items-center justify-center mb-8">
        <Text className="text-6xl font-bold text-white">{countdown}</Text>
        <Text className="text-gray-400">seconds</Text>
      </View>

      <Text className="text-2xl font-bold text-white mb-2">Sending your SOS</Text>
      <Text className="text-gray-400 mb-12">
        Your emergency contacts will be alerted with your live location.
      </Text>

      {/* Status */}
      <View className="w-full px-6 mb-6">
        <Text className="text-sm text-cyan-400 font-bold mb-3">Push alert</Text>
        <Text className="text-gray-400">Used when you are online</Text>

        <Text className="text-sm text-cyan-400 font-bold mt-4 mb-3">SMS fallback</Text>
        <Text className="text-gray-400">Used when you have no internet</Text>
      </View>

      {/* Buttons */}
      <TouchableOpacity
        onPress={sendSOS}
        disabled={sending}
        className="w-full mx-6 bg-red-500 p-4 rounded-full mb-4"
      >
        <Text className="text-white font-bold text-center text-lg">Send now</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        className="w-full mx-6 border border-gray-500 p-4 rounded-full"
      >
        <Text className="text-white font-bold text-center">Cancel, I am okay</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## Phase 4: Clinician Dashboard

### Set Up Next.js App

```bash
cd clinician-web

# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc..." >> .env.local

# Start dev server
pnpm dev
```

### Create Dashboard Layout

Create `app/dashboard/layout.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@lib/supabase';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push('/auth/login');
      } else {
        setUser(user);
      }
    });
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center">
            <span className="font-bold text-sm">E</span>
          </div>
          <span className="font-bold">Epi Clinic</span>
        </div>

        <nav className="space-y-2">
          <Link
            href="/dashboard"
            className="block px-4 py-2 rounded hover:bg-slate-800"
          >
            Patient management
          </Link>
          <Link
            href="/dashboard/trends"
            className="block px-4 py-2 rounded hover:bg-slate-800"
          >
            Health trends
          </Link>
          <Link
            href="/dashboard/events"
            className="block px-4 py-2 rounded hover:bg-slate-800"
          >
            Events review
          </Link>
          <Link
            href="/dashboard/follow-ups"
            className="block px-4 py-2 rounded hover:bg-slate-800"
          >
            Follow-up management
          </Link>
        </nav>

        <div className="mt-auto">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/auth/login');
            }}
            className="w-full px-4 py-2 bg-slate-800 rounded hover:bg-slate-700"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
```

### Create Patient Roster Page

Create `app/dashboard/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase, getClinicianPatients, logAccess } from '@lib/supabase';

export default function DashboardPage() {
  const [patients, setPatients] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      const patientsData = await getClinicianPatients(user.id);
      setPatients(patientsData);

      // Log access
      await logAccess(user.id, user.id, 'viewed_patient_roster');
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Today across your patients</h1>
        <button className="px-4 py-2 bg-slate-800 text-white rounded">
          Request access
        </button>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="px-6 py-3 text-left font-bold">Patient</th>
              <th className="px-6 py-3 text-left font-bold">Last Event</th>
              <th className="px-6 py-3 text-left font-bold">Medication</th>
              <th className="px-6 py-3 text-left font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient) => (
              <tr key={patient.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4">{patient.profiles?.full_name}</td>
                <td className="px-6 py-4">Today, 07:40</td>
                <td className="px-6 py-4">On schedule</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                    Review
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Testing Checklist

- [ ] Supabase database initialized
- [ ] RLS policies tested with each role
- [ ] Mobile app builds on Android
- [ ] Offline event logging works
- [ ] Sync pushes outbox to server
- [ ] SOS sends push notification online
- [ ] SOS sends SMS offline
- [ ] Clinician dashboard loads patient roster
- [ ] Audit log tracks all accesses

---

## Next Steps

1. Complete mobile UI screens
2. Test offline sync thoroughly
3. Build SOS SMS integration
4. Deploy clinician web dashboard
5. Run compliance & security review

See `PROJECT_EPI_SETUP.md` for detailed deployment instructions.
