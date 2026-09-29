import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, {
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
} from 'react-native-svg';
import { BrandColors } from '@/constants/colors';
import { Fonts } from '@/constants/typography';

export type PreloaderSize = 'sm' | 'md' | 'lg' | 'xl' | number;

export interface AgromPreloaderProps {
  /** Size preset or exact pixel dimensions (default: 'md' = 92px) */
  size?: PreloaderSize;
  /** When true, centers in a full-screen overlay */
  fullScreen?: boolean;
  /** Optional message displayed below the preloader */
  label?: string;
  /** Optional subtitle or secondary status */
  subtitle?: string;
  /** Color theme: 'light' (white/cream background) or 'dark' (espresso background) */
  theme?: 'light' | 'dark';
  /** Show the Agrom brand text mark under the spinner */
  showBrandText?: boolean;
  /** Show the 40-stage growth timeline track (default: true) */
  showStageTrack?: boolean;
  /** Total lifecycle duration in ms (default: 3500ms = 3.5s) */
  cycleDurationMs?: number;
  /** Additional custom container style */
  style?: StyleProp<ViewStyle>;
  /** Custom label text style */
  labelStyle?: StyleProp<TextStyle>;
}

const SIZE_MAP: Record<string, number> = {
  sm: 64,
  md: 92,
  lg: 120,
  xl: 148,
};

/**
 * 40 Botanical Growth & Ripening Stages:
 * Milestone 0  (Steps 0-9):   Germination & Seedling Ascent (0.16x -> 0.86x, pale lime to shoot green)
 * Milestone 10 (Steps 10-19): Vegetative Canopy Expansion (0.96x -> 1.15x, Cultivated Green #4E8B3F)
 * Milestone 20 (Steps 20-29): Solar Ripening & Harvest (1.15x -> 0.95x, Harvest Gold #E2A63C)
 * Milestone 30 (Steps 30-39): Autumn Senescence & Humus Soil Return (0.93x -> 0.65x, Copper & Earth)
 */
interface BotanicalStageDef {
  step: number;
  scale: number;
  translateY: number;
  tilt: number;
  colorLight: string;
  colorDark: string;
  veinColor: string;
  isSprout?: boolean;
  isCurled?: boolean;
}

