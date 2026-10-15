import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { signUp } from '../../lib/supabase';

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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.logo}>epi</Text>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>You are in control of your data.</Text>

          <View style={styles.roleRow}>
            {(['patient', 'caregiver'] as Role[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
                disabled={loading}
              >
                <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Full name"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            editable={!loading}
          />
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
            placeholder="Password (min. 8 characters)"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  logo: { fontSize: fonts.xxl, fontWeight: '800', color: colors.teal, letterSpacing: 2, textAlign: 'center', marginBottom: spacing.xl },
  heading: { fontSize: fonts.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  subheading: { fontSize: fonts.base, color: colors.textSecondary, marginBottom: spacing.xl },
  roleRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  roleBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bgCard,
  },
  roleBtnActive: { borderColor: colors.teal, backgroundColor: colors.tealDim },
  roleBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: fonts.base },
  roleBtnTextActive: { color: colors.teal },
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
