import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { colors, fonts } from '../../lib/theme';

// ─── Geometric tab icons (no emoji) ──────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  return (
    <View style={{ width: 22, height: 20, alignItems: 'center' }}>
      {/* Roof triangle via two angled rectangles */}
      <View style={{ width: 22, height: 10, alignItems: 'center', justifyContent: 'flex-end' }}>
        <View
          style={{
            width: 0, height: 0,
            borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 10,
            borderLeftColor: 'transparent', borderRightColor: 'transparent',
            borderBottomColor: c,
          }}
        />
      </View>
      {/* House body */}
      <View style={{ width: 14, height: 10, backgroundColor: c, borderRadius: 1 }} />
    </View>
  );
}

function HealthIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  // Heartbeat line: a horizontal bar with a peak in the middle
  return (
    <View style={{ width: 24, height: 16, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }} />
      <View style={{ width: 4, height: 12, backgroundColor: c, borderRadius: 2, marginHorizontal: 1 }} />
      <View style={{ width: 4, height: 7, backgroundColor: c, borderRadius: 2, marginHorizontal: 1 }} />
      <View style={{ flex: 1, height: 2, backgroundColor: c, borderRadius: 1 }} />
    </View>
  );
}

function CircleIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  // Two overlapping circles
  return (
    <View style={{ width: 24, height: 18 }}>
      <View style={{
        position: 'absolute', left: 0, top: 1,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2, borderColor: c,
      }} />
      <View style={{
        position: 'absolute', left: 8, top: 1,
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 2, borderColor: c,
      }} />
    </View>
  );
}

function RecordsIcon({ active }: { active: boolean }) {
  const c = active ? colors.tabActive : colors.tabInactive;
  // Document: rectangle with folded corner lines
  return (
    <View style={{ width: 16, height: 20 }}>
      <View style={{
        width: 16, height: 20, borderRadius: 2,
        borderWidth: 2, borderColor: c,
        overflow: 'hidden',
      }}>
        {/* Three line stripes */}
        <View style={{ width: 8, height: 2, backgroundColor: c, borderRadius: 1, position: 'absolute', top: 5, left: 3 }} />
        <View style={{ width: 10, height: 2, backgroundColor: c, borderRadius: 1, position: 'absolute', top: 9, left: 2 }} />
        <View style={{ width: 8, height: 2, backgroundColor: c, borderRadius: 1, position: 'absolute', top: 13, left: 3 }} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
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
          title: 'Home',
          tabBarIcon: ({ focused }) => <HomeIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ focused }) => <HealthIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: ({ focused }) => <CircleIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ focused }) => <RecordsIcon active={focused} />,
        }}
      />
    </Tabs>
  );
}
