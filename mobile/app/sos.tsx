import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../lib/theme';
import { useAuth } from './_layout';
import { getEmergencyContacts, sendSos } from '../lib/supabase';

const CIRCLE_SIZE = 220;
const TOTAL_SECONDS = 5;

// ─── Geometric status badge icon ─────────────────────────────────────────────

function ReadyDot() {
  return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 6 }} />;
}

export default function SOSScreen() {
  const { session } = useAuth();
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [sent, setSent] = useState(false);
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [contactIds, setContactIds] = useState<string[]>([]);

  // Shrinking border animation (fake progress ring via scale)
  const borderAnim = useRef(new Animated.Value(1)).current;
  // Pulse ring animation
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;
  const sentRef = useRef(false);

  useEffect(() => {
    if (!session?.user) return;
    getEmergencyContacts(session.user.id).then((contacts) => {
      setEmergencyCount(contacts.length);
      setContactIds(contacts.map((c) => c.member_id));
    });
  }, [session]);

  useEffect(() => {
    // Border color animation (red -> shrinks as time progresses)
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: TOTAL_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    // Pulsing outer ring
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1.18, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    ).start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          if (!sentRef.current) {
            sentRef.current = true;
            doSend();
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  async function doSend() {
    if (session?.user && contactIds.length > 0) {
      await sendSos(session.user.id, contactIds);
    }
    setSent(true);
  }

  function handleSendNow() {
    if (!sentRef.current) {
      sentRef.current = true;
      doSend();
    }
  }

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.emergency, colors.emergency],
  });

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Top label */}
        <View style={styles.topRow}>
          <Text style={styles.duaraLabel}>DUARA</Text>
          <View style={styles.sosLabelRow}>
            <View style={styles.redDot} />
            <Text style={styles.sosLabelText}>SOS</Text>
          </View>
        </View>

        {/* Countdown circle with pulsing outer ring */}
        <View style={styles.circleWrapper}>
          {/* Pulsing outer ring — only when counting down */}
          {!sent && (
            <Animated.View
              style={[
                styles.pulseRing,
                { transform: [{ scale: pulseScale }], opacity: pulseOpacity },
              ]}
            />
          )}

          {/* Main dark circle */}
          <View style={[styles.circleBg, sent && styles.circleBgSent]}>
            {/* Animated colored border */}
            <Animated.View
              style={[
                styles.circleRing,
                { borderColor: sent ? colors.teal : colors.emergency },
              ]}
            />
            {/* Center number / checkmark */}
            <View style={styles.circleCenter}>
              {sent ? (
                <>
                  <Text style={[styles.countdownNum, { color: colors.teal, fontSize: 64 }]}>✓</Text>
                  <Text style={styles.sentLabel}>SOS Sent</Text>
                </>
              ) : (
                <>
                  <Text style={[styles.countdownNum, { color: colors.emergency }]}>{seconds}</Text>
                  <Text style={styles.countdownLabel}>seconds</Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Heading */}
        {!sent && (
          <>
            <Text style={styles.heading}>Sending SOS...</Text>
            <Text style={styles.subtext}>
              Your emergency contacts will be alerted with your live location.
            </Text>
          </>
        )}
        {sent && (
          <Text style={styles.subtext}>
            Your emergency contacts have been alerted.
          </Text>
        )}

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Push alert</Text>
              <Text style={styles.statusSub}>Used when you are online</Text>
            </View>
            <View style={styles.readyBadge}>
              <ReadyDot />
              <Text style={styles.readyBadgeText}>Ready</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>SMS fallback</Text>
              <Text style={styles.statusSub}>Used when you have no internet</Text>
            </View>
            <View style={styles.readyBadge}>
              <ReadyDot />
              <Text style={styles.readyBadgeText}>Ready</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Emergency contacts</Text>
              <Text style={styles.statusSub}>First to respond is shown to everyone</Text>
            </View>
            <View style={[styles.readyBadge, { backgroundColor: colors.tealBadge }]}>
              <Text style={[styles.readyBadgeText, { color: colors.teal }]}>{emergencyCount}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        {!sent && (
          <TouchableOpacity style={styles.sendNowBtn} onPress={handleSendNow} activeOpacity={0.85}>
            <Text style={styles.sendNowBtnText}>Send now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel, I am okay</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0D0505' },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xl },
  duaraLabel: { fontSize: fonts.sm, fontWeight: '800', color: colors.text, letterSpacing: 3 },
  sosLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.emergency },
  sosLabelText: { fontSize: fonts.sm, fontWeight: '700', color: colors.emergency, letterSpacing: 2 },

  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  pulseRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 30,
    height: CIRCLE_SIZE + 30,
    borderRadius: (CIRCLE_SIZE + 30) / 2,
    borderWidth: 2,
    borderColor: colors.emergency,
  },
  circleBg: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: '#180505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBgSent: { backgroundColor: '#051810' },
  circleRing: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 5,
  },
  circleCenter: { alignItems: 'center' },
  countdownNum: { fontSize: 80, fontWeight: '800', lineHeight: 88 },
  countdownLabel: { fontSize: fonts.base, color: colors.textSecondary },
  sentLabel: { fontSize: fonts.lg, fontWeight: '700', color: colors.teal, marginTop: 4 },

  heading: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm, textAlign: 'center' },
  subtext: { fontSize: fonts.base, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },

  statusCard: {
    width: '100%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: fonts.base, fontWeight: '700', color: colors.text },
  statusSub: { fontSize: fonts.sm, color: colors.textSecondary, marginTop: 2 },
  readyBadge: {
    backgroundColor: colors.successDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  readyBadgeText: { fontSize: fonts.sm, color: colors.success, fontWeight: '700' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  sendNowBtn: {
    width: '100%',
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sendNowBtnText: { color: '#fff', fontWeight: '800', fontSize: fonts.md },
  cancelBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.textSecondary, fontWeight: '600', fontSize: fonts.md },
});
