import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';


export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#14532d',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          backgroundColor: '#f1f5f9',
          borderTopColor: '#e5e7eb',
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
        <Tabs.Screen
            name="index"
            options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
            headerTitle: "Admin Dashboard",
            headerShown: false

            }}
        />
        <Tabs.Screen
            name="users"
            options={{
            title: "Users",
            tabBarIcon: ({ color }) => <Ionicons name="people" size={24} color={color} />,
            headerTitle: "Manage Users",
            }}
        />
        <Tabs.Screen
            name="settings"
            options={{
            title: "Settings",
            tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} />,
            headerTitle: "App Settings",
            }}
        />
    </Tabs>
  );
}
