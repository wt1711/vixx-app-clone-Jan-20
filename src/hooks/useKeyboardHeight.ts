import { useRef, useEffect } from 'react';
import { Animated, Keyboard, Platform } from 'react-native';

type UseKeyboardHeightOptions = {
  /** Bottom padding when keyboard is hidden (default: 0) */
  defaultPadding?: number;
  /** Animation duration in ms (default: 100) */
  duration?: number;
};

/**
 * Custom hook for fast keyboard-aware animations.
 * Returns an Animated.Value that tracks keyboard height.
 *
 * @example
 * const keyboardHeight = useKeyboardHeight({ defaultPadding: 32 });
 * <Animated.View style={{ marginBottom: keyboardHeight }}>
 */
export function useKeyboardHeight(options: UseKeyboardHeightOptions = {}) {
  const { defaultPadding = 0, duration = 100 } = options;

  const keyboardHeight = useRef(new Animated.Value(defaultPadding)).current;

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      Animated.timing(keyboardHeight, {
        toValue: defaultPadding,
        duration,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight, defaultPadding, duration]);

  return keyboardHeight;
}
