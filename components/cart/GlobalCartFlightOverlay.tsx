import React from 'react';

/**
 * GlobalCartFlightOverlay
 *
 * NOTE: The parabolic flying produce animation has been disabled/commented out
 * to ensure silky smooth 60 FPS UI responsiveness when adding items to the basket.
 * The cultural basket icon now reacts instantly with a direct haptic-like badge bounce.
 */
export default function GlobalCartFlightOverlay() {
  return null;
}

/*
// --- ARCHIVED FLIGHT ANIMATION LOGIC (Preserved for Reference) ---
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
  Platform,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCartAnimationStore, FlyEvent } from '@/store/cartAnimationStore';
import Colors, { Shadows } from '@/constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ArchivedGlobalCartFlightOverlay() {
  const insets = useSafeAreaInsets();
  const activeFly = useCartAnimationStore((s) => s.activeFly);
  const clearFly = useCartAnimationStore((s) => s.clearFly);
  const basketCoords = useCartAnimationStore((s) => s.basketCoords);
  const triggerBasketBounce = useCartAnimationStore((s) => s.triggerBasketBounce);

  const [currentFlyingItem, setCurrentFlyingItem] = useState<FlyEvent | null>(null);
  const flightProgress = useRef(new Animated.Value(0)).current;

  const bottomInset = insets.bottom;
  const TAB_BAR_HEIGHT = 62;
  const unifiedOnScreenBottom = TAB_BAR_HEIGHT + bottomInset + 14;
  const BASKET_SIZE = 64;
  const BASKET_RIGHT = 18;

  const defaultTargetX = SCREEN_WIDTH - BASKET_RIGHT - BASKET_SIZE / 2;
  const defaultTargetY = SCREEN_HEIGHT - unifiedOnScreenBottom - BASKET_SIZE / 2;

  const [flightCoords, setFlightCoords] = useState<{
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
  }>({
    startX: SCREEN_WIDTH / 2,
    startY: SCREEN_HEIGHT / 2,
    targetX: defaultTargetX,
    targetY: defaultTargetY,
  });

  useEffect(() => {
    if (!activeFly) return;

    const startX = activeFly.startX || SCREEN_WIDTH / 2;
    const startY = activeFly.startY || SCREEN_HEIGHT / 2;
    const targetX = basketCoords?.x || defaultTargetX;
    const targetY = basketCoords?.y || defaultTargetY;

    setCurrentFlyingItem(activeFly);
    setFlightCoords({ startX, startY, targetX, targetY });
    flightProgress.setValue(0);

    Animated.timing(flightProgress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      triggerBasketBounce();
      clearFly();
      setCurrentFlyingItem(null);
    });
  }, [activeFly]);

  if (!currentFlyingItem) {
    return null;
  }

  const deltaX = flightCoords.targetX - flightCoords.startX;
  const deltaY = flightCoords.targetY - flightCoords.startY;
  const arcApexOffset = -250;
  const riseDistance = -45;

  const flyTranslateX = flightProgress.interpolate({
    inputRange: [0.00, 0.20, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.92, 0.97, 1.00],
    outputRange: [
      flightCoords.startX,
      flightCoords.startX,
      flightCoords.startX,
      flightCoords.startX + deltaX * 0.15,
      flightCoords.startX + deltaX * 0.35,
      flightCoords.startX + deltaX * 0.55,
      flightCoords.startX + deltaX * 0.75,
      flightCoords.startX + deltaX * 0.90,
      flightCoords.startX + deltaX * 0.96,
      flightCoords.startX + deltaX * 0.99,
      flightCoords.targetX,
    ],
  });

  const flyTranslateY = flightProgress.interpolate({
    inputRange: [0.00, 0.20, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.92, 0.97, 1.00],
    outputRange: [
      flightCoords.startY,
      flightCoords.startY + riseDistance,
      flightCoords.startY + riseDistance,
      flightCoords.startY + deltaY * 0.15 + arcApexOffset * 0.65,
      flightCoords.startY + deltaY * 0.35 + arcApexOffset * 0.95,
      flightCoords.startY + deltaY * 0.55 + arcApexOffset * 1.00,
      flightCoords.startY + deltaY * 0.75 + arcApexOffset * 0.75,
      flightCoords.startY + deltaY * 0.90 + arcApexOffset * 0.35,
      flightCoords.startY + deltaY * 0.96 + arcApexOffset * 0.12,
      flightCoords.startY + deltaY * 0.99 + arcApexOffset * 0.03,
      flightCoords.targetY,
    ],
  });

  const flyScale = flightProgress.interpolate({
    inputRange: [0.00, 0.15, 0.35, 0.70, 0.92, 1.00],
    outputRange: [0.35, 1.30, 1.25, 0.95, 0.65, 0.15],
  });

  const flyOpacity = flightProgress.interpolate({
    inputRange: [0.00, 0.08, 0.85, 0.96, 1.00],
    outputRange: [0.0, 1.0, 1.0, 0.6, 0.0],
  });

  const flyRotate = flightProgress.interpolate({
    inputRange: [0.00, 0.35, 0.70, 1.00],
    outputRange: ['0deg', '45deg', '180deg', '360deg'],
  });

  return (
    <View pointerEvents="none" style={styles.overlayContainer}>
      <Animated.View
        style={[
          styles.flyingItemContainer,
          {
            transform: [
              { translateX: flyTranslateX },
              { translateY: flyTranslateY },
              { scale: flyScale },
              { rotate: flyRotate },
            ],
            opacity: flyOpacity,
          },
        ]}
      >
        {currentFlyingItem.imageUri ? (
          <Image
            source={{ uri: currentFlyingItem.imageUri }}
            style={styles.flyingImage}
          />
        ) : (
          <View style={styles.flyingPlaceholder}>
            <Text style={styles.flyingEmoji}>🌱</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
    elevation: 99999,
  },
  flyingItemContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.white,
    borderWidth: 2.5,
    borderColor: Colors.gold,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  flyingImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  flyingPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.parchment,
  },
  flyingEmoji: {
    fontSize: 24,
  },
});
*/
