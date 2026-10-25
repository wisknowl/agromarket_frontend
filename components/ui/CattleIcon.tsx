import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

export interface CattleIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  [key: string]: any;
}

/**
 * Livestock & Cattle Icon (Living farm cattle with majestic horns and muzzle).
 * Replaces butchered sliced meat icons to authentically represent livestock & pastoral agriculture.
 */
export default function CattleIcon({
  size = 24,
  color = 'currentColor',
  strokeWidth = 2,
  ...props
}: CattleIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Upward curved horns */}
      <Path d="M4 4C4.5 7.5 7 9 9 9.5" />
      <Path d="M20 4C19.5 7.5 17 9 15 9.5" />
      {/* Ears */}
      <Path d="M7 10L3 11" />
      <Path d="M17 10L21 11" />
      {/* Head contour */}
      <Path d="M8 8H16L17.5 13C17.5 16 15 18 12 18C9 18 6.5 16 6.5 13L8 8Z" />
      {/* Muzzle & Snout */}
      <Path d="M9 16C9 19.5 10.3 21 12 21C13.7 21 15 19.5 15 16" />
      {/* Nostrils */}
      <Circle cx="10.8" cy="18.5" r="0.75" fill={color} />
      <Circle cx="13.2" cy="18.5" r="0.75" fill={color} />
      {/* Eyes */}
      <Circle cx="9.5" cy="12" r="0.75" fill={color} />
      <Circle cx="14.5" cy="12" r="0.75" fill={color} />
    </Svg>
  );
}
