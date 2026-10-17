import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Animated, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import { getMedications, logMedicationTaken, getCareCircle, type Medication } from '../../lib/supabase';
import { getWeather, iconUrl, type WeatherData } from '../../lib/weather';

// ─── View-based grid icons (no emoji) ────────────────────────────────────────

function LightningIcon() {
  // Amber angled rectangle — lightning bolt approximation
  return (
    <View style={{ width: 22, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      {/* Upper part of bolt */}
      <View style={{
        width: 14, height: 14,
        backgroundColor: colors.amber,
        borderRadius: 2,
        transform: [{ skewX: '-15deg' }, { rotate: '-8deg' }],
        position: 'absolute', top: 0, left: 4,
      }} />
      {/* Lower part of bolt */}
      <View style={{
        width: 14, height: 14,
        backgroundColor: colors.amber,
        borderRadius: 2,
        transform: [{ skewX: '-15deg' }, { rotate: '-8deg' }],
        position: 'absolute', bottom: 0, right: 4,
      }} />
      {/* Center white cut */}
      <View style={{
        width: 18, height: 5,
        backgroundColor: colors.bgCard,
        transform: [{ rotate: '-35deg' }],
        position: 'absolute',
      }} />
    </View>
  );
}

function CircleOverlapIcon() {
  return (
    <View style={{ width: 28, height: 20 }}>
      <View style={{
        position: 'absolute', left: 0, top: 0,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: colors.tealMuted,
        borderWidth: 2, borderColor: colors.teal,
      }} />
      <View style={{
        position: 'absolute', left: 10, top: 0,
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: colors.tealMuted,
        borderWidth: 2, borderColor: colors.teal,
        opacity: 0.7,
      }} />
    </View>
  );
}

function CrossIcon() {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: 22, height: 6, backgroundColor: colors.teal, borderRadius: 3 }} />
      <View style={{ position: 'absolute', width: 6, height: 22, backgroundColor: colors.teal, borderRadius: 3 }} />
    </View>
  );
}

function DocumentIcon() {
  return (
    <View style={{ width: 18, height: 22 }}>
      <View style={{
        width: 18, height: 22, borderRadius: 3,
        borderWidth: 2, borderColor: colors.textSecondary,
      }}>
        <View style={{ width: 10, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 5, left: 3 }} />
        <View style={{ width: 12, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 9, left: 2 }} />
        <View style={{ width: 10, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 13, left: 3 }} />
      </View>
    </View>
  );
}

// ─── Bell icon ────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <View style={{ width: 18, height: 20, alignItems: 'center' }}>
      <View style={{ width: 14, height: 13, borderRadius: 7, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderWidth: 2, borderColor: colors.textSecondary, borderBottomWidth: 0, marginTop: 2 }} />
      <View style={{ width: 18, height: 4, backgroundColor: colors.textSecondary, borderRadius: 1 }} />
      <View style={{ width: 6, height: 3, borderBottomLeftRadius: 3, borderBottomRightRadius: 3, borderWidth: 2, borderColor: colors.textSecondary, borderTopWidth: 0, marginTop: -1 }} />
    </View>
  );
}

const GRID_ITEMS = [
  { icon: 'lightning', title: 'Conditions', subtitle: 'Types and triggers', route: '/records' },
  { icon: 'circles', title: 'Care Circle', subtitle: 'You decide who sees what', route: '/circle' },
  { icon: 'map', title: 'Track', subtitle: 'Live map & SOS history', route: '/map' },
  { icon: 'doc', title: 'Records', subtitle: 'Events, notes, reports', route: '/records' },
];

function MapPinIcon() {
  return (
    <View style={{ width: 22, height: 26, alignItems: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: colors.teal }} />
      <View style={{ width: 3, height: 8, backgroundColor: colors.teal, borderRadius: 1.5, marginTop: -2 }} />
      <View style={{ width: 6, height: 2, borderRadius: 1, backgroundColor: colors.teal, opacity: 0.4 }} />
    </View>
  );
}

