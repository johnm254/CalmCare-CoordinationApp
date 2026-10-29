// Map & tracking screen — live location + SOS history + weather overlay.

// react-native-maps requires a new APK build (native module).

// Google Maps Android key: add GOOGLE_MAPS_API_KEY to .env.local

import { useEffect, useRef, useState } from "react"

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native"

import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps"

import * as Location from "expo-location"

import { SafeAreaView } from "react-native-safe-area-context"

import { colors, fonts, radius, spacing } from "../../lib/theme"

import { useAuth } from "../_layout"

import { supabase } from "../../lib/supabase"

import { getWeather, iconUrl, type WeatherData } from "../../lib/weather"

const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0d1b35" }] },

  { elementType: "labels.text.fill", stylers: [{ color: "#7aaac8" }] },

  { elementType: "labels.text.stroke", stylers: [{ color: "#070d1a" }] },

  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#eaf4ff" }],
  },

  { featureType: "poi", stylers: [{ visibility: "off" }] },

  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a3265" }],
  },

  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0a1628" }],
  },

  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#243d6e" }],
  },

  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#0f2040" }],
  },

  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#040a16" }],
  },

  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#3d5c80" }],
  },
]

type SosEvent = {
  id: string

  created_at: string

  latitude: number | null

  longitude: number | null
}

type Coord = { latitude: number; longitude: number }

