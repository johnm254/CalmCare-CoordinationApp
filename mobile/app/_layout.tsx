import { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import type { Session } from '@supabase/supabase-js';
import { supabase, getProfile, type Profile } from '../lib/supabase';
import { colors } from '../lib/theme';

interface AuthContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  session: null,
  profile: null,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function checkForOTAUpdate() {
  try {
    if (__DEV__) return;
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {
    // Silently ignore — network unavailable or update server unreachable
  }
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Bootstrap: check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfile(p);
      }
      setInitialized(true);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
      if (event === 'SIGNED_IN') router.replace('/(tabs)');
      if (event === 'SIGNED_OUT') router.replace('/(auth)/login');
    });

    // OTA update check on launch
    checkForOTAUpdate();

    // Re-check OTA when app foregrounded
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkForOTAUpdate();
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
    };
  }, []);

  // Redirect after auth is resolved
  useEffect(() => {
    if (!initialized) return;
    if (!session) router.replace('/(auth)/login');
  }, [initialized, session]);

  if (!initialized) return null;

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ session, profile, isLoading: !initialized }}>
        <StatusBar style="light" backgroundColor={colors.bg} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="sos" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="insights" />
        </Stack>
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}
