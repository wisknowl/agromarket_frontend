import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { BrandColors } from '@/constants/colors';

export type PreloaderSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface AgromPreloaderProps {
  /** Size preset or exact pixel dimensions (default: 'md') */
  size?: PreloaderSize;
  /** When true, centers in a full-screen overlay */
  fullScreen?: boolean;
  /** Color theme: 'light' (white/parchment) or 'dark' (espresso/canopy background) */
  theme?: 'light' | 'dark';
  /** Preloader variant: 'circles' (TikTok standard) or 'leaf' (Split-Leaf Orbit) */
  variant?: 'circles' | 'leaf';
  /** Cycle duration in ms (default: 1100ms) */
  cycleDurationMs?: number;
  /** Additional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Deprecated/ignored props kept for backwards compatibility */
  label?: string;
  subtitle?: string;
  showBrandText?: boolean;
  showStageTrack?: boolean;
  labelStyle?: StyleProp<TextStyle>;
}

// Dimension configurations for size presets
interface SizeMetrics {
  containerWidth: number;
  containerHeight: number;
  ballSize: number;
  orbitDistance: number;
}

const SIZE_PRESETS: Record<string, SizeMetrics> = {
  sm: {
    containerWidth: 48,
    containerHeight: 24,
    ballSize: 12,
    orbitDistance: 13,
  },
  md: {
    containerWidth: 64,
    containerHeight: 32,
    ballSize: 16,
    orbitDistance: 18,
  },
  lg: {
    containerWidth: 84,
    containerHeight: 42,
    ballSize: 22,
    orbitDistance: 24,
  },
  xl: {
    containerWidth: 108,
    containerHeight: 54,
    ballSize: 28,
    orbitDistance: 32,
  },
};

function getMetrics(size: PreloaderSize): SizeMetrics {
  if (typeof size === 'number') {
    const scale = size / 64;
    return {
      containerWidth: size,
      containerHeight: Math.round(size * 0.5),
      ballSize: Math.round(16 * scale),
      orbitDistance: Math.round(18 * scale),
    };
  }
  return SIZE_PRESETS[size] || SIZE_PRESETS.md;
}

// Brand Colors for the two orbiting halves
const GREEN_COLOR = '#4E8B3F'; // AgroMarket Cultivated Green
const GOLD_COLOR = '#E2A63C';  // AgroMarket Harvest Gold

export default function AgromPreloader({
  size = 'md',
  fullScreen = false,
  theme = 'light',
  variant = 'circles',
  cycleDurationMs = 1100,
  style,
}: AgromPreloaderProps) {
  const metrics = getMetrics(size);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: cycleDurationMs,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    return () => {
      cancelAnimation(progress);
    };
  }, [cycleDurationMs, progress]);

  // 3D Orbital Trajectory for Green Orb (moves Left -> Front/Right -> Right -> Back/Left)
  const animatedGreenStyle = useAnimatedStyle(() => {
    'worklet';
    const angle = progress.value * 2 * Math.PI;
    const x = -Math.cos(angle) * metrics.orbitDistance;
    const z = Math.sin(angle); // Depth: >0 is in front of the viewer, <0 is in back

    const scale = 1.0 + 0.28 * z; // 0.72x at back -> 1.28x at front
    const opacity = 0.75 + 0.25 * Math.max(0, z);
    const zIndex = z >= 0 ? 3 : 1;

    return {
      transform: [{ translateX: x }, { scale }],
      opacity,
      zIndex,
    };
  });

  // 3D Orbital Trajectory for Gold Orb (moves Right -> Back/Left -> Left -> Front/Right)
  const animatedGoldStyle = useAnimatedStyle(() => {
    'worklet';
    const angle = progress.value * 2 * Math.PI;
    const x = Math.cos(angle) * metrics.orbitDistance;
    const z = -Math.sin(angle); // Inverse depth of Green Orb

    const scale = 1.0 + 0.28 * z; // 0.72x at back -> 1.28x at front
    const opacity = 0.75 + 0.25 * Math.max(0, z);
    const zIndex = z >= 0 ? 3 : 1;

    return {
      transform: [{ translateX: x }, { scale }],
      opacity,
      zIndex,
    };
  });

  const isDark = theme === 'dark';
  const bgColor = isDark ? BrandColors.canopyDeep : BrandColors.white;

  const content = (
    <View style={[styles.innerContent, style]}>
      {/* TikTok Horizontal Orbit Stage (pure animation, no text) */}
      <View
        style={[
          styles.orbitStage,
          {
            width: metrics.containerWidth,
            height: metrics.containerHeight,
          },
        ]}
      >
        {/* Green Element (Cultivated Brand Color) */}
        <Animated.View
          style={[
            styles.orbWrapper,
            {
              width: metrics.ballSize,
              height: metrics.ballSize,
            },
            animatedGreenStyle,
          ]}
        >
          {variant === 'leaf' ? (
            <Svg
              width={metrics.ballSize}
              height={metrics.ballSize}
              viewBox="0 0 32 32"
            >
              {/* Left Leaf Half Shape */}
              <Path
                d="M 16 2 C 8 8 2 16 2 26 C 2 30 6 30 16 30 C 16 20 16 10 16 2 Z"
                fill={GREEN_COLOR}
              />
            </Svg>
          ) : (
            <View
              style={[
                styles.circle,
                {
                  width: metrics.ballSize,
                  height: metrics.ballSize,
                  borderRadius: metrics.ballSize / 2,
                  backgroundColor: GREEN_COLOR,
                  shadowColor: GREEN_COLOR,
                },
              ]}
            />
          )}
        </Animated.View>

        {/* Gold Element (Harvest Gold Brand Color) */}
        <Animated.View
          style={[
            styles.orbWrapper,
            {
              width: metrics.ballSize,
              height: metrics.ballSize,
            },
            animatedGoldStyle,
          ]}
        >
          {variant === 'leaf' ? (
            <Svg
              width={metrics.ballSize}
              height={metrics.ballSize}
              viewBox="0 0 32 32"
            >
              {/* Right Leaf Half Shape */}
              <Path
                d="M 16 2 C 24 8 30 16 30 26 C 30 30 26 30 16 30 C 16 20 16 10 16 2 Z"
                fill={GOLD_COLOR}
              />
            </Svg>
          ) : (
            <View
              style={[
                styles.circle,
                {
                  width: metrics.ballSize,
                  height: metrics.ballSize,
                  borderRadius: metrics.ballSize / 2,
                  backgroundColor: GOLD_COLOR,
                  shadowColor: GOLD_COLOR,
                },
              ]}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenOverlay, { backgroundColor: bgColor }]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitStage: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 3.5,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
});
