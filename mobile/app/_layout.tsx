import { useEffect, createContext, useContext, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Updates from 'expo-updates';
import { MOCK_USER } from '../lib/mock-data';
import { colors } from '../lib/theme';

interface AuthContextType {
  user: typeof MOCK_USER | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: MOCK_USER,
  isLoading: false,
});

export function useAuth() {
  return useContext(AuthContext);
}

async function checkForOTAUpdate() {
  try {
    if (__DEV__) return; // skip in development
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      // Apply on next launch — current session is uninterrupted
      await Updates.reloadAsync();
    }
  } catch {
    // Network unavailable or update server unreachable — silently ignore
  }
}

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        const { initializeDB } = await import('../db/offline');
        await initializeDB();
      } catch {
        // SQLite not available in Expo Go without native build — ignore
      } finally {
        setIsReady(true);
      }
    }
    prepare();

    // Check for OTA update on launch
    checkForOTAUpdate();

    // Re-check whenever the app comes back to the foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') checkForOTAUpdate();
    });
    return () => sub.remove();
  }, []);

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <AuthContext.Provider value={{ user: MOCK_USER, isLoading: false }}>
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
