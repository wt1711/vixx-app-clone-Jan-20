import React from 'react';
import Svg, { G, Line, Rect, Path } from 'react-native-svg';
import { colors } from 'src/theme';

type VixxLogoProps = {
  size?: number;
  color?: string;
};

export function VixxLogo({
  size = 20,
  color = colors.text.primary,
}: VixxLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      {/* Left eye (X) */}
      <G stroke={color} strokeWidth="20" strokeLinecap="round">
        <Line x1="150" y1="170" x2="200" y2="220" />
        <Line x1="200" y1="170" x2="150" y2="220" />
      </G>

      {/* Right eye (X) */}
      <G stroke={color} strokeWidth="20" strokeLinecap="round">
        <Line x1="312" y1="170" x2="362" y2="220" />
        <Line x1="362" y1="170" x2="312" y2="220" />
      </G>

      {/* Mouth line */}
      <Rect x="156" y="260" width="200" height="18" rx="9" fill={color} />

      {/* Tongue */}
      <Path
        fill={color}
        d="M 238.50 363.38
          L 232.75 362.62 L 226.25 358.62 L 220.12 350.50 L 216.50 342.62
          L 214.50 329.00 L 214.50 309.50 L 215.88 302.50 L 217.88 298.25
          L 243.88 298.25 L 240.62 315.25 L 240.12 326.25 L 240.62 333.00
          L 243.88 333.00 L 256.00 307.50 L 268.12 333.00 L 271.38 333.00
          L 271.88 326.25 L 271.38 315.25 L 268.12 298.25 L 294.12 298.25
          L 296.12 302.50 L 297.50 309.50 L 297.50 329.00 L 295.50 342.62
          L 291.88 350.50 L 285.75 358.62 L 279.25 362.62 L 273.50 363.38
          L 256.00 364.00 Z"
      />
    </Svg>
  );
}
