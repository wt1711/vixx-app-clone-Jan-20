import { useRef, useState, useEffect } from 'react';
import { Animated, Easing } from 'react-native';
import { colors } from '../../theme';

type ColorStop = {
  pos: number;
  color: [number, number, number];
};

const COLOR_STOPS: ColorStop[] = [
  { pos: 0, color: [163, 68, 0] }, // orange (#A34400)
  { pos: 0.33, color: [168, 85, 247] }, // purple (#A855F7)
  { pos: 0.66, color: [6, 182, 212] }, // cyan (#06B6D4)
  { pos: 1, color: [163, 68, 0] }, // back to orange
];

function interpolateColor(value: number): string {
  let startStop = COLOR_STOPS[0];
  let endStop = COLOR_STOPS[1];

  for (let i = 0; i < COLOR_STOPS.length - 1; i++) {
    if (value >= COLOR_STOPS[i].pos && value <= COLOR_STOPS[i + 1].pos) {
      startStop = COLOR_STOPS[i];
      endStop = COLOR_STOPS[i + 1];
      break;
    }
  }

  const range = endStop.pos - startStop.pos;
  const progress = range > 0 ? (value - startStop.pos) / range : 0;

  const r = Math.round(
    startStop.color[0] + (endStop.color[0] - startStop.color[0]) * progress,
  );
  const g = Math.round(
    startStop.color[1] + (endStop.color[1] - startStop.color[1]) * progress,
  );
  const b = Math.round(
    startStop.color[2] + (endStop.color[2] - startStop.color[2]) * progress,
  );

  return `rgb(${r}, ${g}, ${b})`;
}

type UseSparkleAnimationResult = {
  pulseAnim: Animated.Value;
  sparkleColor: string;
};

export function useSparkleAnimation(
  isAnimating: boolean,
): UseSparkleAnimationResult {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const [sparkleColor, setSparkleColor] = useState<string>(
    colors.accent.primary,
  );

  // Interpolate color based on animation value
  useEffect(() => {
    const listenerId = colorAnim.addListener(({ value }) => {
      setSparkleColor(interpolateColor(value));
    });

    return () => colorAnim.removeListener(listenerId);
  }, [colorAnim]);

  // Run animations when isAnimating changes
  useEffect(() => {
    if (isAnimating) {
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );

      const colorAnimation = Animated.loop(
        Animated.timing(colorAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      );

      scaleAnimation.start();
      colorAnimation.start();

      return () => {
        scaleAnimation.stop();
        colorAnimation.stop();
      };
    } else {
      pulseAnim.setValue(1);
      colorAnim.setValue(0);
    }
  }, [isAnimating, pulseAnim, colorAnim]);

  return { pulseAnim, sparkleColor };
}
