import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { colors, fonts } from '../../lib/theme';

const ICONS: Record<string, string> = {
  Home: '🏠',
  Health: '♥',
  Circle: '◎',
  Records: '☰',
};

function TabIcon({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      {active && (
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.teal,
            position: 'absolute',
            top: -2,
          }}
        />
      )}
      <Text style={{ fontSize: 20, color: active ? colors.tabActive : colors.tabInactive, marginTop: 4 }}>
        {ICONS[label] ?? '○'}
      </Text>
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
          height: 64,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: fonts.xs, fontWeight: '600', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon label="Home" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="health"
        options={{
          title: 'Health',
          tabBarIcon: ({ focused }) => <TabIcon label="Health" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Circle',
          tabBarIcon: ({ focused }) => <TabIcon label="Circle" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: 'Records',
          tabBarIcon: ({ focused }) => <TabIcon label="Records" active={focused} />,
        }}
      />
    </Tabs>
  );
}
