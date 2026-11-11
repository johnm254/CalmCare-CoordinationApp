import { Tabs, router } from "expo-router"
import { TouchableOpacity, View, Text, Animated, StyleSheet } from "react-native"
import { useRef, useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radius } from "../../lib/theme"

// Distance from screen bottom to bottom of floating tab bar
export const TAB_BOTTOM = 20
export const TAB_HEIGHT = 66
// Total space screens must leave at the bottom
export const TAB_SAFE_AREA = TAB_BOTTOM + TAB_HEIGHT + 12

// ─── Animated tab item ────────────────────────────────────────────────────────

function TabItem({
  iconActive,
  iconInactive,
  label,
  active,
}: {
  iconActive: keyof typeof Ionicons.glyphMap
  iconInactive: keyof typeof Ionicons.glyphMap
  label: string
  active: boolean
}) {
  const pillWidth  = useRef(new Animated.Value(active ? 1 : 0)).current
  const pillOpacity = useRef(new Animated.Value(active ? 1 : 0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(pillWidth,   { toValue: active ? 1 : 0, duration: 220, useNativeDriver: false }),
      Animated.timing(pillOpacity, { toValue: active ? 1 : 0, duration: 180, useNativeDriver: false }),
    ]).start()
  }, [active])

  const animatedWidth = pillWidth.interpolate({ inputRange: [0, 1], outputRange: [36, 80] })

  return (
    <View style={tabItemStyles.wrap}>
      <Animated.View
        style={[
          tabItemStyles.pill,
          {
            width: animatedWidth,
            opacity: pillOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
          },
        ]}
      >
        <Ionicons name={active ? iconActive : iconInactive} size={18} color="#FFFFFF" />
        <Animated.Text style={[tabItemStyles.pillLabel, { opacity: pillOpacity }]}>
          {label}
        </Animated.Text>
      </Animated.View>

      {!active && (
        <View style={tabItemStyles.inactiveWrap}>
          <Ionicons name={iconInactive} size={20} color={colors.tabInactive} />
          <Text style={tabItemStyles.inactiveLabel}>{label}</Text>
        </View>
      )}
    </View>
  )
}

const tabItemStyles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    height: TAB_HEIGHT,
  },
  pill: {
    flexDirection:  "row",
    alignItems:     "center",
    justifyContent: "center",
    gap:            5,
    height:         34,
    borderRadius:   17,
    backgroundColor: colors.tabActive,
    paddingHorizontal: 12,
    overflow: "hidden",
  },
  pillLabel: {
    color:       "#FFFFFF",
    fontSize:    fonts.xs,
    fontWeight:  "700",
    letterSpacing: 0.1,
  },
  inactiveWrap: {
    alignItems: "center",
    gap: 2,
    position: "absolute",
  },
  inactiveLabel: {
    fontSize: fonts.xxs,
    fontWeight: "600",
    color: colors.tabInactive,
    letterSpacing: 0.1,
  },
})

// ─── Floating SOS FAB ─────────────────────────────────────────────────────────

function SosFab() {
  const insets = useSafeAreaInsets()
  const haloOpacity = useRef(new Animated.Value(0.18)).current
  const bottom = TAB_BOTTOM + TAB_HEIGHT + insets.bottom + 14

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(haloOpacity, { toValue: 0.42, duration: 2000, useNativeDriver: true }),
        Animated.timing(haloOpacity, { toValue: 0.18, duration: 2000, useNativeDriver: true }),
      ]),
    )
    anim.start()
    return () => anim.stop()
  }, [])

  return (
    <Animated.View
      pointerEvents="none"
      style={[fabStyles.ring, { bottom: bottom + 2, opacity: haloOpacity }]}
    />
  )
}

const HOLD_MS = 1500
const HAPTIC_STEP_MS = 300