function GridIcon({ type }: { type: string }) {
  if (type === 'lightning') return <LightningIcon />;
  if (type === 'circles') return <CircleOverlapIcon />;
  if (type === 'cross') return <CrossIcon />;
  if (type === 'map') return <MapPinIcon />;
  return <DocumentIcon />;
}

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [circleCount, setCircleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [takenId, setTakenId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecastOpen, setForecastOpen] = useState(false);

  // Pulsing dot animation for PROTECTED badge
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    getWeather().then(setWeather);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const initials = (profile?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([getMedications(uid), getCareCircle(uid)]).then(([meds, circle]) => {
      setMedications(meds);
      setCircleCount(circle.length);
      setLoading(false);
    });
  }, [session]);

  async function handleTaken(med: Medication) {
    if (!session?.user || takenId) return;
    setTakenId(med.id);
    await logMedicationTaken(med.id, session.user.id);
  }

  const nextMed = medications[0];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* Top bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.heroText}>{profile?.full_name ?? 'Your care, your control'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <BellIcon />
          </TouchableOpacity>
        </View>

        {/* Circle protection card */}
        <View style={styles.circleCard}>
          <View style={styles.concentricWrap}>
            <View style={styles.ringOuter} />
            <View style={styles.ringMid} />
            <View style={styles.ringInner} />
            <View style={styles.ringCore} />
          </View>
          <View style={styles.circleText}>
            {/* PROTECTED badge with animated pulse dot */}
            <View style={styles.protectedRow}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.protectedLabel}>PROTECTED</Text>
            </View>
            <Text style={styles.circleTitle}>Your Circle is active</Text>
            <Text style={styles.circleSubtitle}>
              {circleCount > 0
                ? `${circleCount} trusted contact${circleCount !== 1 ? 's' : ''} ready to be alerted.`
                : 'Trusted contacts are ready when you need them.'}
            </Text>
          </View>
        </View>

        {/* SOS button */}
        <TouchableOpacity
          style={styles.sosBtn}
          onLongPress={() => router.push('/sos')}
          onPress={() => router.push('/sos')}
          activeOpacity={0.9}
        >
          <View style={styles.sosBtnInner}>
            <View style={styles.sosBtnTextWrap}>
              <Text style={styles.sosBtnTitle}>Hold for SOS</Text>
              <Text style={styles.sosBtnSub}>Alerts your Circle with live location</Text>
            </View>
            <View style={styles.sosPowerBtn}>
              <Text style={styles.sosPowerIcon}>⏻</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Weather widget */}
        {weather && (
          <TouchableOpacity
            style={styles.weatherCard}
            onPress={() => setForecastOpen((v) => !v)}
            activeOpacity={0.85}
          >
            {/* Current conditions row */}
            <View style={styles.weatherMain}>
              <Image source={{ uri: iconUrl(weather.current.iconCode) }} style={styles.weatherIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.weatherCity}>{weather.current.city}</Text>
                <Text style={styles.weatherDesc}>{weather.current.description}</Text>
              </View>
              <View style={styles.weatherTempWrap}>
                <Text style={styles.weatherTemp}>{weather.current.temp}°C</Text>
                <Text style={styles.weatherFeels}>Feels {weather.current.feels_like}°</Text>
              </View>
            </View>

            {/* Stats row */}
            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <View style={styles.weatherStatDot} />
                <Text style={styles.weatherStatText}>{weather.current.humidity}% humidity</Text>
              </View>
              <View style={styles.weatherStat}>
                <View style={[styles.weatherStatDot, { backgroundColor: colors.blue }]} />
                <Text style={styles.weatherStatText}>{weather.current.wind_kph} km/h wind</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/map' as any)}>
                <Text style={styles.weatherMapLink}>Map →</Text>
              </TouchableOpacity>
            </View>

            {/* Seizure trigger warning */}
            {weather.trigger && (
              <View style={styles.weatherTrigger}>
                <View style={styles.weatherTriggerDot} />
                <Text style={styles.weatherTriggerText}>{weather.trigger}</Text>
              </View>
            )}

            {/* 5-day forecast — expandable */}
            {forecastOpen && (
              <View style={styles.forecastRow}>
                {weather.forecast.map((day) => (
                  <View key={day.day} style={styles.forecastItem}>
                    <Text style={styles.forecastDay}>{day.day}</Text>
                    <Image source={{ uri: iconUrl(day.iconCode) }} style={styles.forecastIcon} />
                    <Text style={styles.forecastHigh}>{day.high}°</Text>
                    <Text style={styles.forecastLow}>{day.low}°</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Medication card */}
        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={colors.teal} />
          </View>
        ) : nextMed ? (
          <View style={styles.medCard}>
            <View style={styles.medLeft}>
              {/* Pill icon: two stacked rounded rectangles */}
              <View style={styles.medIcon}>
                <View style={{ width: 18, height: 9, borderRadius: 9, backgroundColor: colors.teal, marginBottom: 2 }} />
                <View style={{ width: 18, height: 9, borderRadius: 9, backgroundColor: colors.tealMuted }} />
              </View>
              <View>
                <Text style={styles.medTime}>Next medication</Text>
                <Text style={styles.medName}>{nextMed.name}</Text>
                <Text style={styles.medDose}>{nextMed.dose}</Text>
              </View>
            </View>
            <View style={styles.medRight}>
              <View style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{nextMed.schedule.time}</Text>
              </View>
              <TouchableOpacity
                style={[styles.takenBtn, takenId === nextMed.id && styles.takenBtnDone]}
                onPress={() => handleTaken(nextMed)}
                disabled={takenId === nextMed.id}
              >
                <Text style={styles.takenBtnText}>{takenId === nextMed.id ? '✓ Done' : 'Taken'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* 2x2 Quick access grid */}
        <View style={styles.grid}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.gridItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <View style={styles.gridIconWrap}>
                <GridIcon type={item.icon} />
              </View>
              <Text style={styles.gridTitle}>{item.title}</Text>
              <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: spacing.xxl },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.tealMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.teal,
  },
  avatarText: { color: colors.teal, fontWeight: '700', fontSize: fonts.md },
  greeting: { fontSize: fonts.sm, color: colors.textSecondary },
  heroText: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Circle card
  circleCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  concentricWrap: {
    width: 64, height: 64, flexShrink: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.2)',
  },
  ringMid: {
    position: 'absolute',
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)',
  },
  ringInner: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2, borderColor: 'rgba(139,92,246,0.7)',
  },
  ringCore: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.teal },
  circleText: { flex: 1 },
  protectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pulseDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.teal },
  protectedLabel: {
    fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1.5,
  },
  circleTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  circleSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  // SOS
  sosBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sosBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosBtnTextWrap: { flex: 1 },
  sosBtnTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sosBtnSub: { fontSize: fonts.sm, color: 'rgba(255,255,255,0.8)' },
  sosPowerBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosPowerIcon: { fontSize: 26, color: '#fff' },

  // Loading
  loadingCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center', marginBottom: spacing.md,
  },

  // Med card
  medCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  medLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  medIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  medTime: { fontSize: fonts.xs, color: colors.textSecondary, marginBottom: 2 },
  medName: { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  medDose: { fontSize: fonts.sm, color: colors.textSecondary },
  medRight: { alignItems: 'flex-end', gap: spacing.xs },
  timeBadge: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    marginBottom: spacing.xs,
  },
  timeBadgeText: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: '600' },
  takenBtn: {
    backgroundColor: colors.teal,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  takenBtnDone: { backgroundColor: colors.tealDim },
  takenBtnText: { color: '#000', fontWeight: '700', fontSize: fonts.sm },

  // Weather widget
  weatherCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, gap: spacing.md,
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weatherIcon: { width: 52, height: 52 },
  weatherCity: { fontSize: fonts.sm, fontWeight: '700', color: colors.text },
  weatherDesc: { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  weatherTempWrap: { alignItems: 'flex-end' },
  weatherTemp: { fontSize: fonts.xxl, fontWeight: '800', color: colors.text },
  weatherFeels: { fontSize: fonts.xs, color: colors.textMuted },
  weatherStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  weatherStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherStatDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal },
  weatherStatText: { fontSize: fonts.xs, color: colors.textSecondary },
  weatherMapLink: { fontSize: fonts.xs, color: colors.teal, fontWeight: '700', marginLeft: 'auto' },
  weatherTrigger: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.amberDim, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.amber + '50', padding: spacing.sm,
  },
  weatherTriggerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber, flexShrink: 0, marginTop: 3 },
  weatherTriggerText: { fontSize: fonts.xs, color: colors.amber, lineHeight: 16, flex: 1 },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  forecastItem: { alignItems: 'center', gap: 2, flex: 1 },
  forecastDay: { fontSize: fonts.xs, color: colors.textMuted, fontWeight: '600' },
  forecastIcon: { width: 32, height: 32 },
  forecastHigh: { fontSize: fonts.sm, color: colors.text, fontWeight: '700' },
  forecastLow: { fontSize: fonts.xs, color: colors.textMuted },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  gridItem: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
  },
  gridIconWrap: { marginBottom: spacing.md },
  gridTitle: { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  gridSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },
});
