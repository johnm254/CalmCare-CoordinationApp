import { Tabs, router } from "expo-router"

import {
  TouchableOpacity,
  View,
  Text,
  Animated,
  StyleSheet,
} from "react-native"

import { useRef, useEffect } from "react"

import * as Haptics from "expo-haptics"

import { useSafeAreaInsets } from "react-native-safe-area-context"

import { colors, fonts, radius } from "../../lib/theme"

// ─── Tab bar icons ─────────────────────────────────────────────────────────────

function TodayIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{ width: 11, height: 11, borderRadius: 5.5, backgroundColor: c }}
      />
      {[0, 72, 144, 216, 288].map((deg) => (
        <View
          key={deg}
          style={{
            position: "absolute",
            width: 3,
            height: 3,
            borderRadius: 1.5,

            backgroundColor: c,

            transform: [{ rotate: `${deg}deg` }, { translateY: -9 }],
          }}
        />
      ))}
    </View>
  )
}

function VitalsIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View
      style={{
        width: 28,
        height: 18,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }}
      />
      <View
        style={{
          width: 3,
          height: 16,
          backgroundColor: c,
          borderRadius: 1.5,
          marginHorizontal: 1.5,
        }}
      />
      <View
        style={{
          width: 3,
          height: 10,
          backgroundColor: c,
          borderRadius: 1.5,
          marginHorizontal: 1.5,
        }}
      />
      <View
        style={{
          width: 3,
          height: 6,
          backgroundColor: c,
          borderRadius: 1.5,
          marginHorizontal: 1.5,
        }}
      />
      <View
        style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }}
      />
    </View>
  )
}

function MedsIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{ width: 18, height: 9, borderRadius: 9, backgroundColor: c }}
      />
      <View
        style={{
          width: 18,
          height: 9,
          borderRadius: 9,
          backgroundColor: c,
          opacity: 0.45,
          marginTop: 2,
        }}
      />
    </View>
  )
}

function CareIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View style={{ width: 26, height: 22 }}>
      <View
        style={{
          position: "absolute",
          left: 0,
          top: 2,

          width: 15,
          height: 15,
          borderRadius: 7.5,

          borderWidth: 2.5,
          borderColor: c,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 10,
          top: 2,

          width: 15,
          height: 15,
          borderRadius: 7.5,

          borderWidth: 2.5,
          borderColor: c,
          opacity: 0.65,
        }}
      />
    </View>
  )
}

function MoodIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View
      style={{
        width: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Face circle */}
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: 2,
          borderColor: c,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Eyes */}
        <View
          style={{
            flexDirection: "row",
            gap: 5,
            marginBottom: 2,
            marginTop: -2,
          }}
        >
          <View
            style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: c }}
          />
          <View
            style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: c }}
          />
        </View>
        {/* Mouth — curved arc approximated with a View */}
        <View
          style={{
            width: 8,
            height: 4,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
            borderWidth: 2,
            borderTopWidth: 0,
            borderColor: c,
          }}
        />
      </View>
    </View>
  )
}

function MeIcon({ active }: { active: boolean }) {
  const c = active ? colors.teal : colors.tabInactive

  return (
    <View style={{ width: 22, height: 24, alignItems: "center" }}>
      <View
        style={{ width: 15, height: 15, borderRadius: 7.5, backgroundColor: c }}
      />
      <View
        style={{
          width: 22,
          height: 9,
          borderTopLeftRadius: 11,
          borderTopRightRadius: 11,

          backgroundColor: c,
          marginTop: 2,
        }}
      />
    </View>
  )
}

// ─── Custom tab bar label with active pill ────────────────────────────────────

function TabLabel({ label, active }: { label: string; active: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10,

        fontWeight: active ? "700" : "500",

        letterSpacing: 0.3,

        color: active ? colors.teal : colors.tabInactive,

        marginTop: 3,
      }}
    >
      {label}
    </Text>
  )
}

// ─── SOS header button ────────────────────────────────────────────────────────

function SOSHeaderButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push("/sos")}
      style={{
        marginRight: 16,

        backgroundColor: colors.emergency,

        borderRadius: radius.full,

        paddingHorizontal: 18,

        paddingVertical: 7,

        minWidth: 52,
        minHeight: 36,

        alignItems: "center",
        justifyContent: "center",

        shadowColor: colors.emergency,

        shadowOffset: { width: 0, height: 0 },

        shadowOpacity: 0.6,

        shadowRadius: 8,

        elevation: 8,
      }}
      accessibilityLabel="SOS — press for emergency"
      accessibilityRole="button"
    >
      <Text
        style={{
          color: "#fff",
          fontWeight: "800",
          fontSize: 13,
          letterSpacing: 1,
        }}
      >
        SOS
      </Text>
    </TouchableOpacity>
  )
}

// ─── Floating SOS action button ───────────────────────────────────────────────

const TAB_BAR_HEIGHT = 72

function SosFab() {
  const insets = useSafeAreaInsets()
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.18, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [])

  const bottom = TAB_BAR_HEIGHT + insets.bottom + 12

  return (
    <Animated.View
      style={[fabStyles.ring, { bottom: bottom + 2, transform: [{ scale: pulse }] }]}
      pointerEvents="none"
    />
  )
}

function SosFabButton() {
  const insets = useSafeAreaInsets()
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
    Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 260, friction: 12 }).start()
  }

  function handlePressOut() {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 260, friction: 12 }).start()
  }

  const bottom = TAB_BAR_HEIGHT + insets.bottom + 12

  return (
    <Animated.View style={[fabStyles.fabWrap, { bottom, transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => router.push("/sos")}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={fabStyles.fab}
        activeOpacity={1}
        accessibilityLabel="SOS — press for emergency"
        accessibilityRole="button"
      >
        <Text style={fabStyles.fabText}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

const fabStyles = StyleSheet.create({
  ring: {
    position: "absolute",
    right: 20 - 10,
    width: 56 + 20,
    height: 56 + 20,
    borderRadius: (56 + 20) / 2,
    backgroundColor: "rgba(239,68,68,0.18)",
    zIndex: 99,
  },
  fabWrap: {
    position: "absolute",
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emergency,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.emergency,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 12,
    elevation: 10,
  },
  fabText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
    letterSpacing: 1.2,
  },
})

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: true,

        headerStyle: { backgroundColor: colors.bg },

        headerTintColor: colors.text,

        headerTitleStyle: {
          fontSize: fonts.md,
          fontWeight: "700",
          color: colors.text,
        },

        headerRight: () => <SOSHeaderButton />,

        tabBarStyle: {
          backgroundColor: colors.tabBg,

          borderTopColor: colors.border,

          borderTopWidth: 1,

          height: 72,

          paddingBottom: 14,

          paddingTop: 10,
        },

        tabBarActiveTintColor: colors.teal,

        tabBarInactiveTintColor: colors.tabInactive,

        tabBarShowLabel: false,

        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <TodayIcon active={focused} />
              </View>
              <TabLabel label="Today" active={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: "Vitals",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <VitalsIcon active={focused} />
              </View>
              <TabLabel label="Vitals" active={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: "Meds",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <MedsIcon active={focused} />
              </View>
              <TabLabel label="Meds" active={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: "Care",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <CareIcon active={focused} />
              </View>
              <TabLabel label="Care" active={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: "Mood",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <MoodIcon active={focused} />
              </View>
              <TabLabel label="Mood" active={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: "Me",

          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  padding: 6,
                  borderRadius: 12,

                  backgroundColor: focused
                    ? `rgba(139,92,246,0.15)`
                    : "transparent",
                }}
              >
                <MeIcon active={focused} />
              </View>
              <TabLabel label="Me" active={focused} />
            </View>
          ),
        }}
      />
      {/* Map accessible from Today "Track" card — hidden from tab bar */}
      <Tabs.Screen name="map" options={{ href: null }} />
      {/* Records accessible from Me tab */}
      <Tabs.Screen name="records" options={{ href: null }} />
    </Tabs>
    {/* Persistent SOS FAB — pulse ring sits behind the button */}
    <SosFab />
    <SosFabButton />
    </View>
  )
}
