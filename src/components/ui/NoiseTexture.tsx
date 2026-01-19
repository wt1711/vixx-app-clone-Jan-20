import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import Svg, { Defs, Pattern, Line, Rect } from 'react-native-svg';
import { colors } from 'src/theme';

type CarbonFiberTextureProps = {
  opacity?: number;
  scale?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Carbon fiber weave pattern overlay using SVG.
 * Creates a diagonal crosshatch pattern similar to carbon fiber material.
 */
export function CarbonFiberTexture({
  opacity = 0.08,
  scale = 1,
  style,
}: CarbonFiberTextureProps) {
  const cellSize = 8 * scale;
  const strokeWidth = 1.5 * scale;

  return (
    <View style={[StyleSheet.absoluteFill, style]} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <Pattern
            id="carbonWeave"
            x="0"
            y="0"
            width={cellSize * 2}
            height={cellSize * 2}
            patternUnits="userSpaceOnUse"
          >
            {/* Diagonal lines going one direction */}
            <Line
              x1="0"
              y1="0"
              x2={cellSize}
              y2={cellSize}
              stroke={colors.transparent.white12}
              strokeWidth={strokeWidth}
            />
            <Line
              x1={cellSize}
              y1={cellSize}
              x2={cellSize * 2}
              y2={cellSize * 2}
              stroke={colors.transparent.white08}
              strokeWidth={strokeWidth}
            />
            {/* Diagonal lines going other direction */}
            <Line
              x1={cellSize}
              y1="0"
              x2="0"
              y2={cellSize}
              stroke={colors.transparent.white06}
              strokeWidth={strokeWidth}
            />
            <Line
              x1={cellSize * 2}
              y1={cellSize}
              x2={cellSize}
              y2={cellSize * 2}
              stroke={colors.transparent.white10}
              strokeWidth={strokeWidth}
            />
          </Pattern>
        </Defs>
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="url(#carbonWeave)"
          opacity={opacity}
        />
      </Svg>
    </View>
  );
}
