import { useRef, useEffect } from 'react';
import { Animated, ViewStyle } from 'react-native';

type UseAnimatedHeightOptions = {
  maxHeight: number;
  marginBottom?: number;
};

type UseAnimatedHeightResult = {
  animatedStyle: {
    maxHeight: Animated.AnimatedInterpolation<number>;
    opacity: Animated.Value;
    marginBottom: Animated.AnimatedInterpolation<number>;
  };
};

export function useAnimatedHeight(
  isVisible: boolean,
  options: UseAnimatedHeightOptions,
): UseAnimatedHeightResult {
  const { maxHeight, marginBottom = 8 } = options;
  const heightAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(heightAnim, {
      toValue: isVisible ? 1 : 0,
      useNativeDriver: false,
      friction: 10,
      tension: 80,
    }).start();
  }, [isVisible, heightAnim]);

  const animatedStyle = {
    maxHeight: heightAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxHeight],
    }),
    opacity: heightAnim,
    marginBottom: heightAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, marginBottom],
    }),
  };

  return { animatedStyle };
}