function SosFabButton() {
  const insets = useSafeAreaInsets()
  const scale         = useRef(new Animated.Value(1)).current
  const ringProgress  = useRef(new Animated.Value(0)).current
  const hintOpacity   = useRef(new Animated.Value(0)).current
  const bottom        = TAB_BOTTOM + TAB_HEIGHT + insets.bottom + 14

  const holdTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hapticTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdAnim      = useRef<Animated.CompositeAnimation | null>(null)
  const hintTimer     = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearTimers() {
    if (holdTimer.current)  { clearTimeout(holdTimer.current);   holdTimer.current = null }
    if (hapticTimer.current){ clearInterval(hapticTimer.current); hapticTimer.current = null }
    if (holdAnim.current)   { holdAnim.current.stop();            holdAnim.current = null }
  }

  function onPressIn() {
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 12 }).start()

    ringProgress.setValue(0)
    holdAnim.current = Animated.timing(ringProgress, {
      toValue: 1,
      duration: HOLD_MS,
      useNativeDriver: false,
    })
    holdAnim.current.start()

    let steps = 0
    hapticTimer.current = setInterval(() => {
      steps++
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }, HAPTIC_STEP_MS)

    holdTimer.current = setTimeout(() => {
      clearTimers()
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }).start()
      ringProgress.setValue(0)
      router.push("/sos")
    }, HOLD_MS)
  }

  function onPressOut() {
    clearTimers()
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }).start()
    Animated.timing(ringProgress, { toValue: 0, duration: 200, useNativeDriver: false }).start()
  }

  function onPress() {
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintOpacity.setValue(1)
    hintTimer.current = setTimeout(() => {
      Animated.timing(hintOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start()
    }, 2000)
  }

  return (
    <Animated.View style={[fabStyles.wrap, { bottom, transform: [{ scale }] }]}>
      <Animated.Text style={[fabStyles.hint, { opacity: hintOpacity }]} pointerEvents="none">
        Hold to send SOS
      </Animated.Text>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={fabStyles.btn}
        activeOpacity={1}
        accessibilityLabel="SOS — hold to send emergency alert"
        accessibilityRole="button"
      >
        <Text style={fabStyles.text}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const fabStyles = StyleSheet.create({
  ring: {
    position:        "absolute",
    right:           10,
    width:           76,
    height:          76,
    borderRadius:    38,
    backgroundColor: "rgba(200,16,46,0.55)",
    zIndex:          99,
  },
  wrap: {
    position: "absolute",
    right:    20,
    zIndex:   100,
    alignItems: "center",
  },
  hint: {
    position:        "absolute",
    top:             -28,
    backgroundColor: "rgba(0,0,0,0.72)",
    color:           "#fff",
    fontSize:        fonts.xxs,
    fontWeight:      "600",
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:    8,
    overflow:        "hidden",
  },
  btn: {
    width:          56,
    height:         56,
    borderRadius:   28,
    backgroundColor: colors.emergency,
    alignItems:     "center",
    justifyContent: "center",
    shadowColor:    colors.emergency,
    shadowOffset:   { width: 0, height: 4 },
    shadowOpacity:  0.60,
    shadowRadius:   14,
    elevation:      10,
  },
  text: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1.4 },
})

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs
        screenOptions={{
          headerShown:      true,
          headerStyle:      { backgroundColor: colors.bg },
          headerTintColor:  colors.text,
          headerTitleStyle: { fontSize: fonts.md, fontWeight: "700", color: colors.text },
          headerShadowVisible: false,
          tabBarStyle: {
            backgroundColor: colors.tabBg,
            position:        "absolute",
            bottom:          TAB_BOTTOM,
            left:            16,
            right:           16,
            height:          TAB_HEIGHT,
            borderRadius:    33,
            borderTopWidth:  0,
            shadowColor:     "#0C1F20",
            shadowOffset:    { width: 0, height: 8 },
            shadowOpacity:   0.10,
            shadowRadius:    24,
            elevation:       16,
            paddingHorizontal: 8,
          },
          tabBarShowLabel:   false,
          tabBarItemStyle:   { height: TAB_HEIGHT },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title:      "Today",
            headerShown: false,   // custom header rendered inside the screen
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="home" iconInactive="home-outline" label="Today" active={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="health"
          options={{
            title: "Vitals",
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="pulse" iconInactive="pulse-outline" label="Vitals" active={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="meds"
          options={{
            title: "Meds",
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="medical" iconInactive="medical-outline" label="Meds" active={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="circle"
          options={{
            title: "Care",
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="people" iconInactive="people-outline" label="Care" active={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="mood"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="me"
          options={{
            title: "Me",
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="person" iconInactive="person-outline" label="Me" active={focused} />
            ),
          }}
        />
        <Tabs.Screen name="map"     options={{ href: null }} />
        <Tabs.Screen name="records" options={{ href: null }} />
      </Tabs>

      <SosFab />
      <SosFabButton />
    </View>
  )
}
