import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Animated, AppState, AppStateStatus, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import * as Notifications from 'expo-notifications';
import type { Session } from '@supabase/supabase-js';
import { supabase, getProfile, registerPushToken, type Profile } from '../lib/supabase';
import { colors, fonts, radius, spacing } from '../lib/theme';
import { initializeDB } from '../db/offline';
import { registerNotificationCategories, requestNotificationPermission, getExpoPushToken } from '../lib/notifications';

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

type UpdateStatus = 'idle' | 'downloading' | 'ready';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>('idle');
  const bannerY = useRef(new Animated.Value(80)).current;
  const autoApplyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showBanner() {
    Animated.spring(bannerY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }).start();
  }

  function hideBanner() {
    Animated.timing(bannerY, { toValue: 80, duration: 250, useNativeDriver: true }).start(() => {
      setUpdateStatus('idle');
    });
  }

  async function applyUpdate() {
    if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current);
    try {
      await Updates.reloadAsync();
    } catch {
      hideBanner();
    }
  }

  async function checkForOTAUpdate() {
    try {
      if (__DEV__) return;
      const update = await Updates.checkForUpdateAsync();
      if (!update.isAvailable) return;

      // Show downloading banner — app keeps running normally
      setUpdateStatus('downloading');
      showBanner();

      await Updates.fetchUpdateAsync();

      // Download complete — switch to "ready" state
      setUpdateStatus('ready');

      // Auto-apply after 15 s if user hasn't dismissed
      autoApplyTimer.current = setTimeout(() => applyUpdate(), 15_000);
    } catch {
      hideBanner();
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfile(p);
        // Register push token so SOS push reaches this device
        getExpoPushToken().then((token) => {
          if (token && session.user) registerPushToken(session.user.id, token).catch(() => {});
        });
      }
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      if (session?.user) {
        const p = await getProfile(session.user.id);
        setProfile(p);
        getExpoPushToken().then((token) => {
          if (token && session?.user) registerPushToken(session.user.id, token).catch(() => {});
        });
      } else {
        setProfile(null);
      }
      if (event === 'SIGNED_IN') router.replace('/(tabs)');
      if (event === 'SIGNED_OUT') router.replace('/(auth)/login');
    });

    // Navigate to SOS alert screen when a caregiver taps an SOS push notification
    const notifTapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string | undefined>;
      if (data?.type === 'sos_alert' && data.sos_id) {
        const params = new URLSearchParams({
          sosId: data.sos_id,
          patientName: data.patient_name ?? '',
          lat: data.location_lat ?? '',
          lon: data.location_lon ?? '',
        });
        router.push(`/sos-alert?${params.toString()}`);
      }
    });

    // CR-OFF-02: initialise local SQLite on every app start (idempotent)
    initializeDB().catch(console.error);
    // CR-MED-12: register interactive notification categories (Taken / Snooze + SOS)
    registerNotificationCategories().catch(console.error);
    requestNotificationPermission().catch(console.error);

    checkForOTAUpdate();

    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkForOTAUpdate();
    });

    return () => {
      subscription.unsubscribe();
      appStateSub.remove();
      notifTapSub.remove();
      if (autoApplyTimer.current) clearTimeout(autoApplyTimer.current);
    };
  }, []);

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
          <Stack.Screen name="circle-invite" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="sos-alert" options={{ presentation: 'fullScreenModal' }} />
        </Stack>

        {/* OTA update banner — slides up from bottom, never blocks the app */}
        {updateStatus !== 'idle' && (
          <Animated.View style={[styles.banner, { transform: [{ translateY: bannerY }] }]}>
            {updateStatus === 'downloading' ? (
              <View style={styles.bannerRow}>
                <ActivityIndicator size="small" color={colors.teal} style={styles.bannerIcon} />
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>Downloading update</Text>
                  <Text style={styles.bannerSub}>The app will stay open until it's ready.</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.bannerRow} onPress={applyUpdate} activeOpacity={0.85}>
                <View style={[styles.bannerIconCircle, { backgroundColor: colors.tealDim }]}>
                  <Text style={styles.bannerCheck}>✓</Text>
                </View>
                <View style={styles.bannerText}>
                  <Text style={styles.bannerTitle}>Update ready</Text>
                  <Text style={styles.bannerSub}>Tap to apply — takes 2 seconds.</Text>
                </View>
                <Text style={styles.bannerCta}>Restart</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        )}
      </AuthContext.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 80,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.teal,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 999,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerIcon: {
    marginRight: spacing.md,
  },
  bannerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerCheck: {
    color: colors.teal,
    fontSize: fonts.md,
    fontWeight: '700',
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: fonts.base,
    fontWeight: '700',
  },
  bannerSub: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    marginTop: 2,
  },
  bannerCta: {
    color: colors.teal,
    fontSize: fonts.sm,
    fontWeight: '700',
    marginLeft: spacing.md,
  },
});
