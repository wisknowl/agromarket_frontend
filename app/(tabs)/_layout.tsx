import React from "react";
import { Tabs } from "expo-router";
import { Home, Inbox, ShoppingBag, ShoppingCart, User } from "lucide-react-native";
import { Leaf, Sprout, Wheat, Trees } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useCartStore } from "@/store/cartStore";
import { View, Text, StyleSheet } from "react-native";

export default function TabLayout() {
  const cartItemCount = useCartStore(state => state.getItemCount());

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopColor: Colors.border,
          elevation: 0,
          shadowOpacity: 0,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: Colors.background,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
          headerTitle: "AgroLink Cameroon",
          headerShown: false
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color }) => <Inbox size={24} color={color} />,
          headerTitle: "Messages",
        }}
      />
      <Tabs.Screen
        name="agro-yields"
        options={{
          title: "AgroYields",
          tabBarIcon: ({ color }) => <Sprout size={24} color={color} />,
          headerTitle: "AgroYields Marketplace",
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => (
            <View style={{ position: 'relative' }}>
              <ShoppingCart size={24} color={color} />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
          headerTitle: "Shopping Cart",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
          headerTitle: "My Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -8,
    top: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.text.light,
    fontSize: 10,
    fontWeight: '700',
  },
});