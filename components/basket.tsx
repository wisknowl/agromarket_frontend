import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cartStore';
import { useRegionalContainerStore } from '@/store/regionalContainerStore';
import { useCartAnimationStore } from '@/store/cartAnimationStore';
import Colors, { Radii, Shadows } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BasketProps {
  onGoToCart?: () => void;
  isAgroFeed?: boolean;
  isInTabs?: boolean;
}

export default function Basket({
  onGoToCart,
  isAgroFeed = false,
  isInTabs = isAgroFeed,
}: BasketProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = getTotal();

  const container = useRegionalContainerStore((s) => s.getContainer());
  const activeFly = useCartAnimationStore((s) => s.activeFly);
  const setBasketCoords = useCartAnimationStore((s) => s.setBasketCoords);
  const basketBounceTimestamp = useCartAnimationStore((s) => s.basketBounceTimestamp);

  // Basket root animations
  const basketScale = useRef(new Animated.Value(isAgroFeed ? 0 : 1)).current;
  const basketOpacity = useRef(new Animated.Value(isAgroFeed ? 0 : 1)).current;
  const basketTranslateY = useRef(new Animated.Value(isAgroFeed ? 60 : 0)).current;
  const badgeScale = useRef(new Animated.Value(1)).current;

  // Periodic Beep / Heartbeat pulse animations
  const beaconScale = useRef(new Animated.Value(1)).current;
  const beaconOpacity = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;

  // Unified physical positioning:
  // TabBar total height is TAB_BAR_HEIGHT (62) + bottomInset
  const bottomInset = insets.bottom;
  const TAB_BAR_HEIGHT = 62;
  const unifiedOnScreenBottom = TAB_BAR_HEIGHT + bottomInset + 14;

  // On tab screens (AgroFeed, AgroMarket), container already sits above the tab bar,
  // so bottom: 14 places it 14px above the tab bar (= unifiedOnScreenBottom from device bottom).
  // On stack screens (FarmDetailScreen, YieldDetailScreen), container goes to screen bottom,
  // so bottom: unifiedOnScreenBottom places it at the exact same physical height on screen.
  const bottomOffset = isInTabs ? 14 : unifiedOnScreenBottom;
  const BASKET_SIZE = 64;
  const BASKET_RIGHT = 18;

  const basketCircleRef = useRef<View>(null);
  const hideTimerRef = useRef<any>(null);

  // Measure basket circle window position and update global store
  const measureAndUpdateCoords = useCallback(() => {
    if (basketCircleRef.current) {
      basketCircleRef.current.measureInWindow((x, y, w, h) => {
        if (x && y && w && h && w > 0 && h > 0) {
          setBasketCoords({
            x: x + w / 2,
            y: y + h / 2,
          });
        }
      });
    }
  }, [setBasketCoords]);

  // Update default coordinates on mount / layout
  useEffect(() => {
    const defaultTargetX = SCREEN_WIDTH - BASKET_RIGHT - BASKET_SIZE / 2;
    const defaultTargetY = SCREEN_HEIGHT - unifiedOnScreenBottom - BASKET_SIZE / 2;
    setBasketCoords({ x: defaultTargetX, y: defaultTargetY });
  }, [unifiedOnScreenBottom, setBasketCoords]);

  // When activeFly starts on AgroFeed, spring the basket into view immediately:
  useEffect(() => {
    if (!activeFly) return;

    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    if (isAgroFeed) {
      Animated.parallel([
        Animated.spring(basketScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(basketOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(basketTranslateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: true,
        }),
      ]).start(() => {
        measureAndUpdateCoords();
      });
    } else {
      measureAndUpdateCoords();
    }
  }, [activeFly, isAgroFeed, measureAndUpdateCoords]);

  // When produce lands (basketBounceTimestamp fires), trigger elastic bounce & badge pop:
  useEffect(() => {
    if (!basketBounceTimestamp) return;

    Animated.sequence([
      Animated.parallel([
        Animated.sequence([
          Animated.timing(basketScale, { toValue: 1.32, duration: 110, useNativeDriver: true }),
          Animated.spring(basketScale, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(badgeScale, { toValue: 1.5, duration: 110, useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        ]),
      ]),
    ]).start();

    // If on AgroFeed, dwell for 1200ms showing the count, then smoothly slide down:
    if (isAgroFeed) {
      hideTimerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(basketOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(basketTranslateY, {
            toValue: 60,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(basketScale, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1200);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [basketBounceTimestamp, isAgroFeed]);

  // Periodic "beeping" heartbeat beacon every 5.5s when basket contains at least 1 item
  useEffect(() => {
    if (isAgroFeed || totalItems === 0) return;

    const interval = setInterval(() => {
      beaconScale.setValue(1);
      beaconOpacity.setValue(0.75);

      Animated.parallel([
        // 1. Radar beacon ripple expanding outward
        Animated.timing(beaconScale, {
          toValue: 1.68,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(beaconOpacity, {
          toValue: 0,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        // 2. Basket container heartbeat double-nudge
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 0.95, duration: 120, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1.08, duration: 140, useNativeDriver: true }),
          Animated.spring(pulseScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
        // 3. Badge attention pop
        Animated.sequence([
          Animated.timing(badgeScale, { toValue: 1.35, duration: 150, useNativeDriver: true }),
          Animated.spring(badgeScale, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        ]),
      ]).start();
    }, 5500);

    return () => clearInterval(interval);
  }, [isAgroFeed, totalItems]);

  const handlePressBasket = () => {
    if (onGoToCart) {
      onGoToCart();
    } else {
      router.push('/cart');
    }
  };

  // For non-AgroFeed pages, hide if cart has 0 items and no active flying event
  if (!isAgroFeed && totalItems === 0 && !activeFly) {
    return null;
  }

  const combinedScale = Animated.multiply(basketScale, pulseScale);

  return (
    <Animated.View
      onLayout={measureAndUpdateCoords}
      style={[
        styles.floatingBasketWrapper,
        {
          bottom: bottomOffset,
          transform: [
            { translateY: basketTranslateY },
            { scale: combinedScale },
          ],
          opacity: basketOpacity,
        },
      ]}
    >
      {/* Periodic Beeping Radar Beacon Ring */}
      {totalItems > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.beaconRing,
            {
              transform: [{ scale: beaconScale }],
              opacity: beaconOpacity,
            },
          ]}
        />
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePressBasket}
        style={styles.basketTouchable}
        accessibilityLabel={`Open ${container.shortName} with ${totalItems} items`}
      >
        <View ref={basketCircleRef} style={styles.basketCircle}>
          <Image
            source={container.image}
            style={styles.containerImage}
            resizeMode="cover"
          />
          {/* Gloss highlight */}
          <View style={styles.glossOverlay} />
        </View>

        {/* Item Count Badge */}
        {totalItems > 0 && (
          <Animated.View
            style={[
              styles.badgeContainer,
              { transform: [{ scale: badgeScale }] },
            ]}
          >
            <Text style={styles.badgeText}>
              {totalItems > 99 ? '99+' : totalItems}
            </Text>
          </Animated.View>
        )}

        {/* Running Subtotal Mini-Pill (Non-AgroFeed or when settled) */}
        {!isAgroFeed && totalAmount > 0 && (
          <View style={styles.pricePill}>
            <Text style={styles.pricePillText} numberOfLines={1}>
              {totalAmount > 99999
                ? `${Math.round(totalAmount / 1000)}k`
                : totalAmount.toLocaleString()}{' '}
              F
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingBasketWrapper: {
    position: 'absolute',
    right: 18,
    zIndex: 999,
    alignItems: 'center',
  },
  basketTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.parchment,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
  },
  containerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  glossOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 32,
  },
  badgeContainer: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.cultivated,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.subtle,
    elevation: 4,
  },
  badgeText: {
    color: Colors.white,
    fontFamily: Fonts.monoBold,
    fontSize: 10.5,
    textAlign: 'center',
  },
  pricePill: {
    backgroundColor: Colors.canopy,
    borderRadius: Radii.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: -7,
    borderWidth: 1,
    borderColor: Colors.gold,
    ...Shadows.subtle,
    elevation: 4,
  },
  pricePillText: {
    color: Colors.gold,
    fontFamily: Fonts.monoBold,
    fontSize: 10,
    letterSpacing: 0.2,
  },
  beaconRing: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
    zIndex: -1,
  },
});
