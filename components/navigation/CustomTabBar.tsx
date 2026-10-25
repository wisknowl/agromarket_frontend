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

  // Calculate platform-perfect bottom inset and tab bar height based on standard mobile ergonomics:
  // Sleek Apple HIG / Material 3 standard profile (56-64pt content height + safe area).
  const bottomInset = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? insets.bottom - 4 : 4)
    : insets.bottom;

  const tabContainerHeight = Platform.OS === 'ios'
    ? (insets.bottom > 0 ? 56 + insets.bottom : 60)
    : (64 + insets.bottom);

  const routes = state?.routes || DEFAULT_ROUTES;

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused
      ? (routeName === 'cart' ? Colors.gold : Colors.cultivated)
      : 'rgba(36, 26, 18, 0.45)';
    const strokeWidth = isFocused ? 2.4 : 1.9;
    const iconSize = 24;

    switch (routeName) {
      case 'index':
        return <Home size={iconSize} color={color} strokeWidth={strokeWidth} />;
      case 'agro-yields':
        return <Sprout size={iconSize} color={color} strokeWidth={strokeWidth} />;
      case 'cart':
        return (
          <View style={{ position: 'relative' }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                overflow: 'hidden',
                borderWidth: isFocused ? 2 : 1,
                borderColor: isFocused ? Colors.gold : 'rgba(36, 26, 18, 0.45)',
                backgroundColor: isFocused ? '#FEF6E8' : Colors.parchment,
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
        return <MessageSquare size={iconSize} color={color} strokeWidth={strokeWidth} />;
      case 'profile':
        return <User size={iconSize} color={color} strokeWidth={strokeWidth} />;
      default:
        return <Home size={iconSize} color={color} strokeWidth={strokeWidth} />;
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
              <View
                style={[
                  styles.iconWrapper,
                  isFocused && (route.name === 'cart' ? styles.iconWrapperActiveCart : styles.iconWrapperActiveGround),
                ]}
              >
                {getTabIcon(route.name, isFocused)}
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused
                      ? (route.name === 'cart' ? '#C68F30' : Colors.cultivated)
                      : 'rgba(36, 26, 18, 0.58)',
                    fontFamily: isFocused ? Fonts.bodyBold : Fonts.bodyMedium,
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
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
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Platform.OS === 'ios' ? 2 : 3,
  },
  iconWrapper: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  iconWrapperActiveGround: {
    backgroundColor: '#EEF6ED', // Light ground cultivated green tint
    borderColor: 'rgba(78, 139, 63, 0.22)',
  },
  iconWrapperActiveCart: {
    backgroundColor: '#FEF6E8', // Light harvest gold tint
    borderColor: 'rgba(226, 166, 60, 0.32)',
  },
  tabLabel: {
    fontSize: 13,
    letterSpacing: -0.1,
    includeFontPadding: false,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    right: -7,
    top: -4,
    backgroundColor: Colors.gold,
    borderRadius: 8.5,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.espresso,
    fontSize: 10,
    fontFamily: Fonts.monoBold,
  },
});
