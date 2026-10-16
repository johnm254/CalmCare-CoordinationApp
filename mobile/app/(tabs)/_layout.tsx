import { Tabs, router } from 'expo-router';
import { TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../../lib/theme';

// ─── Tab bar icons (View-based, no emoji/SVG) ─────────────────────────────────

function TodayIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      {/* Sun circle */}
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
      {/* Four rays */}
      {[0, 90, 180, 270].map((deg) => (
        <View
          key={deg}
          style={{
            position: 'absolute', width: 3, height: 3, borderRadius: 1.5,
            backgroundColor: c,
            transform: [{ rotate: `${deg}deg` }, { translateY: -8 }],
          }}
        />
      ))}
    </View>
  );
}

function VitalsIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 26, height: 16, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }} />
      <View style={{ width: 3, height: 14, backgroundColor: c, borderRadius: 1.5, marginHorizontal: 1 }} />
      <View style={{ width: 3, height: 8, backgroundColor: c, borderRadius: 1.5, marginHorizontal: 1 }} />
      <View style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }} />
    </View>
  );
}

function MedsIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      {/* Pill: top capsule + bottom capsule */}
      <View style={{ width: 16, height: 8, borderRadius: 4, backgroundColor: c, marginBottom: 2 }} />
      <View style={{ width: 16, height: 8, borderRadius: 4, backgroundColor: c, opacity: 0.5 }} />
    </View>
  );
}

function CareIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 24, height: 20 }}>
      <View style={{
        position: 'absolute', left: 0, top: 2,
        width: 14, height: 14, borderRadius: 7,
        borderWidth: 2, borderColor: c,
      }} />
      <View style={{
        position: 'absolute', left: 9, top: 2,
        width: 14, height: 14, borderRadius: 7,
        borderWidth: 2, borderColor: c,
      }} />
    </View>
  );
}

function MeIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 20, height: 22, alignItems: 'center' }}>
      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c }} />
      <View style={{
        width: 20, height: 8, borderTopLeftRadius: 10, borderTopRightRadius: 10,
        backgroundColor: c, marginTop: 2,
      }} />
    </View>
  );
}

// ─── Persistent SOS button in header ─────────────────────────────────────────

function SOSHeaderButton() {
  return (
    <TouchableOpacity
      onPress={() => router.push('/sos')}
      style={{
        marginRight: 16,
        backgroundColor: colors.emergency,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 6,
        minWidth: 48, minHeight: 48,
        alignItems: 'center', justifyContent: 'center',
      }}
      accessibilityLabel="SOS — press for emergency"
      accessibilityRole="button"
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontSize: fonts.md, fontWeight: '700' },
        headerRight: () => <SOSHeaderButton />,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: fonts.xs, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ focused }) => <TodayIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Vitals',
          tabBarIcon: ({ focused }) => <VitalsIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="meds"
        options={{
          title: 'Meds',
          tabBarIcon: ({ focused }) => <MedsIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Care',
          tabBarIcon: ({ focused }) => <CareIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: 'Me',
          tabBarIcon: ({ focused }) => <MeIcon active={focused} />,
        }}
      />
      {/* Hide records from tab bar — accessible from Me tab */}
      <Tabs.Screen name="records" options={{ href: null }} />
    </Tabs>
  );
}
