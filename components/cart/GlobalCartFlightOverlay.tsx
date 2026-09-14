import React, { useState, useRef, useEffect } from 'react';
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

export default function GlobalCartFlightOverlay() {
  const insets = useSafeAreaInsets();
  const activeFly = useCartAnimationStore((s) => s.activeFly);
  const clearFly = useCartAnimationStore((s) => s.clearFly);
  const basketCoords = useCartAnimationStore((s) => s.basketCoords);
  const triggerBasketBounce = useCartAnimationStore((s) => s.triggerBasketBounce);

  const [currentFlyingItem, setCurrentFlyingItem] = useState<FlyEvent | null>(null);
  const flightProgress = useRef(new Animated.Value(0)).current;

  // Unified basket center coordinates on screen
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

    // Launch cinematic 3-phase flight over 3000ms:
    // Phase 1 (0.00-0.20): Emerges & rises 45px directly up out of the tapped button center
    // Phase 2 (0.20-0.35): Buoyant hover at button height (user clearly registers produce)
    // Phase 3 (0.35-1.00): Grand parabolic rainbow arc diving dead-center into the basket
    Animated.timing(flightProgress, {
      toValue: 1,
      duration: 3000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      // Arrived exactly dead-center in basket
      triggerBasketBounce();
      clearFly();
      setCurrentFlyingItem(null);
    });
  }, [activeFly]);

  if (!currentFlyingItem) {
    return null;
  }

  // Trajectory Deltas
  const deltaX = flightCoords.targetX - flightCoords.startX;
  const deltaY = flightCoords.targetY - flightCoords.startY;

  // Loftier, dramatic arc apex (-250px above trajectory)
  const arcApexOffset = -250;
  const riseDistance = -45; // Produce emerges 45px up out of button center

  // Horizontal X translation in window coordinates:
  // 0.00 -> 0.20: Emerges vertically out of button (X holds still at button center)
  // 0.20 -> 0.35: Buoyantly hovers at elevated height (X holds still)
  // 0.35 -> 1.00: Arcs smoothly across screen to targetX
  const flyTranslateX = flightProgress.interpolate({
    inputRange: [
      0.00, 0.20, 0.35, 0.45, 0.55,
      0.65, 0.75, 0.85, 0.92, 0.97, 1.00,
    ],
    outputRange: [
      flightCoords.startX - 27,
      flightCoords.startX - 27,
      flightCoords.startX - 27,
      flightCoords.startX - 27 + deltaX * 0.14,
      flightCoords.startX - 27 + deltaX * 0.33,
      flightCoords.startX - 27 + deltaX * 0.55,
      flightCoords.startX - 27 + deltaX * 0.74,
      flightCoords.startX - 27 + deltaX * 0.88,
      flightCoords.startX - 27 + deltaX * 0.95,
      flightCoords.startX - 27 + deltaX * 0.99,
      flightCoords.targetX - 27,
    ],
  });

  // Vertical Y translation in window coordinates:
  // 0.00 -> 0.20: Rises 45px straight up from button
  // 0.20 -> 0.35: Hovers in place
  // 0.35 -> 0.60: Rises through lofty arc apex (arcApexOffset = -250px)
  // 0.60 -> 1.00: Dives directly into basket center
  const apexY = Math.min(flightCoords.startY, flightCoords.targetY) + arcApexOffset;

  const flyTranslateY = flightProgress.interpolate({
    inputRange: [
      0.00, 0.10, 0.20, 0.28, 0.35,
      0.48, 0.60, 0.72, 0.82, 0.90, 0.96, 1.00,
    ],
    outputRange: [
      flightCoords.startY - 27,
      flightCoords.startY - 27 - 25,
      flightCoords.startY - 27 + riseDistance,
      flightCoords.startY - 27 + riseDistance,
      flightCoords.startY - 27 + riseDistance,
      apexY - 27 + Math.abs(arcApexOffset) * 0.25,
      apexY - 27,
      apexY - 27 + (flightCoords.targetY - apexY) * 0.30,
      flightCoords.targetY - 27 - 54,
      flightCoords.targetY - 27 - 20,
      flightCoords.targetY - 27 - 5,
      flightCoords.targetY - 27,
    ],
  });

  // Dense, continuous 16-point sub-pixel scale interpolation (grows out of button, glides, then shrinks into basket center):
  const flyScale = flightProgress.interpolate({
    inputRange: [
      0.00, 0.05, 0.10, 0.15, 0.20,
      0.25, 0.35, 0.45, 0.55, 0.65,
      0.75, 0.82, 0.88, 0.93, 0.97, 1.00,
    ],
    outputRange: [
      0.35, 0.65, 0.95, 1.20, 1.35,
      1.35, 1.35, 1.28, 1.15, 0.98,
      0.75, 0.55, 0.38, 0.22, 0.12, 0.08,
    ],
  });

  // Smooth rotation tumble:
  const flyRotate = flightProgress.interpolate({
    inputRange: [0, 0.2, 0.35, 1],
    outputRange: ['0deg', '10deg', '10deg', '360deg'],
  });

  // Opacity: fades in cleanly on button, stays completely visible across arc, fades out right inside basket center:
  const flyOpacity = flightProgress.interpolate({
    inputRange: [0, 0.08, 0.96, 1],
    outputRange: [0.3, 1, 1, 0],
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
