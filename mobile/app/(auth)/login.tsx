import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { router } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors, fonts, radius, spacing } from "../../lib/theme"
import { signIn } from "../../lib/supabase"

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passFocused, setPassFocused] = useState(false)

  // Entrance animations
  const ring1 = useRef(new Animated.Value(0)).current
  const ring2 = useRef(new Animated.Value(0)).current
  const ring3 = useRef(new Animated.Value(0)).current
  const coreS = useRef(new Animated.Value(0)).current
  const titleY = useRef(new Animated.Value(24)).current
  const titleOp = useRef(new Animated.Value(0)).current
  const cardY = useRef(new Animated.Value(60)).current
  const cardOp = useRef(new Animated.Value(0)).current
  const btnScale = useRef(new Animated.Value(1)).current

  // Subtle pulse on the outer ring
  const ringPulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Rings stagger in
    const springRing = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(v, {
          toValue: 1,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
      ])

    springRing(ring1, 150).start()
    springRing(ring2, 310).start()
    springRing(ring3, 460).start()

    // Core dot bounces
    Animated.sequence([
      Animated.delay(380),
      Animated.spring(coreS, {
        toValue: 1,
        tension: 160,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Title slides up
    Animated.sequence([
      Animated.delay(620),
      Animated.parallel([
        Animated.spring(titleY, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
        Animated.timing(titleOp, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Form card slides up
    Animated.sequence([
      Animated.delay(800),
      Animated.parallel([
        Animated.spring(cardY, {
          toValue: 0,
          tension: 60,
          friction: 13,
          useNativeDriver: true,
        }),
        Animated.timing(cardOp, {
          toValue: 1,
          duration: 480,
          useNativeDriver: true,
        }),
      ]),
    ]).start()

    // Subtle outer ring pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1.06,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start()
  }, [])

  async function handleSignIn() {
    if (!email.trim() || !password) return
    setLoading(true)
    try {
      await signIn(email.trim().toLowerCase(), password)
    } catch (err: any) {
      Alert.alert(
        "Sign in failed",
        err.message ?? "Please check your email and password.",
      )
    } finally {
      setLoading(false)
    }
  }

  function onBtnPressIn() {
    Animated.spring(btnScale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start()
  }
  function onBtnPressOut() {
    Animated.spring(btnScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 12,
    }).start()
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — animated logo */}
          <View style={styles.hero}>
            <View style={styles.logoMark}>
              {/* Outer ring */}
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringOuter,
                  {
                    opacity: ring1,
                    transform: [
                      {
                        scale: Animated.multiply(
                          ring1.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.4, 1],
                          }),
                          ringPulse,
                        ),
                      },
                    ],
                  },
                ]}
              />
              {/* Mid ring */}
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringMid,
                  {
                    opacity: ring2,
                    transform: [
                      {
                        scale: ring2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {/* Inner ring */}
              <Animated.View
                style={[
                  styles.ring,
                  styles.ringInner,
                  {
                    opacity: ring3,
                    transform: [
                      {
                        scale: ring3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 1],
                        }),
                      },
                    ],
                  },
                ]}
              />
              {/* Core */}
              <Animated.View
                style={[
                  styles.ringCore,
                  { transform: [{ scale: coreS }], opacity: coreS },
                ]}
              />
            </View>

            <Animated.View
              style={{
                alignItems: "center",
                transform: [{ translateY: titleY }],
                opacity: titleOp,
              }}
            >
              <Text style={styles.brandName}>mojo</Text>
              <Text style={styles.tagline}>Care · Connect · Protect</Text>
            </Animated.View>
          </View>

          {/* Form card */}
          <Animated.View
            style={[
              styles.card,
              { transform: [{ translateY: cardY }], opacity: cardOp },
            ]}
          >
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>
              Sign in to your health dashboard
            </Text>

            {/* Email input */}
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.inputIconWrap}>
                {/* Envelope icon */}
                <View
                  style={{
                    width: 17,
                    height: 12,
                    borderWidth: 1.5,
                    borderColor: emailFocused ? colors.teal : colors.textMuted,
                    borderRadius: 2,
                  }}
                >
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 0,
                      height: 0,
                      borderLeftWidth: 8.5,
                      borderRightWidth: 8.5,
                      borderTopWidth: 6,
                      borderLeftColor: "transparent",
                      borderRightColor: "transparent",
                      borderTopColor: emailFocused
                        ? colors.teal
                        : colors.textMuted,
                    }}
                  />
                </View>
              </View>
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
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Password input */}
            <View
              style={[
                styles.inputWrapper,
                passFocused && styles.inputWrapperFocused,
              ]}
            >
              <View style={styles.inputIconWrap}>
                {/* Lock icon */}
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 9,
                      height: 6,
                      borderWidth: 1.5,
                      borderColor: passFocused ? colors.teal : colors.textMuted,
                      borderBottomWidth: 0,
                      borderRadius: 4,
                      marginBottom: -1,
                    }}
                  />
                  <View
                    style={{
                      width: 13,
                      height: 9,
                      backgroundColor: passFocused
                        ? colors.teal
                        : colors.textMuted,
                      borderRadius: 2,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <View
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: colors.inputBg,
                      }}
                    />
                  </View>
                </View>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!loading}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
              />
            </View>

            {/* Sign in button */}
            <Animated.View style={{ transform: [{ scale: btnScale }] }}>
              <TouchableOpacity
                onPress={handleSignIn}
                onPressIn={onBtnPressIn}
                onPressOut={onBtnPressOut}
                activeOpacity={1}
                disabled={loading}
              >
                <LinearGradient
                  colors={
                    loading ? ["#2E2B50", "#2E2B50"] : ["#8B5CF6", "#6D28D9"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnPrimary}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.btnPrimaryText}>Sign in</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              onPress={() => router.push("/(auth)/signup")}
              style={styles.linkRow}
            >
              <Text style={styles.linkText}>{"Don't have an account? "}</Text>
              <Text style={[styles.linkText, styles.linkTeal]}>Create one</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#09090F" },
  flex: { flex: 1 },
  container: { flexGrow: 1 },

  hero: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing.xxxl + spacing.xl,
    paddingBottom: spacing.xxxl,
    minHeight: 270,
  },
  logoMark: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  ring: { position: "absolute", borderWidth: 2 },
  ringOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderColor: "rgba(139,92,246,0.22)",
  },
  ringMid: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderColor: "rgba(139,92,246,0.45)",
  },
  ringInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderColor: "rgba(139,92,246,0.75)",
  },
  ringCore: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.teal,
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },

  brandName: {
    fontSize: 38,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: 6,
    marginBottom: spacing.xs,
  },
  tagline: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    letterSpacing: 1,
  },

  card: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
    paddingBottom: 48,
    flex: 1,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  heading: {
    fontSize: fonts.xxl,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xxl,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    height: 54,
    gap: spacing.md,
  },
  inputWrapperFocused: {
    borderColor: colors.teal,
    backgroundColor: "rgba(139,92,246,0.05)",
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  inputIconWrap: { width: 20, alignItems: "center" },
  input: { flex: 1, color: colors.text, fontSize: fonts.base, height: "100%" },

  btnPrimary: {
    borderRadius: radius.xl,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: fonts.md,
    letterSpacing: 0.5,
  },

  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  linkText: { fontSize: fonts.sm, color: colors.textSecondary },
  linkTeal: { color: colors.teal, fontWeight: "700" },
})