const STAGES_40: BotanicalStageDef[] = [
  // ── QUADRANT 1: GERMINATION & SEEDLING (Steps 0 - 9) ──
  { step: 0, scale: 0.16, translateY: 18, tilt: 0, colorLight: '#ECFCCB', colorDark: '#D9F99D', veinColor: '#ECFCCB', isSprout: true },
  { step: 1, scale: 0.22, translateY: 16, tilt: 0, colorLight: '#D9F99D', colorDark: '#BEF264', veinColor: '#ECFCCB', isSprout: true },
  { step: 2, scale: 0.28, translateY: 14, tilt: 0, colorLight: '#BEF264', colorDark: '#A3E635', veinColor: '#D9F99D', isSprout: true },
  { step: 3, scale: 0.35, translateY: 12, tilt: 0, colorLight: '#A3E635', colorDark: '#84CC16', veinColor: '#BEF264', isSprout: true },
  { step: 4, scale: 0.43, translateY: 10, tilt: 0, colorLight: '#84CC16', colorDark: '#65A30D', veinColor: '#BEF264' },
  { step: 5, scale: 0.51, translateY: 8, tilt: 0, colorLight: '#65A30D', colorDark: '#4ADE80', veinColor: '#BBF7D0' },
  { step: 6, scale: 0.60, translateY: 6, tilt: 0, colorLight: '#4ADE80', colorDark: '#22C55E', veinColor: '#86EFAC' },
  { step: 7, scale: 0.69, translateY: 4, tilt: 0, colorLight: '#22C55E', colorDark: '#16A34A', veinColor: '#86EFAC' },
  { step: 8, scale: 0.78, translateY: 2, tilt: 0, colorLight: '#16A34A', colorDark: '#15803D', veinColor: '#86EFAC' },
  { step: 9, scale: 0.87, translateY: 1, tilt: 0, colorLight: '#15803D', colorDark: '#38A134', veinColor: '#A7F3D0' },

  // ── QUADRANT 2: CANOPY GROWTH & CULTIVATED GREEN (Steps 10 - 19) ──
  { step: 10, scale: 0.96, translateY: 0, tilt: 0, colorLight: '#38A134', colorDark: '#4E8B3F', veinColor: '#A7F3D0' },
  { step: 11, scale: 1.05, translateY: 0, tilt: 0, colorLight: '#4E8B3F', colorDark: '#2D6A27', veinColor: '#C6F6D5' },
  { step: 12, scale: 1.12, translateY: 0, tilt: 0, colorLight: '#4E8B3F', colorDark: '#1E4620', veinColor: '#C6F6D5' },
  { step: 13, scale: 1.15, translateY: 0, tilt: 0, colorLight: '#4E8B3F', colorDark: '#2D6A27', veinColor: '#C6F6D5' }, // PEAK SIZE
  { step: 14, scale: 1.14, translateY: 0, tilt: 0, colorLight: '#4E8B3F', colorDark: '#458537', veinColor: '#C6F6D5' },
  { step: 15, scale: 1.12, translateY: 0, tilt: 0, colorLight: '#5E9942', colorDark: '#72AA45', veinColor: '#D9F99D' },
  { step: 16, scale: 1.10, translateY: 0, tilt: 0, colorLight: '#72AA45', colorDark: '#88BA47', veinColor: '#FEF08A' },
  { step: 17, scale: 1.08, translateY: 0, tilt: 0, colorLight: '#88BA47', colorDark: '#A0C948', veinColor: '#FEF08A' },
  { step: 18, scale: 1.06, translateY: 0, tilt: 0, colorLight: '#A0C948', colorDark: '#B8D548', veinColor: '#FEF08A' },
  { step: 19, scale: 1.04, translateY: 0, tilt: 0, colorLight: '#B8D548', colorDark: '#CA8A04', veinColor: '#FEF08A' },

  // ── QUADRANT 3: SOLAR RIPENING & HARVEST GOLD (Steps 20 - 29) ──
  { step: 20, scale: 1.02, translateY: 0, tilt: 0, colorLight: '#CA8A04', colorDark: '#EAB308', veinColor: '#FEF9C3' },
  { step: 21, scale: 1.02, translateY: 0, tilt: 0, colorLight: '#EAB308', colorDark: '#FACC15', veinColor: '#FEF9C3' },
  { step: 22, scale: 1.04, translateY: 0, tilt: 0, colorLight: '#FACC15', colorDark: '#F59E0B', veinColor: '#FEF9C3' },
  { step: 23, scale: 1.06, translateY: 0, tilt: 0, colorLight: '#F59E0B', colorDark: BrandColors.gold, veinColor: '#FFFBEB' }, // HARVEST GOLD
  { step: 24, scale: 1.05, translateY: 0, tilt: 0, colorLight: BrandColors.gold, colorDark: '#D97706', veinColor: '#FFFBEB' },
  { step: 25, scale: 1.03, translateY: 0, tilt: 0, colorLight: BrandColors.gold, colorDark: '#DF9E33', veinColor: '#FFFBEB' },
  { step: 26, scale: 1.01, translateY: 0, tilt: 1, colorLight: '#DF9E33', colorDark: '#DD952A', veinColor: '#FED7AA' },
  { step: 27, scale: 0.99, translateY: 1, tilt: 2, colorLight: '#DD952A', colorDark: '#DB8C21', veinColor: '#FED7AA' },
  { step: 28, scale: 0.97, translateY: 2, tilt: 3, colorLight: '#DB8C21', colorDark: '#D97706', veinColor: '#FED7AA' },
  { step: 29, scale: 0.95, translateY: 3, tilt: 4, colorLight: '#D97706', colorDark: '#EA580C', veinColor: '#FED7AA' },

  // ── QUADRANT 4: AUTUMN SENESCENCE & HUMUS EARTH (Steps 30 - 39) ──
  { step: 30, scale: 0.93, translateY: 4, tilt: 5, colorLight: '#EA580C', colorDark: '#C2410C', veinColor: '#FDE68A', isCurled: true },
  { step: 31, scale: 0.90, translateY: 5, tilt: 6, colorLight: '#C2410C', colorDark: '#B45309', veinColor: '#FDE68A', isCurled: true },
  { step: 32, scale: 0.87, translateY: 6, tilt: 7, colorLight: '#B45309', colorDark: '#9A3412', veinColor: '#FDBA74', isCurled: true },
  { step: 33, scale: 0.84, translateY: 7, tilt: 8, colorLight: '#9A3412', colorDark: '#92400E', veinColor: '#FDBA74', isCurled: true },
  { step: 34, scale: 0.81, translateY: 8, tilt: 9, colorLight: '#92400E', colorDark: '#854D0E', veinColor: '#FDBA74', isCurled: true },
  { step: 35, scale: 0.78, translateY: 9, tilt: 10, colorLight: '#854D0E', colorDark: '#78350F', veinColor: '#9A3412', isCurled: true },
  { step: 36, scale: 0.75, translateY: 11, tilt: 9, colorLight: '#78350F', colorDark: '#692D0D', veinColor: '#9A3412', isCurled: true },
  { step: 37, scale: 0.72, translateY: 13, tilt: 8, colorLight: '#692D0D', colorDark: '#57250A', veinColor: '#9A3412', isCurled: true },
  { step: 38, scale: 0.68, translateY: 15, tilt: 6, colorLight: '#57250A', colorDark: '#421B07', veinColor: '#57250A', isCurled: true },
  { step: 39, scale: 0.62, translateY: 17, tilt: 3, colorLight: '#421B07', colorDark: '#2E1C14', veinColor: '#421B07', isCurled: true },
];

