import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
  Sprout,
  ShoppingBag,
  MessageSquare,
  User,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { Fonts } from '@/constants/typography';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { useRegionalContainerStore } from '@/store/regionalContainerStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CustomTabBarProps {
  state?: any;
  descriptors?: any;
  navigation?: any;
  activeRoute?: string;
}

const DEFAULT_ROUTES = [
  { key: 'index', name: 'index' },
  { key: 'agro-yields', name: 'agro-yields' },
  { key: 'cart', name: 'cart' },
  { key: 'inbox', name: 'inbox' },
  { key: 'profile', name: 'profile' },
];

export default function CustomTabBar(props?: CustomTabBarProps) {
  const { state, descriptors, navigation, activeRoute } = props || {};
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();
  const cartItemCount = useCartStore((s) => s.getItemCount());
  const openCreatePostModal = useUIStore((s) => s.openCreatePostModal);
  const regionalContainer = useRegionalContainerStore((s) => s.getContainer());

  // A profile is a farmer STRICTLY if they have at least 1 registered farm
  const userHasFarm = Boolean(user?.farms && user.farms.length > 0);

  // Calculate platform-perfect bottom inset and tab bar height:
  // On iOS, standard Apple HIG tab height is 49-50pt plus home indicator (~34pt).
  // On Android, full custom height is needed to clear 3-button navigation and gesture pills.
  const bottomInset = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? insets.bottom - 12 : 6)
    : insets.bottom;

  const tabContainerHeight = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? 50 + insets.bottom : 58)
    : (62 + insets.bottom);

  const routes = state?.routes || DEFAULT_ROUTES;

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? Colors.cultivated : 'rgba(36, 26, 18, 0.45)';
    const strokeWidth = isFocused ? 2.5 : 2.0;

    switch (routeName) {
      case 'index':
        return <Home size={22.5} color={color} strokeWidth={strokeWidth} />;
      case 'agro-yields':
        return <Sprout size={22.5} color={color} strokeWidth={strokeWidth} />;
      case 'cart':
        return (
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                overflow: 'hidden',
                borderWidth: isFocused ? 2 : 1,
                borderColor: isFocused ? Colors.gold : 'rgba(36, 26, 18, 0.55)',
                backgroundColor: Colors.parchment,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                source={regionalContainer.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            </View>
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
        return <MessageSquare size={22.5} color={color} strokeWidth={strokeWidth} />;
      case 'profile':
        return <User size={22.5} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={22.5} color={color} strokeWidth={strokeWidth} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'AgroFeed';
      case 'agro-yields':
        return 'AgroMarket';
      case 'cart':
        return regionalContainer.shortName;
      case 'inbox':
        return 'Inbox';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: bottomInset, height: tabContainerHeight }]}>
      {/* Flat Top border line */}
      <View style={styles.topBorderLine} />

      {/* 5 Navigation Tabs */}
      <View style={styles.tabsRow}>
        {routes.map((route: any, index: number) => {
          const options = descriptors ? descriptors[route.key]?.options : {};
          const isFocused = state ? state.index === index : activeRoute === route.name;

          const onPress = () => {
            if (navigation && state) {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            } else {
              const routePath = route.name === 'index' ? '/(tabs)/' : `/(tabs)/${route.name}`;
              router.push(routePath as any);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options?.tabBarAccessibilityLabel}
              testID={options?.tabBarButtonTestID}
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
                    color: isFocused
                      ? (route.name === 'cart' ? Colors.gold : Colors.cultivated)
                      : 'rgba(36, 26, 18, 0.55)',
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
    paddingVertical: Platform.OS === 'ios' ? 4 : 6,
  },
  centerPlusTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  centerPlusCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.cultivated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cultivated,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  iconWrapper: {
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    includeFontPadding: false,
    textAlign: 'center',
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
