import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { signIn } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      // Navigation handled by onAuthStateChange in _layout.tsx
    } catch (err: any) {
      Alert.alert('Sign in failed', err.message ?? 'Please check your email and password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero section — top 40% */}
          <View style={styles.hero}>
            {/* Duara concentric circle logo */}
            <View style={styles.logoMark}>
              <View style={styles.logoRingOuter} />
              <View style={styles.logoRingMid} />
              <View style={styles.logoCore} />
            </View>
            <Text style={styles.brandName}>duara</Text>
            <Text style={styles.tagline}>Your care, your control</Text>
          </View>

          {/* Form card — bottom 60% */}
          <View style={styles.card}>
            <Text style={styles.heading}>Sign in</Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnPrimaryText}>Sign in</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} style={styles.linkRow}>
              <Text style={styles.linkText}>{"Don't have an account? "}</Text>
              <Text style={[styles.linkText, styles.linkTeal]}>Create one</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1 },

  // Hero
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
    minHeight: 260,
  },
  logoMark: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  logoRingOuter: {
    position: 'absolute',
    width: 56, height: 56, borderRadius: 28,
    borderWidth: 3, borderColor: 'rgba(0,191,166,0.3)',
  },
  logoRingMid: {
    position: 'absolute',
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 3, borderColor: 'rgba(0,191,166,0.6)',
  },
  logoCore: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.teal },
  brandName: {
    fontSize: 32, fontWeight: '800', color: colors.teal,
    letterSpacing: 6, marginBottom: spacing.sm,
  },
  tagline: { fontSize: fonts.base, color: colors.textSecondary },

  // Card
  card: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: 28,
    paddingBottom: 40,
    flex: 1,
  },
  heading: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    paddingLeft: spacing.md,
  },
  inputIcon: { fontSize: 16, marginRight: spacing.sm, opacity: 0.6 },
  input: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fonts.md,
  },

  btnPrimary: {
    backgroundColor: colors.teal,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.md },

  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.md },
  linkText: { fontSize: fonts.base, color: colors.textSecondary },
  linkTeal: { color: colors.teal, fontWeight: '600' },
});
