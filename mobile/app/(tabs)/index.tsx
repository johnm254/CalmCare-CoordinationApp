import { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Animated, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, spacing } from '../../lib/theme';
import { useAuth } from '../_layout';
import {
  getMedications, logMedicationTaken, getCareCircle,
  type Medication, supabase,
} from '../../lib/supabase';
import { getWeather, iconUrl, type WeatherData } from '../../lib/weather';

// ─── Medical icon components ──────────────────────────────────────────────────

function BrainWaveIcon({ color = colors.teal }: { color?: string }) {
  return (
    <View style={{ width: 28, height: 20, justifyContent: 'center' }}>
      {/* EEG-style wave */}
      <View style={{ position: 'absolute', left: 0, top: 9, width: 4, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 4, top: 7, width: 3, height: 6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 7, top: 3, width: 3, height: 14, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 10, top: 7, width: 3, height: 6, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 13, top: 9, width: 3, height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 16, top: 6, width: 3, height: 8, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 19, top: 9, width: 9, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function PillIcon({ color = colors.teal }: { color?: string }) {
  return (
    <View style={{ width: 26, height: 14, flexDirection: 'row' }}>
      <View style={{
        width: 13, height: 14, borderTopLeftRadius: 7, borderBottomLeftRadius: 7,
        backgroundColor: color,
      }} />
      <View style={{
        width: 13, height: 14, borderTopRightRadius: 7, borderBottomRightRadius: 7,
        backgroundColor: color, opacity: 0.45,
      }} />
      <View style={{ position: 'absolute', left: 12, top: 0, width: 2, height: 14, backgroundColor: colors.bg }} />
    </View>
  );
}

function PersonIcon({ color = colors.teal }: { color?: string }) {
  return (
    <View style={{ width: 20, height: 24, alignItems: 'center' }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <View style={{
        width: 20, height: 10, borderTopLeftRadius: 10, borderTopRightRadius: 10,
        backgroundColor: color, opacity: 0.6, marginTop: 2,
      }} />
    </View>
  );
}

function HeartPulseIcon({ color = colors.emergency }: { color?: string }) {
  return (
    <View style={{ width: 26, height: 20, justifyContent: 'center' }}>
      <View style={{ position: 'absolute', left: 0,  top: 9, width: 4,  height: 2, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 4,  top: 5, width: 3,  height: 10, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 7,  top: 1, width: 3,  height: 18, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 10, top: 5, width: 3,  height: 10, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ position: 'absolute', left: 13, top: 9, width: 13, height: 2, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

function LightningIcon() {
  return (
    <View style={{ width: 22, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 14, height: 14, backgroundColor: colors.amber, borderRadius: 2, transform: [{ skewX: '-15deg' }, { rotate: '-8deg' }], position: 'absolute', top: 0, left: 4 }} />
      <View style={{ width: 14, height: 14, backgroundColor: colors.amber, borderRadius: 2, transform: [{ skewX: '-15deg' }, { rotate: '-8deg' }], position: 'absolute', bottom: 0, right: 4 }} />
      <View style={{ width: 18, height: 5, backgroundColor: colors.bgCard, transform: [{ rotate: '-35deg' }], position: 'absolute' }} />
    </View>
  );
}

function CircleOverlapIcon() {
  return (
    <View style={{ width: 28, height: 20 }}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.tealMuted, borderWidth: 2, borderColor: colors.teal }} />
      <View style={{ position: 'absolute', left: 10, top: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.tealMuted, borderWidth: 2, borderColor: colors.teal, opacity: 0.7 }} />
    </View>
  );
}

function MapPinIcon() {
  return (
    <View style={{ width: 22, height: 26, alignItems: 'center' }}>
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: colors.teal }} />
      <View style={{ width: 3, height: 8, backgroundColor: colors.teal, borderRadius: 1.5, marginTop: -2 }} />
      <View style={{ width: 6, height: 2, borderRadius: 1, backgroundColor: colors.teal, opacity: 0.4 }} />
    </View>
  );
}

function DocumentIcon() {
  return (
    <View style={{ width: 18, height: 22 }}>
      <View style={{ width: 18, height: 22, borderRadius: 3, borderWidth: 2, borderColor: colors.textSecondary }}>
        <View style={{ width: 10, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 5, left: 3 }} />
        <View style={{ width: 12, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 9, left: 2 }} />
        <View style={{ width: 10, height: 2, backgroundColor: colors.textSecondary, borderRadius: 1, position: 'absolute', top: 13, left: 3 }} />
      </View>
    </View>
  );
}

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
  { icon: 'lightning', title: 'Conditions', subtitle: 'Types & triggers', route: '/records' },
  { icon: 'circles',   title: 'Care Circle', subtitle: 'Who sees what',   route: '/circle' },
  { icon: 'map',       title: 'Track',       subtitle: 'Map & SOS history', route: '/map' },
  { icon: 'doc',       title: 'Records',     subtitle: 'Events & reports',  route: '/records' },
];

function GridIcon({ type }: { type: string }) {
  if (type === 'lightning') return <LightningIcon />;
  if (type === 'circles')   return <CircleOverlapIcon />;
  if (type === 'map')       return <MapPinIcon />;
  return <DocumentIcon />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { profile, session } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [circleCount, setCircleCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [takenId, setTakenId] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecastOpen, setForecastOpen] = useState(false);
  const [streakDays, setStreakDays] = useState(0);
  const [displayStreak, setDisplayStreak] = useState(0);

  // Staggered entrance — 8 slots
  const anims = useRef(
    Array.from({ length: 8 }, () => ({
      y:  new Animated.Value(40),
      op: new Animated.Value(0),
    }))
  ).current;

  // 3D hero tilt
  const heroTilt = useRef(new Animated.Value(1)).current;

  // Count-up for streak
  const streakAnim = useRef(new Animated.Value(0)).current;

  // Pulse dot
  const pulseAnim = useRef(new Animated.Value(0.5)).current;

  // SOS press scale
  const sosScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Stagger entrance
    anims.forEach((a, i) => {
      Animated.sequence([
        Animated.delay(i * 90 + 200),
        Animated.parallel([
          Animated.spring(a.y,  { toValue: 0, tension: 60, friction: 13, useNativeDriver: true }),
          Animated.timing(a.op, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });

    // Hero 3D entrance tilt: perspective faux-rotate
    Animated.sequence([
      Animated.delay(300),
      Animated.spring(heroTilt, { toValue: 0, tension: 45, friction: 11, useNativeDriver: true }),
    ]).start();

    // Pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1,   duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    getWeather().then(setWeather);
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const uid = session.user.id;
    Promise.all([getMedications(uid), getCareCircle(uid)]).then(([meds, circle]) => {
      setMedications(meds);
      setCircleCount(circle.length);
      setLoading(false);
    });

    // Seizure-free streak: days since last seizure event
    supabase
      .from('events')
      .select('occurred_at')
      .eq('user_id', uid)
      .in('type', ['seizure', 'sz', 'tonic-clonic', 'absence'])
      .order('occurred_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        let days = 0;
        if (!data || data.length === 0) {
          days = 30;
        } else {
          const last = new Date(data[0].occurred_at);
          days = Math.floor((Date.now() - last.getTime()) / 86_400_000);
        }
        setStreakDays(days);
        const counter = new Animated.Value(0);
        counter.addListener(({ value }) => setDisplayStreak(Math.round(value)));
        Animated.timing(counter, {
          toValue: days, duration: 1200, useNativeDriver: false,
        }).start(() => counter.removeAllListeners());
      });
  }, [session]);

  async function handleTaken(med: Medication) {
    if (!session?.user || takenId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTakenId(med.id);
    await logMedicationTaken(med.id, session.user.id);
  }

  function onSosPressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Animated.spring(sosScale, { toValue: 0.97, useNativeDriver: true, tension: 200, friction: 12 }).start();
  }
  function onSosPressOut() {
    Animated.spring(sosScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }).start();
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = profile?.full_name?.split(' ')[0] ?? '';
  const initials  = (profile?.full_name ?? 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const nextMed = medications[0];

  const heroTranslateY = heroTilt.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });

  function slot(i: number) {
    return { transform: [{ translateY: anims[i].y }], opacity: anims[i].op };
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.header, slot(0)]}>
          <View style={styles.headerLeft}>
            <LinearGradient
              colors={['#8B5CF6', '#6D28D9']}
              style={styles.avatarGrad}
            >
              <Text style={styles.avatarText}>{initials}</Text>
            </LinearGradient>
            <View>
              <Text style={styles.greeting}>{greeting}{firstName ? `, ${firstName}` : ''}</Text>
              <Text style={styles.heroText}>Your care dashboard</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.bellBtn}>
            <BellIcon />
          </TouchableOpacity>
        </Animated.View>

        {/* ── Hero card — 3D entrance + streak ────────────────────────────── */}
        <Animated.View style={[slot(1), { transform: [...(slot(1).transform as any), { translateY: heroTranslateY }] }]}>
          <LinearGradient
            colors={['#1A1035', '#0D0B1E']}
            style={styles.heroCard}
          >
            {/* ECG decoration */}
            <View style={styles.ecgRow} pointerEvents="none">
              <View style={styles.ecgFlat} />
              <View style={styles.ecgUp} />
              <View style={styles.ecgPeak} />
              <View style={styles.ecgDown} />
              <View style={styles.ecgBump} />
              <View style={styles.ecgFlat2} />
            </View>

            {/* Top row: pulse icon + label */}
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <HeartPulseIcon color={colors.emergency} />
                <Text style={styles.heroBadgeText}>SEIZURE-FREE</Text>
              </View>
              <View style={styles.heroDateDot}>
                <Animated.View style={[styles.heroDotInner, { opacity: pulseAnim }]} />
                <Text style={styles.heroDateText}>LIVE</Text>
              </View>
            </View>

            {/* Streak counter */}
            <View style={styles.streakWrap}>
              <Text style={styles.streakNum}>{displayStreak}</Text>
              <Text style={styles.streakLabel}>days</Text>
            </View>
            <Text style={styles.streakSub}>
              {streakDays === 0 ? 'Keep going — every day counts.' : `${streakDays} consecutive days seizure-free`}
            </Text>

            {/* Bottom gradient band */}
            <LinearGradient
              colors={['transparent', 'rgba(139,92,246,0.08)']}
              style={styles.heroBottomBand}
            />

            {/* Concentric rings decoration */}
            <View style={styles.ringDecorWrap} pointerEvents="none">
              <View style={[styles.ringDecor, { width: 180, height: 180, borderRadius: 90, opacity: 0.06 }]} />
              <View style={[styles.ringDecor, { width: 130, height: 130, borderRadius: 65, opacity: 0.10 }]} />
              <View style={[styles.ringDecor, { width: 80,  height: 80,  borderRadius: 40, opacity: 0.16 }]} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <Animated.View style={[styles.statsRow, slot(2)]}>
          <LinearGradient colors={['#1C1535', '#14122A']} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <BrainWaveIcon />
            </View>
            <Text style={styles.statValue}>{streakDays}d</Text>
            <Text style={styles.statLabel}>Free</Text>
          </LinearGradient>

          <LinearGradient colors={['#1C1535', '#14122A']} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <PillIcon />
            </View>
            <Text style={styles.statValue}>{medications.length}</Text>
            <Text style={styles.statLabel}>Meds</Text>
          </LinearGradient>

          <LinearGradient colors={['#1C1535', '#14122A']} style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <PersonIcon />
            </View>
            <Text style={styles.statValue}>{circleCount}</Text>
            <Text style={styles.statLabel}>Circle</Text>
          </LinearGradient>
        </Animated.View>

        {/* ── SOS button ────────────────────────────────────────────────────── */}
        <Animated.View style={[slot(3), { transform: [{ scale: sosScale }] }]}>
          <TouchableOpacity
            onPress={() => router.push('/sos')}
            onLongPress={() => router.push('/sos')}
            onPressIn={onSosPressIn}
            onPressOut={onSosPressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={['#C0392B', '#922B21']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.sosBtn}
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
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* ── Circle protection card ────────────────────────────────────────── */}
        <Animated.View style={[styles.circleCard, slot(4)]}>
          <View style={styles.concentricWrap}>
            <View style={styles.ringOuter} />
            <View style={styles.ringMid} />
            <View style={styles.ringInner} />
            <Animated.View style={[styles.ringCore, { opacity: pulseAnim }]} />
          </View>
          <View style={styles.circleText}>
            <View style={styles.protectedRow}>
              <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
              <Text style={styles.protectedLabel}>PROTECTED</Text>
            </View>
            <Text style={styles.circleTitle}>Your Circle is active</Text>
            <Text style={styles.circleSubtitle}>
              {circleCount > 0
                ? `${circleCount} trusted contact${circleCount !== 1 ? 's' : ''} ready to be alerted.`
                : 'Add contacts to your care circle.'}
            </Text>
          </View>
        </Animated.View>

        {/* ── Medication card ────────────────────────────────────────────────── */}
        <Animated.View style={slot(5)}>
          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color={colors.teal} />
            </View>
          ) : nextMed ? (
            <LinearGradient colors={['#1C1A35', '#14122A']} style={styles.medCard}>
              <View style={styles.medLeft}>
                <View style={styles.medIcon}>
                  <PillIcon />
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
            </LinearGradient>
          ) : null}
        </Animated.View>

        {/* ── Weather widget ──────────────────────────────────────────────────── */}
        {weather && (
          <Animated.View style={slot(6)}>
            <TouchableOpacity
              style={styles.weatherCard}
              onPress={() => setForecastOpen((v) => !v)}
              activeOpacity={0.85}
            >
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
              {weather.trigger && (
                <View style={styles.weatherTrigger}>
                  <View style={styles.weatherTriggerDot} />
                  <Text style={styles.weatherTriggerText}>{weather.trigger}</Text>
                </View>
              )}
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
          </Animated.View>
        )}

        {/* ── 2×2 quick-access grid ──────────────────────────────────────────── */}
        <Animated.View style={[styles.grid, slot(7)]}>
          {GRID_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.title}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.82}
            >
              <LinearGradient colors={['#1C1A35', '#14122A']} style={styles.gridItem}>
                <View style={styles.gridIconWrap}>
                  <GridIcon type={item.icon} />
                </View>
                <Text style={styles.gridTitle}>{item.title}</Text>
                <Text style={styles.gridSubtitle}>{item.subtitle}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.bg },
  scroll:    { flex: 1 },
  container: { padding: spacing.xl, paddingBottom: 40, gap: spacing.md },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarGrad: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: fonts.md },
  greeting:   { fontSize: fonts.sm, color: colors.textSecondary },
  heroText:   { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  bellBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero card
  heroCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    overflow: 'hidden',
    minHeight: 180,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 14,
  },
  ecgRow: {
    position: 'absolute', top: 18, right: 18,
    flexDirection: 'row', alignItems: 'center', opacity: 0.25,
  },
  ecgFlat:  { width: 14, height: 2, backgroundColor: colors.emergency, borderRadius: 1 },
  ecgUp:    { width: 3, height: 16, backgroundColor: colors.emergency, borderRadius: 1, marginBottom: 7 },
  ecgPeak:  { width: 3, height: 28, backgroundColor: colors.emergency, borderRadius: 1 },
  ecgDown:  { width: 3, height: 16, backgroundColor: colors.emergency, borderRadius: 1, marginTop: 7 },
  ecgBump:  { width: 5, height: 10, backgroundColor: colors.emergency, borderRadius: 2, marginBottom: 2 },
  ecgFlat2: { width: 18, height: 2, backgroundColor: colors.emergency, borderRadius: 1 },

  heroTopRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  heroBadge:     { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  heroBadgeText: { fontSize: fonts.xs, fontWeight: '700', color: colors.emergency, letterSpacing: 1.2 },
  heroDateDot:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  heroDotInner:  { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.success },
  heroDateText:  { fontSize: fonts.xs, color: colors.success, fontWeight: '700', letterSpacing: 1 },

  streakWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  streakNum: {
    fontSize: 64, fontWeight: '800', color: colors.text,
    lineHeight: 68,
    textShadowColor: 'rgba(139,92,246,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  streakLabel:   { fontSize: fonts.xl, fontWeight: '700', color: colors.textSecondary, paddingBottom: 8 },
  streakSub:     { fontSize: fonts.sm, color: colors.textSecondary, marginTop: spacing.xs },
  heroBottomBand:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40 },
  ringDecorWrap: { position: 'absolute', right: -40, top: -40, alignItems: 'center', justifyContent: 'center' },
  ringDecor:     { position: 'absolute', borderWidth: 1.5, borderColor: colors.teal },

  // Stats row
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statCard: {
    flex: 1, borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.lg, alignItems: 'center', gap: 4,
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  statIconWrap: { marginBottom: 4 },
  statValue: { fontSize: fonts.xl, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: fonts.xs, color: colors.textSecondary, fontWeight: '600', letterSpacing: 0.5 },

  // SOS
  sosBtn: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  sosBtnInner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosBtnTextWrap: { flex: 1 },
  sosBtnTitle:    { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sosBtnSub:      { fontSize: fonts.sm, color: 'rgba(255,255,255,0.8)' },
  sosPowerBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosPowerIcon: { fontSize: 26, color: '#fff' },

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
  },
  concentricWrap: { width: 64, height: 64, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  ringOuter:  { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: 'rgba(139,92,246,0.2)' },
  ringMid:    { position: 'absolute', width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: 'rgba(139,92,246,0.4)' },
  ringInner:  { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(139,92,246,0.7)' },
  ringCore:   { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.teal },
  circleText: { flex: 1 },
  protectedRow:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  pulseDot:      { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.teal },
  protectedLabel: { fontSize: fonts.xs, fontWeight: '700', color: colors.teal, letterSpacing: 1.5 },
  circleTitle:    { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  circleSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },

  // Loading
  loadingCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.lg,
    padding: spacing.xl, alignItems: 'center',
  },

  // Med card
  medCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  medLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  medIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  medTime:  { fontSize: fonts.xs, color: colors.textSecondary, marginBottom: 2 },
  medName:  { fontSize: fonts.md, fontWeight: '700', color: colors.text },
  medDose:  { fontSize: fonts.sm, color: colors.textSecondary },
  medRight: { alignItems: 'flex-end', gap: spacing.xs },
  timeBadge: {
    backgroundColor: colors.bgCardAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
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

  // Weather
  weatherCard: {
    backgroundColor: colors.bgCard, borderRadius: radius.xl, borderWidth: 1,
    borderColor: colors.border, padding: spacing.lg, gap: spacing.md,
  },
  weatherMain: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  weatherIcon: { width: 52, height: 52 },
  weatherCity:    { fontSize: fonts.sm, fontWeight: '700', color: colors.text },
  weatherDesc:    { fontSize: fonts.xs, color: colors.textSecondary, marginTop: 2, textTransform: 'capitalize' },
  weatherTempWrap:{ alignItems: 'flex-end' },
  weatherTemp:    { fontSize: fonts.xxl, fontWeight: '800', color: colors.text },
  weatherFeels:   { fontSize: fonts.xs, color: colors.textMuted },
  weatherStats:   { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  weatherStat:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  weatherStatDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal },
  weatherStatText:{ fontSize: fonts.xs, color: colors.textSecondary },
  weatherMapLink: { fontSize: fonts.xs, color: colors.teal, fontWeight: '700', marginLeft: 'auto' },
  weatherTrigger: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.amberDim, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.amber + '50', padding: spacing.sm,
  },
  weatherTriggerDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.amber, flexShrink: 0, marginTop: 3 },
  weatherTriggerText: { fontSize: fonts.xs, color: colors.amber, lineHeight: 16, flex: 1 },
  forecastRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border,
  },
  forecastItem: { alignItems: 'center', gap: 2, flex: 1 },
  forecastDay:  { fontSize: fonts.xs, color: colors.textMuted, fontWeight: '600' },
  forecastIcon: { width: 32, height: 32 },
  forecastHigh: { fontSize: fonts.sm, color: colors.text, fontWeight: '700' },
  forecastLow:  { fontSize: fonts.xs, color: colors.textMuted },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: {
    width: '47%',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  gridIconWrap: { marginBottom: spacing.md },
  gridTitle:    { fontSize: fonts.md, fontWeight: '700', color: colors.text, marginBottom: 4 },
  gridSubtitle: { fontSize: fonts.sm, color: colors.textSecondary, lineHeight: 18 },
});
