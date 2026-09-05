import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import {
  Home,
  Sprout,
  ShoppingBag,
  MessageSquare,
  User,
  Plus,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const openCreatePostModal = useUIStore((s) => s.openCreatePostModal);

  // A profile is a farmer STRICTLY if they have at least 1 registered farm
  const userHasFarm = Boolean(user?.farms && user.farms.length > 0);

  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 36 : 0;
  const TAB_BAR_HEIGHT = 62;

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)';
    const strokeWidth = isFocused ? 2.5 : 2.0;

    switch (routeName) {
      case 'index':
        return <Home size={22} color={color} strokeWidth={strokeWidth} />;
      case 'agro-yields':
        return <Sprout size={22} color={color} strokeWidth={strokeWidth} />;
      case 'cart':
        return (
          <View style={{ position: 'relative' }}>
            <ShoppingBag size={22} color={color} strokeWidth={strokeWidth} />
            {cartItemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </Text>
              </View>
            )}
          </View>
        );
      case 'inbox':
        return <MessageSquare size={22} color={color} strokeWidth={strokeWidth} />;
      case 'profile':
        return <User size={22} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={22} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'AgroFeed';
      case 'agro-yields':
        return 'Harvests';
      case 'cart':
        return 'Basket';
      case 'inbox':
        return 'Inbox';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  // If user is a farmer, we place the bulging "+" button in the middle
  // Left 2 items (index, agro-yields), Center Bulge (+), Right 2 items (cart or inbox, profile)
  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomInset, height: TAB_BAR_HEIGHT + bottomInset }]}>
      {/* Flat Top border line */}
      <View style={styles.topBorderLine} />

      {/* 5 Equal Navigation Tabs */}
      <View style={styles.tabsRow}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrapper}>
                {getTabIcon(route.name, isFocused)}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? Colors.cultivated : 'rgba(36, 26, 18, 0.55)',
                    fontFamily: isFocused ? Fonts.bodySemiBold : Fonts.bodyMedium,
                  },
                ]}
                numberOfLines={1}
              >
                {getTabLabel(route.name)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Circular green + button positioned absolutely on top of tabbar (Zero Shadow, Clean Blend) */}
      {userHasFarm && (
        <TouchableOpacity
          style={styles.absoluteCenterButton}
          onPress={() => router.push('/feed/create')}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Create harvest update"
        >
          <Plus size={26} color={Colors.white} strokeWidth={3} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    backgroundColor: Colors.white,
    position: 'relative',
    borderTopWidth: 1,
    borderTopColor: Colors.parchmentDim,
  },
  topBorderLine: {
    position: 'absolute',
    top: -1,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.parchmentDim,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  iconWrapper: {
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: 0.1,
    includeFontPadding: false,
    textAlign: 'center',
  },
  absoluteCenterButton: {
    position: 'absolute',
    top: -44, // Shifted up so it sits above the tabbar border and clears the Basket tab below
    left: '50%',
    marginLeft: -24, // Half of 48px for exact center alignment
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.cultivated, // Pure brand green
    borderWidth: 3,
    borderColor: Colors.white, // Crisp white outline blending with top border
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
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
