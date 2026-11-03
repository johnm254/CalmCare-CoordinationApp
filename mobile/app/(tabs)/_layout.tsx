import { Tabs, router } from "expo-router"
import { TouchableOpacity, View, Text, Animated, StyleSheet } from "react-native"
import { useRef, useEffect } from "react"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts, radius } from "../../lib/theme"

const TAB_BAR_HEIGHT = 82

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
  const scale = useRef(new Animated.Value(active ? 1 : 0.88)).current
  const pillOpacity = useRef(new Animated.Value(active ? 1 : 0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1 : 0.88,
        tension: 280,
        friction: 14,
        useNativeDriver: true,
      }),
      Animated.timing(pillOpacity, {
        toValue: active ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start()
  }, [active])

  return (
    <Animated.View style={{ alignItems: "center", gap: 4, transform: [{ scale }] }}>
      {/* Icon with pill bg */}
      <View style={{ alignItems: "center", justifyContent: "center", width: 50, height: 32 }}>
        <Animated.View
          style={{
            ...StyleSheet.absoluteFillObject,
            borderRadius: 16,
            backgroundColor: colors.teal,
            opacity: pillOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.16] }),
          }}
        />
        <Ionicons
          name={active ? iconActive : iconInactive}
          size={22}
          color={active ? colors.teal : colors.tabInactive}
        />
      </View>
      {/* Label */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: active ? "700" : "500",
          color: active ? colors.teal : colors.tabInactive,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Animated.View>
  )
}

// ─── SOS header button ────────────────────────────────────────────────────────

function SOSHeaderButton() {
  const scale = useRef(new Animated.Value(1)).current

  function onPressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, tension: 300, friction: 12 }).start()
  }

  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }).start()
  }

  return (
    <Animated.View style={{ marginRight: 16, transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={() => router.push("/sos")}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={headerStyles.sosBtn}
        accessibilityLabel="SOS — tap for emergency"
        accessibilityRole="button"
      >
        <Text style={headerStyles.sosBtnText}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const headerStyles = StyleSheet.create({
  sosBtn: {
    backgroundColor: colors.emergency,
    borderRadius: radius.full,
    paddingHorizontal: 18,
    paddingVertical: 7,
    minWidth: 58,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 8,
  },
  sosBtnText: { color: "#fff", fontWeight: "800", fontSize: 13, letterSpacing: 1.2 },
})

// ─── Floating SOS FAB ─────────────────────────────────────────────────────────

function SosFab() {
  const insets = useSafeAreaInsets()
  const pulse = useRef(new Animated.Value(1)).current
  const bottom = TAB_BAR_HEIGHT + insets.bottom + 10

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 950, useNativeDriver: true }),
      ]),
    ).start()
  }, [])

  return (
    <Animated.View
      pointerEvents="none"
      style={[fabStyles.ring, { bottom: bottom + 2, transform: [{ scale: pulse }] }]}
    />
  )
}

function SosFabButton() {
  const insets = useSafeAreaInsets()
  const scale = useRef(new Animated.Value(1)).current
  const bottom = TAB_BAR_HEIGHT + insets.bottom + 10

  function onPressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 300, friction: 12 }).start()
  }

  function onPressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 12 }).start()
  }

  return (
    <Animated.View style={[fabStyles.wrap, { bottom, transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => router.push("/sos")}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={fabStyles.btn}
        activeOpacity={1}
        accessibilityLabel="SOS — tap for emergency"
        accessibilityRole="button"
      >
        <Text style={fabStyles.text}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const fabStyles = StyleSheet.create({
  ring: {
    position: "absolute",
    right: 10,
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(244,63,94,0.18)",
    zIndex: 99,
  },
  wrap: {
    position: "absolute",
    right: 20,
    zIndex: 100,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emergency,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.65,
    shadowRadius: 14,
    elevation: 10,
  },
  text: { color: "#fff", fontWeight: "900", fontSize: 13, letterSpacing: 1.4 },
})

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontSize: fonts.md, fontWeight: "700", color: colors.text },
          headerShadowVisible: false,
          headerRight: () => <SOSHeaderButton />,
          tabBarStyle: {
            backgroundColor: colors.tabBg,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: TAB_BAR_HEIGHT,
            paddingBottom: 10,
            paddingTop: 6,
          },
          tabBarShowLabel: false,
          tabBarItemStyle: { paddingVertical: 0 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Today",
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
          options={{
            title: "Mood",
            tabBarIcon: ({ focused }) => (
              <TabItem iconActive="happy" iconInactive="happy-outline" label="Mood" active={focused} />
            ),
          }}
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
        <Tabs.Screen name="map" options={{ href: null }} />
        <Tabs.Screen name="records" options={{ href: null }} />
      </Tabs>

      {/* Persistent SOS FAB */}
      <SosFab />
      <SosFabButton />
    </View>
  )
}
