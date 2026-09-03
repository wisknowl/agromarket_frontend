import React from 'react';
import { Tabs } from 'expo-router';
import {
  Home,
  MessageSquare,
  Sprout,
  ShoppingBag,
  User,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useCartStore } from '@/store/cartStore';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const cartItemCount = useCartStore((state) => state.getItemCount());
  const insets = useSafeAreaInsets();

  const TAB_BAR_BASE_HEIGHT = 64;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.cultivated,
        tabBarInactiveTintColor: 'rgba(36, 26, 18, 0.45)',
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.parchmentDim,
          borderTopWidth: 1,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          height: TAB_BAR_BASE_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : Platform.OS === 'android' ? 10 : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyMedium,
          fontSize: 11,
          letterSpacing: 0.1,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: Colors.white,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.parchmentDim,
        },
        headerTitleStyle: {
          fontFamily: Fonts.displayItalic,
          fontSize: 19,
          color: Colors.canopy,
        },
        headerTintColor: Colors.espresso,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'AgroFeed',
          tabBarIcon: ({ color }) => <Home size={22} color={color} strokeWidth={2.2} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="agro-yields"
        options={{
          title: 'Harvests',
          tabBarIcon: ({ color }) => <Sprout size={22} color={color} strokeWidth={2.2} />,
          headerTitle: 'Direct Harvests',
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Basket',
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <ShoppingBag size={22} color={color} strokeWidth={2.2} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerTitle: 'Your Basket',
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <MessageSquare size={22} color={color} strokeWidth={2.2} />,
          headerTitle: 'Messages',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={22} color={color} strokeWidth={2.2} />,
          headerTitle: 'Profile & Farm',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -4,
    backgroundColor: Colors.gold,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.espresso,
    fontSize: 10,
    fontFamily: Fonts.monoBold,
  },
});