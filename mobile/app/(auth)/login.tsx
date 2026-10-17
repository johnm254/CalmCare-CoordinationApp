import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { signIn } from '../../lib/supabase';

// ─── Inline icon components (no emoji) ───────────────────────────────────────

function EnvelopeIcon() {
  return (
    <View style={{ width: 18, height: 14, borderWidth: 1.5, borderColor: colors.textMuted, borderRadius: 2 }}>
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: 0, height: 0,
        borderLeftWidth: 9, borderRightWidth: 9, borderTopWidth: 7,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: colors.textMuted,
      }} />
    </View>
  );
}

function LockIcon() {
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        width: 10, height: 7, borderWidth: 1.5, borderColor: colors.textMuted,
        borderBottomWidth: 0, borderRadius: 5, borderBottomLeftRadius: 0, borderBottomRightRadius: 0,
        marginBottom: -1,
      }} />
      <View style={{ width: 14, height: 10, backgroundColor: colors.textMuted, borderRadius: 2, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.inputBg }} />
      </View>
    </View>
  );
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
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

          {/* Hero section */}
          <View style={styles.hero}>
            {/* Concentric rings logo — 80/54/24px */}
            <View style={styles.logoMark}>
              <View style={styles.logoRingOuter} />
              <View style={styles.logoRingMid} />
              <View style={styles.logoCore} />
            </View>
            <Text style={styles.brandName}>duara</Text>
            <Text style={styles.tagline}>Your care, your control</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>
            <Text style={styles.heading}>Sign in</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrap}><EnvelopeIcon /></View>
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
              <View style={styles.inputIconWrap}><LockIcon /></View>
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
  safe: { flex: 1, backgroundColor: '#09090F' },
  flex: { flex: 1 },
  container: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
    minHeight: 280,
  },
  logoMark: {
    width: 80, height: 80,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoRingOuter: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 2.5, borderColor: 'rgba(139,92,246,0.2)',
  },
  logoRingMid: {
    position: 'absolute',
    width: 54, height: 54, borderRadius: 27,
    borderWidth: 2.5, borderColor: 'rgba(139,92,246,0.5)',
  },
  logoCore: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.teal },
  brandName: {
    fontSize: 36, fontWeight: '800', color: colors.teal,
    letterSpacing: 8, marginBottom: spacing.sm,
  },
  tagline: { fontSize: fonts.base, color: colors.textSecondary },

  card: {
    backgroundColor: '#14122A',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#2E2B50',
    padding: 28,
    paddingBottom: 48,
    flex: 1,
  },
  heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },

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
  inputIconWrap: { width: 24, alignItems: 'center', marginRight: spacing.sm },
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