export default function AgromPreloader({
  size = 'md',
  fullScreen = false,
  label,
  subtitle,
  theme = 'light',
  showBrandText = false,
  showStageTrack = true,
  cycleDurationMs = 3500,
  style,
  labelStyle,
}: AgromPreloaderProps) {
  const numericSize = typeof size === 'number' ? size : SIZE_MAP[size] || 92;

  // Single continuous timeline looping 0 -> 1 over cycleDurationMs (3.5 seconds)
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
  }, [cycleDurationMs]);

  // Animated Transform (Scale, TranslateY, and Tilt based on exact 40-stage progression)
  const animatedLeafTransformStyle = useAnimatedStyle(() => {
    const p = progress.value; // 0.0 -> 1.0
    const rawStep = p * 39;
    const baseIdx = Math.min(38, Math.floor(rawStep));
    const nextIdx = baseIdx + 1;
    const frac = rawStep - baseIdx;

    const cur = STAGES_40[baseIdx];
    const nxt = STAGES_40[nextIdx];

    const currentScale = cur.scale + (nxt.scale - cur.scale) * frac;
    const currentTranslateY = cur.translateY + (nxt.translateY - cur.translateY) * frac;
    const currentTilt = cur.tilt + (nxt.tilt - cur.tilt) * frac;

    return {
      transform: [
        { translateY: currentTranslateY },
        { scale: currentScale },
        { rotate: `${currentTilt}deg` },
      ],
    };
  });

  // Animated Track Progress Fill (0% -> 100% over the 40 steps)
  const animatedTrackFillStyle = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      width: `${Math.min(100, Math.max(2, p * 100))}%`,
      backgroundColor:
        p < 0.25
          ? '#A3E635'
          : p < 0.50
          ? BrandColors.cultivated
          : p < 0.75
          ? BrandColors.gold
          : '#B45309',
    };
  });

  // 4 Cross-Fading Botanical Layers (Sprout -> True Leaf -> Harvest Gold -> Autumn Humus)
  const sproutLayerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    let opacity = 0;
    if (p < 0.18) {
      opacity = p < 0.12 ? 1 : 1 - (p - 0.12) / 0.06;
    }
    return { opacity };
  });

  const greenLayerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    let opacity = 0;
    if (p >= 0.12 && p < 0.54) {
      if (p < 0.18) opacity = (p - 0.12) / 0.06;
      else if (p < 0.46) opacity = 1;
      else opacity = 1 - (p - 0.46) / 0.08;
    }
    return { opacity };
  });

  const goldLayerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    let opacity = 0;
    if (p >= 0.46 && p < 0.78) {
      if (p < 0.54) opacity = (p - 0.46) / 0.08;
      else if (p < 0.72) opacity = 1;
      else opacity = 1 - (p - 0.72) / 0.06;
    }
    return { opacity };
  });

  const earthLayerStyle = useAnimatedStyle(() => {
    const p = progress.value;
    let opacity = 0;
    if (p >= 0.72) {
      if (p < 0.78) opacity = (p - 0.72) / 0.06;
      else if (p < 0.94) opacity = 1;
      else opacity = 1 - (p - 0.94) / 0.06;
    }
    return { opacity };
  });

  const isDark = theme === 'dark';
  const textColor = isDark ? BrandColors.parchment : BrandColors.espresso;
  const subtextColor = isDark ? '#A8C3A0' : BrandColors.soil;
  const bgColor = isDark ? BrandColors.espresso : BrandColors.white;

  const content = (
    <View style={[styles.innerContent, style]}>
      {/* 40-Stage Botanical Growth Theater */}
      <View
        style={{
          width: numericSize,
          height: numericSize,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Organic Crumbly Soil Bed (Fixed Ground Level at bottom) */}
        <Svg
          width={numericSize}
          height={numericSize}
          viewBox="0 0 100 100"
          style={styles.stageLayer}
        >
          <Defs>
            <LinearGradient id="soilBedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <Stop offset="0%" stopColor="#2E1C14" stopOpacity="0" />
              <Stop offset="20%" stopColor="#2E1C14" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#3E2723" stopOpacity="0.75" />
              <Stop offset="80%" stopColor="#2E1C14" stopOpacity="0.45" />
              <Stop offset="100%" stopColor="#2E1C14" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          {/* Soil Mound */}
          <Path
            d="M 18 84 C 32 80 68 80 82 84 C 72 87 28 87 18 84 Z"
            fill="url(#soilBedGrad)"
          />
        </Svg>

        {/* The Morphing Leaf Body (Physical 40-Stage Growth Transform) */}
        <Animated.View style={[styles.stageLayer, animatedLeafTransformStyle]}>
          {/* 1. SPROUT COTYLEDONS LAYER (Steps 0 - 6) */}
          <Animated.View style={[styles.stageLayer, sproutLayerStyle]}>
            <Svg width={numericSize} height={numericSize} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="sproutGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#D9F99D" />
                  <Stop offset="100%" stopColor="#84CC16" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 50 82 L 50 56"
                stroke="#65A30D"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <Path
                d="M 50 56 C 35 52 30 36 42 34 C 48 36 50 48 50 56 Z"
                fill="url(#sproutGrad)"
              />
              <Path
                d="M 50 56 C 65 52 70 36 58 34 C 52 36 50 48 50 56 Z"
                fill="url(#sproutGrad)"
              />
              <Path
                d="M 44 40 C 42 41 40 43 42 45"
                stroke="#FFFFFF"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.85"
              />
            </Svg>
          </Animated.View>

          {/* 2. CULTIVATED GREEN CANOPY LAYER (Steps 7 - 19) */}
          <Animated.View style={[styles.stageLayer, greenLayerStyle]}>
            <Svg width={numericSize} height={numericSize} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="greenLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#4ADE80" />
                  <Stop offset="100%" stopColor={BrandColors.cultivated} />
                </LinearGradient>
                <LinearGradient id="greenRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={BrandColors.cultivated} />
                  <Stop offset="100%" stopColor="#1E4620" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 50 82 L 50 72"
                stroke="#1E4620"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Path
                d="M 50 72 C 30 63 26 34 50 16 C 50 38 50 58 50 72 Z"
                fill="url(#greenLeftGrad)"
              />
              <Path
                d="M 50 72 C 70 63 74 34 50 16 C 50 38 50 58 50 72 Z"
                fill="url(#greenRightGrad)"
              />
              <Path
                d="M 50 72 L 50 18"
                stroke="#A7F3D0"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <Path
                d="M 50 56 Q 42 50 36 46 M 50 56 Q 58 50 64 46 M 50 44 Q 44 40 40 34 M 50 44 Q 56 40 60 34 M 50 32 Q 46 28 44 24 M 50 32 Q 54 28 56 24"
                stroke="#C6F6D5"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.65"
              />
            </Svg>
          </Animated.View>

          {/* 3. PEAK HARVEST GOLD LAYER (Steps 20 - 29) */}
          <Animated.View style={[styles.stageLayer, goldLayerStyle]}>
            <Svg width={numericSize} height={numericSize} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient id="harvestHalo" cx="50%" cy="45%" r="48%">
                  <Stop offset="0%" stopColor="#FEF08A" stopOpacity="0.45" />
                  <Stop offset="100%" stopColor={BrandColors.gold} stopOpacity="0" />
                </RadialGradient>
                <LinearGradient id="goldLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#FDE047" />
                  <Stop offset="100%" stopColor={BrandColors.gold} />
                </LinearGradient>
                <LinearGradient id="goldRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={BrandColors.gold} />
                  <Stop offset="100%" stopColor="#D97706" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 50 10 C 25 10 20 50 20 50 C 20 75 40 85 50 85 C 60 85 80 75 80 50 C 80 50 75 10 50 10 Z"
                fill="url(#harvestHalo)"
              />
              <Path
                d="M 50 82 L 50 72"
                stroke="#92400E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <Path
                d="M 50 72 C 30 63 26 34 50 16 C 50 38 50 58 50 72 Z"
                fill="url(#goldLeftGrad)"
              />
              <Path
                d="M 50 72 C 70 63 74 34 50 16 C 50 38 50 58 50 72 Z"
                fill="url(#goldRightGrad)"
              />
              <Path
                d="M 50 72 L 50 18"
                stroke="#FEF9C3"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.9"
              />
              <Path
                d="M 50 56 Q 42 50 36 46 M 50 56 Q 58 50 64 46 M 50 44 Q 44 40 40 34 M 50 44 Q 56 40 60 34 M 50 32 Q 46 28 44 24 M 50 32 Q 54 28 56 24"
                stroke="#FFFBEB"
                strokeWidth="1.1"
                strokeLinecap="round"
                opacity="0.75"
              />
            </Svg>
          </Animated.View>

          {/* 4. AUTUMN SENESCENCE & HUMUS EARTH LAYER (Steps 30 - 39) */}
          <Animated.View style={[styles.stageLayer, earthLayerStyle]}>
            <Svg width={numericSize} height={numericSize} viewBox="0 0 100 100">
              <Defs>
                <LinearGradient id="earthLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#D97706" />
                  <Stop offset="100%" stopColor="#92400E" />
                </LinearGradient>
                <LinearGradient id="earthRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#B45309" />
                  <Stop offset="100%" stopColor="#451A03" />
                </LinearGradient>
              </Defs>
              <Path
                d="M 50 82 L 50 72"
                stroke="#451A03"
                strokeWidth="2.0"
                strokeLinecap="round"
              />
              <Path
                d="M 50 72 C 34 65 30 38 50 18 C 50 38 50 58 50 72 Z"
                fill="url(#earthLeftGrad)"
              />
              <Path
                d="M 50 72 C 68 65 72 38 50 18 C 50 38 50 58 50 72 Z"
                fill="url(#earthRightGrad)"
              />
              <Path
                d="M 50 72 L 50 20"
                stroke="#FED7AA"
                strokeWidth="1.3"
                strokeLinecap="round"
                opacity="0.7"
              />
              <Path
                d="M 50 56 Q 44 51 38 48 M 50 56 Q 57 51 62 48 M 50 44 Q 45 41 41 36 M 50 44 Q 55 41 59 36"
                stroke="#FDE68A"
                strokeWidth="0.9"
                strokeLinecap="round"
                opacity="0.5"
              />
            </Svg>
          </Animated.View>
        </Animated.View>
      </View>

      {/* 40-Stage Growth Timeline Track */}
      {showStageTrack && (
        <View style={styles.trackContainer}>
          <View style={styles.trackBackground}>
            <Animated.View style={[styles.trackFill, animatedTrackFillStyle]} />
          </View>
          {/* 4 Milestone Markers (0: Sprout, 13: Canopy, 26: Gold, 39: Soil) */}
          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneDot, { backgroundColor: '#A3E635' }]} />
            <View style={[styles.milestoneDot, { backgroundColor: BrandColors.cultivated }]} />
            <View style={[styles.milestoneDot, { backgroundColor: BrandColors.gold }]} />
            <View style={[styles.milestoneDot, { backgroundColor: '#8D6E63' }]} />
          </View>
        </View>
      )}

      {/* Brand Wordmark (Optional) */}
      {showBrandText && (
        <Text style={[styles.brandText, { color: textColor }]}>
          Agrom<Text style={{ color: BrandColors.gold }}>.</Text>
        </Text>
      )}

      {/* Primary Status Label */}
      {Boolean(label) && (
        <Text
          style={[
            styles.label,
            { color: textColor },
            labelStyle,
            showBrandText && { marginTop: 4 },
          ]}
        >
          {label}
        </Text>
      )}

      {/* Secondary Status Subtitle */}
      {Boolean(subtitle) && (
        <Text style={[styles.subtitle, { color: subtextColor }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return (
      <View style={[styles.fullScreenBackdrop, { backgroundColor: bgColor }, style]}>
        {content}
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  fullScreenBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  stageLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackContainer: {
    width: 110,
    marginTop: 12,
    alignItems: 'center',
  },
  trackBackground: {
    width: '100%',
    height: 3.5,
    backgroundColor: 'rgba(120, 120, 120, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    borderRadius: 2,
  },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 3,
    paddingHorizontal: 1,
  },
  milestoneDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    opacity: 0.6,
  },
  brandText: {
    fontFamily: Fonts.displayBold,
    fontSize: 18,
    letterSpacing: 0.3,
    marginTop: 10,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    letterSpacing: 0.2,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    marginTop: 3,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
});
