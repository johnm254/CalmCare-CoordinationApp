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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logoSection}>
            <Text style={styles.logo}>epi</Text>
            <Text style={styles.tagline}>Your care, your control</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.heading}>Good to have you back</Text>
            <Text style={styles.subheading}>Sign in to your account</Text>

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
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />

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
              <Text style={styles.linkText}>New here? </Text>
              <Text style={[styles.linkText, styles.linkTeal]}>Create account</Text>
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
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  logoSection: { alignItems: 'center', marginBottom: spacing.xxl * 2 },
  logo: { fontSize: fonts.xxxl, fontWeight: '800', color: colors.teal, letterSpacing: 2 },
  tagline: { fontSize: fonts.base, color: colors.textSecondary, marginTop: spacing.xs },
  card: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border, padding: spacing.xxl,
  },
  heading: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subheading: { fontSize: fonts.base, color: colors.textSecondary, marginBottom: spacing.xl },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.inputBorder,
    borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    color: colors.text, fontSize: fonts.md, marginBottom: spacing.md,
  },
  btnPrimary: {
    backgroundColor: colors.teal, borderRadius: radius.lg,
    paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm,
  },
  btnDisabled: { opacity: 0.6 },
  btnPrimaryText: { color: '#000', fontWeight: '700', fontSize: fonts.md },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
  linkText: { fontSize: fonts.base, color: colors.textSecondary },
  linkTeal: { color: colors.teal, fontWeight: '600' },
});
