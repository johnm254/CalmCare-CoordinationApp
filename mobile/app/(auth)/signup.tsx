import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { signUp } from '../../lib/supabase';

// ─── Inline icon components (no emoji) ───────────────────────────────────────

function PersonIcon() {
  return (
    <View style={{ width: 16, height: 18, alignItems: 'center' }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted, marginBottom: 2 }} />
      <View style={{
        width: 16, height: 8, borderTopLeftRadius: 8, borderTopRightRadius: 8,
        backgroundColor: colors.textMuted,
      }} />
    </View>
  );
}

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

type Role = 'patient' | 'caregiver';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('patient');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, name.trim(), role);
      Alert.alert(
        'Check your email',
        'We sent you a confirmation link. Click it to activate your account, then sign in.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      Alert.alert('Sign up failed', err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero section — slightly smaller for signup */}
          <View style={styles.hero}>
            <View style={styles.logoMark}>
              <View style={styles.logoRingOuter} />
              <View style={styles.logoRingMid} />
              <View style={styles.logoCore} />
            </View>
            <Text style={styles.heroHeading}>Create account</Text>
            <Text style={styles.tagline}>Join Duara to manage your epilepsy care</Text>
          </View>

          {/* Form card */}
          <View style={styles.card}>

            {/* Role picker */}
            <View style={styles.roleRow}>
              {(['patient', 'caregiver'] as Role[]).map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                  onPress={() => setRole(r)}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                    {r === 'patient' ? 'Patient' : 'Caregiver'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIconWrap}><PersonIcon /></View>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

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
                placeholder="Password (min. 8 characters)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[styles.btnPrimary, loading && styles.btnDisabled]}
              onPress={handleCreate}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#000" />
                : <Text style={styles.btnPrimaryText}>Create account</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkRow}>
              <Text style={styles.linkText}>Already have an account? </Text>
              <Text style={[styles.linkText, styles.linkTeal]}>Sign in</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070D1A' },
  flex: { flex: 1 },
  container: { flexGrow: 1 },

  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxl,
    minHeight: 220,
  },
  logoMark: {
    width: 60, height: 60,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoRingOuter: {
    position: 'absolute',
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: 'rgba(0,191,166,0.2)',
  },
  logoRingMid: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: 'rgba(0,191,166,0.5)',
  },
  logoCore: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.teal },
  heroHeading: {
    fontSize: 28, fontWeight: '800', color: colors.text,
    marginBottom: spacing.xs,
  },
  tagline: { fontSize: fonts.sm, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xxl },

  card: {
    backgroundColor: '#0D1B35',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1A3265',
    padding: 28,
    paddingBottom: 48,
    flex: 1,
  },

  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  roleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.bgCardAlt,
  },
  roleBtnActive: { borderColor: colors.teal, backgroundColor: colors.teal },
  roleBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: fonts.base },
  roleBtnTextActive: { color: '#000', fontWeight: '700' },

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
