import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../lib/theme';
import { MOCK_CARE_CIRCLE } from '../lib/mock-data';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = 200;
const STROKE = 8;
const R = (CIRCLE_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const TOTAL_SECONDS = 5;
const emergencyCount = MOCK_CARE_CIRCLE.filter((c) => c.is_emergency).length;

export default function SOSScreen() {
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [sent, setSent] = useState(false);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: TOTAL_SECONDS * 1000,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          setSent(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  function handleCancel() {
    router.back();
  }

  function handleSendNow() {
    setSent(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* SOS label */}
        <View style={styles.sosLabel}>
          <View style={styles.redDot} />
          <Text style={styles.sosLabelText}>SOS</Text>
        </View>

        {/* Countdown circle */}
        <View style={styles.circleWrapper}>
          <View style={styles.circleBg} />
          <Animated.View
            style={[
              styles.circleArc,
              {
                borderColor: sent ? colors.teal : colors.coral,
              },
            ]}
          />
          <View style={styles.circleCenter}>
            <Text style={styles.countdownNum}>{sent ? '✓' : seconds}</Text>
            {!sent && <Text style={styles.countdownLabel}>seconds</Text>}
          </View>
        </View>

        {/* Status text */}
        <Text style={styles.heading}>{sent ? 'SOS Sent' : 'Sending your SOS'}</Text>
        <Text style={styles.subtext}>
          {sent
            ? 'Your emergency contacts have been alerted.'
            : 'Your emergency contacts will be alerted with your live location.'}
        </Text>

        {/* Status card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Push alert</Text>
              <Text style={styles.statusSub}>Used when you are online</Text>
            </View>
            <View style={styles.readyBadge}>
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
              <Text style={styles.readyBadgeText}>Ready</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>Emergency contacts</Text>
              <Text style={styles.statusSub}>First to respond is shown to everyone</Text>
            </View>
            <Text style={styles.contactCount}>{emergencyCount}</Text>
          </View>
        </View>

        {/* Actions */}
        {!sent && (
          <TouchableOpacity style={styles.sendNowBtn} onPress={handleSendNow} activeOpacity={0.85}>
            <Text style={styles.sendNowBtnText}>Send now</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>Cancel, I am okay</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  sosLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  redDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.coral },
  sosLabelText: { fontSize: fonts.sm, fontWeight: '700', color: colors.text, letterSpacing: 2 },

  circleWrapper: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  circleBg: {
    position: 'absolute',
    width: CIRCLE_SIZE - STROKE,
    height: CIRCLE_SIZE - STROKE,
    borderRadius: (CIRCLE_SIZE - STROKE) / 2,
    borderWidth: STROKE,
    borderColor: colors.bgCard,
  },
  circleArc: {
    position: 'absolute',
    width: CIRCLE_SIZE - STROKE,
    height: CIRCLE_SIZE - STROKE,
    borderRadius: (CIRCLE_SIZE - STROKE) / 2,
    borderWidth: STROKE,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  circleCenter: { alignItems: 'center' },
  countdownNum: { fontSize: fonts.xxxl + 20, fontWeight: '800', color: colors.text },
  countdownLabel: { fontSize: fonts.base, color: colors.textSecondary },

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
    backgroundColor: colors.tealDim,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  readyBadgeText: { fontSize: fonts.sm, color: colors.teal, fontWeight: '700' },
  contactCount: { fontSize: fonts.lg, fontWeight: '700', color: colors.text },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },

  sendNowBtn: {
    width: '100%',
    backgroundColor: colors.coral,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sendNowBtnText: { color: '#000', fontWeight: '800', fontSize: fonts.md },
  cancelBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.text, fontWeight: '600', fontSize: fonts.md },
});
