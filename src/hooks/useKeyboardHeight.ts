import { useRef, useEffect } from 'react';
import { Animated, Keyboard, Platform, Easing } from 'react-native';

type UseKeyboardHeightOptions = {
  /** Bottom padding when keyboard is hidden (default: 0) */
  defaultPadding?: number;
};

/**
 * Custom hook for keyboard-aware animations synced with iOS keyboard timing.
 * Returns an Animated.Value that tracks keyboard height.
 *
 * @example
 * const keyboardHeight = useKeyboardHeight({ defaultPadding: 32 });
 * <Animated.View style={{ marginBottom: keyboardHeight }}>
 */
export function useKeyboardHeight(options: UseKeyboardHeightOptions = {}) {
  const { defaultPadding = 0 } = options;

  const keyboardHeight = useRef(new Animated.Value(defaultPadding)).current;
  const KEYBOARD_TOGGLE_SPEED = 0.73

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height + 8,
        duration: (e.duration || 250) * KEYBOARD_TOGGLE_SPEED,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, e => {
      Animated.timing(keyboardHeight, {
        toValue: defaultPadding,
        duration: (e.duration || 250) * KEYBOARD_TOGGLE_SPEED,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeight, defaultPadding]);

  return keyboardHeight;
}
