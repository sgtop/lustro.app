import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { T } from '../../src/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: T.bg },
        headerTintColor: T.text,
        headerTitleStyle: { fontWeight: '700', letterSpacing: 2 },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: T.bgElev,
          borderTopColor: T.border,
          borderTopWidth: 0.5,
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: T.accent,
        tabBarInactiveTintColor: T.textMute,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoje',
          headerTitle: 'L U S T R O',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: 'Clientes',
          headerTitle: 'Clientes',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          headerTitle: 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          title: 'Documentos',
          headerTitle: 'Documentos',
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