export default function MapScreen() {
  const { session } = useAuth()

  const mapRef = useRef<MapView>(null)

  const [location, setLocation] = useState<Coord | null>(null)

  const [sosEvents, setSosEvents] = useState<SosEvent[]>([])

  const [weather, setWeather] = useState<WeatherData | null>(null)

  const [loading, setLoading] = useState(true)

  const [tracking, setTracking] = useState(false)

  const [showSosLayer, setShowSosLayer] = useState(true)

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null

    async function init() {
      const { status } = await Location.requestForegroundPermissionsAsync()

      if (status !== "granted") {
        setLoading(false)
        return
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      const coord = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }

      setLocation(coord)

      setLoading(false)

      // Live tracking

      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },

        (newPos) =>
          setLocation({
            latitude: newPos.coords.latitude,
            longitude: newPos.coords.longitude,
          }),
      )

      setTracking(true)

      // Load weather + SOS history in parallel

      getWeather().then(setWeather)

      loadSosHistory()
    }

    init()

    return () => {
      sub?.remove()
    }
  }, [])

  async function loadSosHistory() {
    if (!session?.user) return

    const { data } = await supabase

      .from("sos_events")

      .select("id, created_at, patient_locations!inner(lat, lon)")

      .eq("patient_id", session.user.id)

      .order("created_at", { ascending: false })

      .limit(10)

    // Map to a flat structure — handle both lat/lon and geometry responses

    const events: SosEvent[] = (data ?? []).map((e: any) => ({
      id: e.id,

      created_at: e.created_at,

      latitude: e.patient_locations?.[0]?.lat ?? null,

      longitude: e.patient_locations?.[0]?.lon ?? null,
    }))

    setSosEvents(events)
  }

  function centerOnMe() {
    if (!location || !mapRef.current) return

    mapRef.current.animateToRegion(
      {
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      600,
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={s.loadingText}>Getting your location…</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!location) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loadingWrap}>
          <View style={s.permissionCard}>
            <Text style={s.permissionTitle}>Location access needed</Text>
            <Text style={s.permissionSub}>
              Enable location in your phone settings to use the map and SOS
              tracking features.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const markableSos = sosEvents.filter((e) => e.latitude && e.longitude)

  const lastSos = sosEvents[0]

  return (
    <View style={s.root}>
      <MapView
        ref={mapRef}
        style={s.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={{
          ...location,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* User location — teal pulsing circle */}
        <Circle
          center={location}
          radius={60}
          fillColor="rgba(139,92,246,0.12)"
          strokeColor="rgba(139,92,246,0.4)"
          strokeWidth={1}
        />
        <Marker
          coordinate={location}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={s.userMarker}>
            <View style={s.userMarkerRing} />
            <View style={s.userMarkerDot} />
          </View>
        </Marker>

        {/* SOS event markers */}
        {showSosLayer &&
          markableSos.map((e) => (
            <Marker
              key={e.id}
              coordinate={{ latitude: e.latitude!, longitude: e.longitude! }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={false}
            >
              <View style={s.sosMarker}>
                <View style={s.sosMarkerDot} />
                <View style={s.sosMarkerStem} />
              </View>
            </Marker>
          ))}
      </MapView>

      {/* Weather overlay — top right */}
      {weather && (
        <View style={s.weatherOverlay}>
          <Image
            source={{ uri: iconUrl(weather.current.iconCode) }}
            style={s.weatherIcon}
          />
          <View>
            <Text style={s.weatherTemp}>{weather.current.temp}°</Text>
            <Text style={s.weatherCity}>{weather.current.city}</Text>
          </View>
        </View>
      )}

      {/* Tracking indicator */}
      <View style={s.trackingBadge}>
        <View style={[s.trackingDot, tracking && s.trackingDotActive]} />
        <Text style={s.trackingLabel}>{tracking ? "Live" : "GPS off"}</Text>
      </View>

      {/* Center button */}
      <TouchableOpacity
        style={s.centerBtn}
        onPress={centerOnMe}
        activeOpacity={0.85}
      >
        <View style={s.centerBtnTarget} />
        <View style={s.centerBtnH} />
        <View style={s.centerBtnV} />
      </TouchableOpacity>

      {/* SOS layer toggle */}
      <TouchableOpacity
        style={[s.layerBtn, showSosLayer && s.layerBtnActive]}
        onPress={() => setShowSosLayer((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={[s.layerDot, { backgroundColor: colors.emergency }]} />
        <Text style={[s.layerLabel, showSosLayer && s.layerLabelActive]}>
          SOS history
        </Text>
      </TouchableOpacity>

      {/* Bottom info card */}
      <View style={s.bottomCard}>
        {/* Location row */}
        <View style={s.bottomRow}>
          <View style={s.bottomIconWrap}>
            <View style={s.locationDot} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.bottomTitle}>
              {weather?.current.city ?? "Current location"}
            </Text>
            <Text style={s.bottomSub}>
              {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
            </Text>
          </View>
          {weather && (
            <View style={s.weatherMini}>
              <Text style={s.weatherMiniTemp}>{weather.current.temp}°C</Text>
              <Text style={s.weatherMiniDesc}>
                {weather.current.description}
              </Text>
            </View>
          )}
        </View>

        {/* Seizure trigger warning */}
        {weather?.trigger && (
          <View style={s.triggerCard}>
            <View style={s.triggerDot} />
            <Text style={s.triggerText}>{weather.trigger}</Text>
          </View>
        )}

        {/* Last SOS row */}
        {lastSos && (
          <View style={s.lastSosRow}>
            <View
              style={[
                s.bottomIconWrap,
                { backgroundColor: "rgba(239,68,68,0.12)" },
              ]}
            >
              <View
                style={[s.locationDot, { backgroundColor: colors.emergency }]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.lastSosLabel}>Last SOS sent</Text>
              <Text style={s.lastSosTime}>
                {new Date(lastSos.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={s.sosBadge}>
              <Text style={s.sosBadgeText}>{sosEvents.length} total</Text>
            </View>
          </View>
        )}

        {/* 5-day forecast strip */}
        {weather && weather.forecast.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.forecastScroll}
            contentContainerStyle={s.forecastRow}
          >
            {weather.forecast.map((day) => (
              <View key={day.day} style={s.forecastItem}>
                <Text style={s.forecastDay}>{day.day}</Text>
                <Image
                  source={{ uri: iconUrl(day.iconCode) }}
                  style={s.forecastIcon}
                />
                <Text style={s.forecastHigh}>{day.high}°</Text>
                <Text style={s.forecastLow}>{day.low}°</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  safe: { flex: 1, backgroundColor: colors.bg },

  map: { flex: 1 },

  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: fonts.sm,
    marginTop: spacing.md,
  },

  permissionCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.xxl,
    alignItems: "center",
    gap: spacing.md,
  },

  permissionTitle: {
    fontSize: fonts.lg,
    fontWeight: "700",
    color: colors.text,
  },

  permissionSub: {
    fontSize: fonts.sm,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  // Markers

  userMarker: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  userMarkerRing: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,

    borderWidth: 2,
    borderColor: colors.teal,
    opacity: 0.5,
  },

  userMarkerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.teal,
  },

  sosMarker: { alignItems: "center" },

  sosMarkerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.emergency,
    borderWidth: 2,
    borderColor: "#fff",
  },

  sosMarkerStem: { width: 2, height: 8, backgroundColor: colors.emergency },

  // Weather overlay

  weatherOverlay: {
    position: "absolute",
    top: 16,
    right: 16,

    backgroundColor: "rgba(13,27,53,0.92)",
    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    flexDirection: "row",
    alignItems: "center",
    gap: 4,

    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },

  weatherIcon: { width: 36, height: 36 },

  weatherTemp: { fontSize: fonts.md, fontWeight: "800", color: colors.text },

  weatherCity: { fontSize: fonts.xs, color: colors.textSecondary },

  // Tracking badge

  trackingBadge: {
    position: "absolute",
    top: 16,
    left: 16,

    backgroundColor: "rgba(13,27,53,0.92)",
    borderRadius: radius.full,

    borderWidth: 1,
    borderColor: colors.border,

    flexDirection: "row",
    alignItems: "center",
    gap: 6,

    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },

  trackingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },

  trackingDotActive: { backgroundColor: colors.success },

  trackingLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  // Floating buttons

  centerBtn: {
    position: "absolute",
    bottom: 320,
    right: 16,

    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",
  },

  centerBtnTarget: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.teal,
  },

  centerBtnH: {
    position: "absolute",
    width: 20,
    height: 1.5,
    backgroundColor: colors.teal,
    borderRadius: 1,
  },

  centerBtnV: {
    position: "absolute",
    width: 1.5,
    height: 20,
    backgroundColor: colors.teal,
    borderRadius: 1,
  },

  layerBtn: {
    position: "absolute",
    bottom: 320,
    left: 16,

    backgroundColor: "rgba(13,27,53,0.92)",
    borderRadius: radius.full,

    borderWidth: 1,
    borderColor: colors.border,

    flexDirection: "row",
    alignItems: "center",
    gap: 6,

    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },

  layerBtnActive: { borderColor: colors.emergency },

  layerDot: { width: 8, height: 8, borderRadius: 4 },

  layerLabel: {
    fontSize: fonts.xs,
    fontWeight: "700",
    color: colors.textMuted,
  },

  layerLabelActive: { color: colors.emergency },

  // Bottom card

  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: colors.bgCard,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    borderTopWidth: 1,
    borderColor: colors.border,

    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 28,

    gap: spacing.md,
  },

  bottomRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },

  bottomIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,

    backgroundColor: colors.tealDim,
    alignItems: "center",
    justifyContent: "center",
  },

  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.teal,
  },

  bottomTitle: { fontSize: fonts.base, fontWeight: "700", color: colors.text },

  bottomSub: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },

  weatherMini: { alignItems: "flex-end" },

  weatherMiniTemp: {
    fontSize: fonts.base,
    fontWeight: "800",
    color: colors.teal,
  },

  weatherMiniDesc: { fontSize: fonts.xs, color: colors.textSecondary },

  triggerCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,

    backgroundColor: colors.amberDim,
    borderRadius: radius.md,

    borderWidth: 1,
    borderColor: colors.amber + "60",
    padding: spacing.md,
  },

  triggerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.amber,
    flexShrink: 0,
    marginTop: 3,
  },

  triggerText: {
    fontSize: fonts.sm,
    color: colors.amber,
    lineHeight: 18,
    flex: 1,
  },

  lastSosRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },

  lastSosLabel: { fontSize: fonts.sm, fontWeight: "600", color: colors.text },

  lastSosTime: { fontSize: fonts.xs, color: colors.textMuted, marginTop: 2 },

  sosBadge: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
  },

  sosBadgeText: {
    fontSize: fonts.xs,
    color: colors.emergency,
    fontWeight: "700",
  },

  forecastScroll: { marginTop: 4 },

  forecastRow: { gap: spacing.md, paddingBottom: 4 },

  forecastItem: { alignItems: "center", gap: 2, minWidth: 54 },

  forecastDay: {
    fontSize: fonts.xs,
    color: colors.textMuted,
    fontWeight: "600",
  },

  forecastIcon: { width: 32, height: 32 },

  forecastHigh: { fontSize: fonts.sm, color: colors.text, fontWeight: "700" },

  forecastLow: { fontSize: fonts.xs, color: colors.textMuted },
})
